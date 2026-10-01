import React, { useState, useEffect } from 'react';
import { Trophy, Crown, X, Loader2, Check, Film, Plus } from 'lucide-react';
import { Session } from '../types/index.ts';
import { sessionsApi, awardsApi } from '../api/client.ts';

interface CreateAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardCreated: () => void;
  initialYear?: number;
}

const CATEGORY_SUGGESTIONS = [
  '🏆 Melhor Filme do Ano',
  '🤯 Maior Plot Twist (Mind-Blowing)',
  '🗑️ Lixeira do Ano (Pior Escolha)',
  '🍿 Melhor Escolha de Membro',
  '🎭 Melhor Atuação / Personagem Icônico',
  '😭 Filme Mais Emocionante / Choro Livre',
  '👁️ Melhor Visual / Fotografia',
];

export const CreateAwardModal: React.FC<CreateAwardModalProps> = ({
  isOpen,
  onClose,
  onAwardCreated,
  initialYear,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [year, setYear] = useState<number>(initialYear || new Date().getFullYear());
  const [categoryName, setCategoryName] = useState<string>('');
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
  const [winnerId, setWinnerId] = useState<string>('');
  
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtra as sessões para exibir apenas as do ano selecionado
  const filteredSessions = year
    ? sessions.filter((session) => {
        if (!session.exhibitionDate) return false;
        return new Date(session.exhibitionDate).getFullYear() === Number(year);
      })
    : sessions;

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      if (initialYear) setYear(initialYear);
    }
  }, [isOpen, initialYear]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await sessionsApi.getAll();
      setSessions(data);
    } catch (err) {
      console.error('Erro ao carregar sessões para indicados:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleToggleNominee = (sessionId: string) => {
    setSelectedNominees((prev) => {
      if (prev.includes(sessionId)) {
        const next = prev.filter((id) => id !== sessionId);
        if (winnerId === sessionId) {
          setWinnerId(next.length > 0 ? next[0] : '');
        }
        return next;
      } else {
        const next = [...prev, sessionId];
        if (!winnerId) {
          setWinnerId(sessionId);
        }
        return next;
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setErrorMessage('Informe o nome da categoria.');
      return;
    }

    if (selectedNominees.length === 0) {
      setErrorMessage('Selecione pelo menos um filme para ser indicado.');
      return;
    }

    if (!winnerId || !selectedNominees.includes(winnerId)) {
      setErrorMessage('Selecione qual dos filmes indicados é o vencedor.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await awardsApi.create({
        year: Number(year),
        categoryName: categoryName.trim(),
        nominees: selectedNominees,
        winner: winnerId,
      });

      onAwardCreated();
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar prêmio do Oscar:', err);
      setErrorMessage(err.response?.data?.message || 'Erro ao criar premiação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setSelectedNominees([]);
    setWinnerId('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 shadow-2xl my-8 transition-all">
        
        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Título */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-50">
              Cadastrar Categoria do Oscar
            </h2>
            <p className="text-[11px] text-zinc-400">
              Selecione os indicados do grupo e consagre o grande vencedor.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Linha: Ano e Nome da Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Ano da Edição *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                required
                min={2000}
                max={2099}
                className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Nome da Categoria *
              </label>
              <input
                type="text"
                placeholder="Ex: 🏆 Melhor Filme, 🤯 Maior Plot Twist, 🗑️ Lixeira do Ano..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Sugestões Rápidas de Categorias */}
          <div>
            <span className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider font-display">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCategoryName(sug)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Indicados (Nominees) */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider font-display">
                Selecione os Filmes Indicados ({selectedNominees.length})
              </label>
              <span className="text-[10px] text-zinc-500">
                Clique para marcar/desmarcar
              </span>
            </div>

            {loadingSessions ? (
              <div className="py-8 flex justify-center text-amber-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-500">
                Nenhuma sessão encontrada para o ano de {year}.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredSessions.map((session) => {
                  const isNominee = selectedNominees.includes(session._id);
                  const isCurrentWinner = winnerId === session._id;
                  const movie = session.movieId;

                  return (
                    <div
                      key={session._id}
                      onClick={() => handleToggleNominee(session._id)}
                      className={`group relative p-2 rounded-lg border cursor-pointer flex flex-col transition-all ${
                        isCurrentWinner
                          ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-md'
                          : isNominee
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-zinc-950/60 border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-[2/3] w-full bg-zinc-950 rounded overflow-hidden mb-1 relative">
                        {movie?.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                            <Film className="w-6 h-6" />
                          </div>
                        )}
                        {isNominee && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-zinc-950 p-0.5 rounded shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-[11px] font-bold text-zinc-100 truncate">
                        {movie?.title || 'Filme'}
                      </h4>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {session.memberId?.name || 'Membro'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seleção do Vencedor (Winner) */}
          {selectedNominees.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 font-display flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Definir o Vencedor da Categoria:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedNominees.map((nomineeId) => {
                  const session = sessions.find((s) => s._id === nomineeId);
                  if (!session) return null;
                  const isWinner = winnerId === nomineeId;

                  return (
                    <button
                      key={nomineeId}
                      type="button"
                      onClick={() => setWinnerId(nomineeId)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                        isWinner
                          ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="text-xs block truncate">
                          {session.movieId?.title || 'Filme'}
                        </span>
                        <span className={`text-[10px] block ${isWinner ? 'text-zinc-950/80' : 'text-zinc-500'}`}>
                          Trazido por {session.memberId?.name || 'Membro'}
                        </span>
                      </div>
                      {isWinner && <Crown className="w-4 h-4 flex-shrink-0 fill-current" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedNominees.length === 0 || !winnerId}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Consagrando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cadastrar Prêmio</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CreateAwardModal;
