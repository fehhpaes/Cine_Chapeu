import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Users,
  Film,
  Vote as VoteIcon,
  MessageSquareQuote,
  Loader2,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  X,
  Check,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { PresenterDashboardData, OscarCeremony } from '../types/index.ts';
import { adminApi, awardsApi, ceremoniesApi } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const PresenterDashboard: React.FC = () => {
  const { isAdmin, openPinModal } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [dashboardData, setDashboardData] = useState<PresenterDashboardData | null>(null);
  const [ceremonyConfig, setCeremonyConfig] = useState<OscarCeremony | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Controle de revelação dos vencedores (Suspense do Apresentador)
  const [revealedWinners, setRevealedWinners] = useState<Record<string, boolean>>({});

  // Modal de Configuração do Período de Votação
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [votingStartDate, setVotingStartDate] = useState<string>('');
  const [votingEndDate, setVotingEndDate] = useState<string>('');
  const [isSavingCeremony, setIsSavingCeremony] = useState<boolean>(false);

  useEffect(() => {
    if (isAdmin) {
      loadYears();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedYear) {
      loadDashboard(selectedYear);
      loadCeremony(selectedYear);
    }
  }, [isAdmin, selectedYear]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const loadYears = async () => {
    try {
      const years = await awardsApi.getYears();
      if (years.length > 0) {
        setAvailableYears(years);
        setSelectedYear(years[0]);
      } else {
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
        setSelectedYear(currentYear);
      }
    } catch (err) {
      console.error('Erro ao carregar anos:', err);
    }
  };

  const loadDashboard = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDashboard(year);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard do apresentador:', err);
      if (err.response?.status === 401) {
        setError('Acesso não autorizado. Digite o PIN de administrador.');
      } else {
        setError('Erro ao carregar dados do evento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCeremony = async (year: number) => {
    try {
      const c = await ceremoniesApi.getByYear(year);
      setCeremonyConfig(c);
      if (c) {
        setVotingStartDate(c.votingStartDate.substring(0, 10));
        setVotingEndDate(c.votingEndDate.substring(0, 10));
      } else {
        setVotingStartDate(`${year}-11-01`);
        setVotingEndDate(`${year}-12-31`);
      }
    } catch (err) {
      console.warn('Cerimônia ainda não configurada para este ano:', err);
    }
  };

  const handleToggleReveal = (awardId: string) => {
    setRevealedWinners((prev) => ({
      ...prev,
      [awardId]: !prev[awardId],
    }));
  };

  const handleRevealAll = () => {
    if (!dashboardData) return;
    const allRevealed: Record<string, boolean> = {};
    dashboardData.categories.forEach((cat) => {
      allRevealed[cat.awardId] = true;
    });
    setRevealedWinners(allRevealed);
  };

  const handleSaveCeremony = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingCeremony(true);
      const saved = await ceremoniesApi.save({
        year: selectedYear,
        votingStartDate,
        votingEndDate,
      });
      setCeremonyConfig(saved);
      setIsConfigModalOpen(false);
      showToast('Datas da cerimônia de votação salvas!');
    } catch (err: any) {
      console.error('Erro ao salvar cerimônia:', err);
      setError('Falha ao salvar datas da votação.');
    } finally {
      setIsSavingCeremony(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-amber-500/10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner">
            <Lock className="w-8 h-8 stroke-[2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4 font-display">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Acesso Restrito ao Apresentador</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-zinc-100 mb-2">
            Dashboard Bloqueado
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Esta área contém a apuração dos votos em tempo real e o controle de revelação dos vencedores do Oscar.
          </p>
          <button
            onClick={openPinModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 shadow-lg shadow-amber-500/15 transition-all font-display"
          >
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span>Digitar PIN de Administrador</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cabeçalho do Apresentador */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-zinc-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 font-display">
            <Trophy className="w-3.5 h-3.5 fill-current" />
            <span>Mesa do Apresentador • Noite do Oscar</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">
            Dashboard da Cerimônia
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
            Painel exclusivo com apuração dos votos, controle de suspense ao vivo e recados dos membros.
          </p>
        </div>

        {/* Botões de Ação do Apresentador */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>Datas de Votação</span>
          </button>

          <button
            onClick={handleRevealAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition-all font-display"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Revelar Todos</span>
          </button>
        </div>
      </div>

      {/* Seletor de Ano */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium mr-2">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>Edição do Oscar:</span>
        </div>
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              setRevealedWinners({});
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedYear === year
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {year}
          </button>
        ))}

        {ceremonyConfig && (
          <span className="ml-auto text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            Votação: <strong className="text-zinc-200">{new Date(ceremonyConfig.votingStartDate).toLocaleDateString()}</strong> até <strong className="text-zinc-200">{new Date(ceremonyConfig.votingEndDate).toLocaleDateString()}</strong>
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-amber-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Contando os envelopes do Oscar {selectedYear}...</span>
        </div>
      ) : !dashboardData ? (
        <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
          Nenhum dado encontrado para o Oscar {selectedYear}.
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* ============================================================ */}
          {/* 1. CARDS DE ESTATÍSTICAS GERAIS ANUAIS */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Filmes Assistidos
                </span>
                <span className="font-display font-black text-3xl sm:text-4xl text-zinc-50">
                  {dashboardData.totalSessionsInYear}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Sessões realizadas em {selectedYear}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Film className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Membros no Chapéu
                </span>
                <span className="font-display font-black text-3xl sm:text-4xl text-zinc-50">
                  {dashboardData.totalDistinctMembersInYear}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Pessoas que trouxeram filmes</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-amber-500/30 shadow-lg relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Total de Votos
                </span>
                <span className="font-display font-black text-3xl sm:text-4xl text-amber-400">
                  {dashboardData.totalVotes}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">Cédulas apuradas</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <VoteIcon className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 2. APRESENTAÇÃO POR CATEGORIA (DISTRIBUIÇÃO DE VOTOS & SUSPENSE) */}
          {/* ============================================================ */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-800">
              <h2 className="font-display font-bold text-2xl text-zinc-50 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Apuração das Categorias</span>
              </h2>
              <span className="text-xs text-zinc-500">
                {dashboardData.categories.length} categorias cadastradas
              </span>
            </div>

            <div className="space-y-8">
              {dashboardData.categories.map((category) => {
                const isRevealed = !!revealedWinners[category.awardId];

                return (
                  <div
                    key={category.awardId}
                    className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl relative"
                  >
                    {/* Cabeçalho da Categoria */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-5">
                      <div>
                        <h3 className="font-display font-black text-xl sm:text-2xl text-amber-500">
                          {category.categoryName}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Total de Votos Apurados: <strong className="text-zinc-200">{category.totalCategoryVotes}</strong>
                        </p>
                      </div>

                      {/* Botão de Revelação de Suspense */}
                      <button
                        onClick={() => handleToggleReveal(category.awardId)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all self-start sm:self-auto ${
                          isRevealed
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow'
                        }`}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ocultar Vencedor</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Revelar Vencedor ao Vivo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Grid de Indicados com Gráfico de Votos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {category.nominees.map((item) => {
                        const { session, voteCount, percentage, isWinner } = item;
                        const movie = session.movieId;
                        const member = session.memberId;
                        const showAsWinner = isRevealed && isWinner;

                        return (
                          <div
                            key={session._id}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                              showAsWinner
                                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                                : 'bg-zinc-950/60 border-zinc-800/80'
                            }`}
                          >
                            <div className="flex gap-3 items-center mb-3">
                              {/* Pôster Compacto */}
                              <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-800 relative">
                                {movie?.posterUrl ? (
                                  <img
                                    src={movie.posterUrl}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">
                                    <Film className="w-4 h-4" />
                                  </div>
                                )}
                              </div>

                              <div className="overflow-hidden flex-1">
                                {showAsWinner && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded font-display mb-1">
                                    <Crown className="w-3 h-3 fill-amber-400 stroke-none" />
                                    VENCEDOR
                                  </span>
                                )}
                                <h4 className="font-display font-bold text-xs text-zinc-100 truncate">
                                  {movie?.title || 'Filme'}
                                </h4>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  Trazido por <strong>{member?.name || 'Membro'}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Barra de Progresso de Votos */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-zinc-200">{voteCount} votos</span>
                                <span className="text-zinc-400 font-mono font-semibold">{percentage}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    showAsWinner ? 'bg-amber-500' : 'bg-zinc-600'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. SESSÃO DE FEEDBACKS & RECADOS */}
          {/* ============================================================ */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-800">
              <h2 className="font-display font-bold text-2xl text-zinc-50 flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-amber-500" />
                <span>Recados & Feedbacks dos Membros</span>
              </h2>
              <span className="text-xs text-zinc-500">
                {dashboardData.feedbacks.length} mensagens deixadas
              </span>
            </div>

            {dashboardData.feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Nenhum recado deixado nas cédulas até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.feedbacks.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-md flex flex-col justify-between"
                  >
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic mb-4">
                      "{item.feedback}"
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[11px]">
                      <span className="font-bold text-amber-400 font-display">
                        — {item.memberName}
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CONFIGURAÇÃO DE DATAS DA VOTAÇÃO */}
      {/* ============================================================ */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-zinc-50">
                  Período da Votação • Oscar {selectedYear}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Defina quando a urna virtual abre e fecha para os membros.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCeremony} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 font-display">
                    Início da Votação *
                  </label>
                  <input
                    type="date"
                    value={votingStartDate}
                    onChange={(e) => setVotingStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 font-display">
                    Fim da Votação *
                  </label>
                  <input
                    type="date"
                    value={votingEndDate}
                    onChange={(e) => setVotingEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCeremony}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingCeremony ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Datas</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PresenterDashboard;
