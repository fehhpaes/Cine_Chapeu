import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Send,
  Sparkles,
  MessageSquareQuote,
  Check,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { Member, Award, OscarCeremony, Session } from '../types/index.ts';
import { ceremoniesApi, membersApi, awardsApi, votesApi } from '../api/client.ts';

export const VotingPage: React.FC = () => {
  const [ceremony, setCeremony] = useState<OscarCeremony | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [awards, setAwards] = useState<Award[]>([]);
  
  // Mapeamento de votos: awardId -> sessionId
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasVotedBefore, setHasVotedBefore] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMemberId && ceremony) {
      checkMemberPreviousVote(ceremony.year, selectedMemberId);
    }
  }, [selectedMemberId, ceremony]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [ceremonyRes, activeMembers] = await Promise.all([
        ceremoniesApi.getActive(),
        membersApi.getActive(),
      ]);

      setIsOpen(ceremonyRes.isOpen);
      setCeremony(ceremonyRes.ceremony);
      setMembers(activeMembers);

      if (ceremonyRes.ceremony) {
        const awardsList = await awardsApi.getByYear(ceremonyRes.ceremony.year);
        setAwards(awardsList);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de votação:', err);
      setErrorMessage('Não foi possível carregar a cédula de votação.');
    } finally {
      setLoading(false);
    }
  };

  const checkMemberPreviousVote = async (year: number, memberId: string) => {
    try {
      const res = await votesApi.getMyVote(year, memberId);
      if (res.hasVoted && res.data) {
        setHasVotedBefore(true);
        // Preenche votos anteriores caso o membro queira editar
        const prevVotes: Record<string, string> = {};
        res.data.selections.forEach((sel) => {
          prevVotes[sel.awardId] = sel.sessionId;
        });
        setSelectedVotes(prevVotes);
        if (res.data.feedback) {
          setFeedback(res.data.feedback);
        }
      } else {
        setHasVotedBefore(false);
      }
    } catch (err) {
      console.warn('Erro ao verificar voto anterior:', err);
    }
  };

  const handleSelectVote = (awardId: string, sessionId: string) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [awardId]: sessionId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ceremony) {
      setErrorMessage('Nenhuma cerimônia de votação ativa no momento.');
      return;
    }

    if (!selectedMemberId) {
      setErrorMessage('Por favor, selecione seu nome antes de enviar o voto.');
      return;
    }

    if (Object.keys(selectedVotes).length === 0) {
      setErrorMessage('Por favor, vote em pelo menos uma categoria.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const selections = Object.entries(selectedVotes).map(([awardId, sessionId]) => ({
        awardId,
        sessionId,
      }));

      await votesApi.submit({
        year: ceremony.year,
        memberId: selectedMemberId,
        selections,
        feedback: feedback.trim(),
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      console.error('Erro ao submeter voto:', err);
      setErrorMessage(err.response?.data?.message || 'Erro ao enviar cédula de votação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-amber-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm text-zinc-400 font-medium">Preparando cédula do Oscar...</span>
      </div>
    );
  }

  // Tela de Confirmação e Sucesso
  if (submittedSuccess) {
    const voter = members.find((m) => m._id === selectedMemberId);
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30">
          <Trophy className="w-10 h-10 fill-zinc-950 stroke-none" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3 font-display">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Voto Computado com Sucesso!</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-zinc-50 mb-3">
          Obrigado, {voter?.name || 'Membro'}!
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
          Seus votos para o <strong>Oscar {ceremony?.year}</strong> foram salvos no cofre do Cine Chapéu. Os vencedores serão revelados no dia da cerimônia!
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition-colors"
          >
            Voltar para a Home
          </Link>
          <Link
            to="/oscar"
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition-all font-display"
          >
            Ver Categorias do Oscar
          </Link>
        </div>
      </div>
    );
  }

  // Votação não está aberta
  if (!isOpen || !ceremony) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl text-zinc-200 mb-2">
          Votação do Oscar Fechada
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          Não há nenhuma votação aberta para o Oscar no momento. Fique atento aos anúncios do clube no grupo!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Cabeçalho da Cédula */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 font-display">
          <Trophy className="w-3.5 h-3.5 fill-current" />
          <span>Cédula Oficial • Oscar {ceremony.year}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-amber-500 tracking-tight">
          Votação do Cine Chapéu
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
          Escolha os filmes que merecem a estatueta dourada em cada categoria e deixe sua mensagem para o clube.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>
            Votação aberta até {new Date(ceremony.votingEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 max-w-xl mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* Identificação do Eleitor */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
          <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 font-display">
            Quem está votando? *
          </label>
          <p className="text-xs text-zinc-400 mb-4">
            Selecione seu nome para assinar a cédula. Cada membro possui 1 voto por edição.
          </p>

          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            required
            className="w-full sm:w-80 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Selecione seu nome --</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>

          {hasVotedBefore && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Você já enviou um voto este ano. Suas escolhas abaixo atualizarão sua cédula!</span>
            </div>
          )}
        </div>

        {/* Categorias e Seleção dos Indicados */}
        {awards.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
            Nenhuma categoria cadastrada para o ano de {ceremony.year}.
          </div>
        ) : (
          <div className="space-y-10">
            {awards.map((award, index) => {
              const currentVoteSessionId = selectedVotes[award._id];

              return (
                <div
                  key={award._id}
                  className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 shadow-md relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-5">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Categoria {index + 1} de {awards.length}
                      </span>
                      <h2 className="font-display font-extrabold text-xl sm:text-2xl text-amber-500 tracking-tight">
                        {award.categoryName}
                      </h2>
                    </div>

                    <div className="text-xs text-zinc-400 font-medium self-start sm:self-auto">
                      {currentVoteSessionId ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Voto selecionado
                        </span>
                      ) : (
                        <span className="text-zinc-500">Escolha 1 indicado</span>
                      )}
                    </div>
                  </div>

                  {/* Grid de Indicados */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {award.nominees?.map((session: Session) => {
                      const isSelected = currentVoteSessionId === session._id;
                      const movie = session.movieId;
                      const member = session.memberId;

                      return (
                        <div
                          key={session._id}
                          onClick={() => handleSelectVote(award._id, session._id)}
                          className={`group relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-950 cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'ring-4 ring-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.35)] scale-102 sm:scale-105 z-10'
                              : 'ring-1 ring-zinc-800 opacity-75 hover:opacity-100 hover:ring-zinc-600'
                          }`}
                        >
                          {/* Badge de Escolha */}
                          {isSelected && (
                            <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-black/80 font-display">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>SEU VOTO</span>
                            </div>
                          )}

                          {/* Pôster */}
                          {movie?.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 p-2">
                              <Film className="w-6 h-6 mb-1 stroke-[1.5]" />
                              <span className="text-[9px]">Sem Pôster</span>
                            </div>
                          )}

                          {/* Gradiente */}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                          {/* Info */}
                          <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex flex-col justify-end">
                            <h4
                              className={`font-display font-bold text-xs sm:text-sm line-clamp-1 leading-snug ${
                                isSelected ? 'text-amber-400 font-extrabold' : 'text-zinc-100'
                              }`}
                            >
                              {movie?.title || 'Filme'}
                            </h4>
                            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                              {movie?.releaseYear || ''} • {member?.name || 'Membro'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Seção de Feedback e Recados */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-amber-500 font-display font-bold text-sm">
            <MessageSquareQuote className="w-4 h-4" />
            <span>Recados, Piadas & Feedback para o Clube</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            O que você achou das escolhas deste ano? Alguma sugestão para a próxima edição? O apresentador lerá os recados durante a cerimônia!
          </p>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Deixe seu comentário, zoeira amigável ou elogio para o grupo..."
            className="w-full px-3.5 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
          />
        </div>

        {/* Botão de Envio do Voto */}
        <div className="flex items-center justify-center pt-4 pb-12">
          <button
            type="submit"
            disabled={submitting || !selectedMemberId || Object.keys(selectedVotes).length === 0}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-xl shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50 font-display cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando Cédula...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Enviar Votos do Oscar</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default VotingPage;
