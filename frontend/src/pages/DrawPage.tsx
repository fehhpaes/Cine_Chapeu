import React, { useState, useEffect, useRef } from 'react';
import { Dices, Users, Sparkles, Trophy, Plus, Check, X, Loader2, Film, Tag, RefreshCw, Lock } from 'lucide-react';
import { Member } from '../types/index.ts';
import { membersApi, sessionsApi } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DrawPageProps {
  onSelectMemberForSession: (member: Member, category?: string) => void;
}

const DEFAULT_THEMES = [
  'Ficção Científica com Plot Twist',
  'Cinema Asiático Premiado',
  'Clássico dos Anos 80/90',
  'Terror Psicológico',
  'Filme com Narrativa Não-Linear',
  'Comédia Ácida / Humor Negro',
  'Suspense de Tribunal / Investigação',
  'Animação Fora do Padrão',
  'Obra-Prima do Cinema Europeu',
  'Filme com Menos de 90 Minutos',
  'Viagem Espacial / Ficção Científica',
  'Filme Cult / Desconhecido',
];

export const DrawPage: React.FC<DrawPageProps> = ({ onSelectMemberForSession }) => {
  const { isAdmin, openPinModal } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Sorteio do Membro
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados do Sorteio da Categoria/Tema
  const [categories, setCategories] = useState<string[]>(DEFAULT_THEMES);
  const [isCategorySpinning, setIsCategorySpinning] = useState(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number | null>(null);
  const [drawnCategory, setDrawnCategory] = useState<string | null>(null);

  // Formulário para novo membro
  const [newMemberName, setNewMemberName] = useState('');
  const [creatingMember, setCreatingMember] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, filterOptions] = await Promise.all([
        membersApi.getAll(),
        sessionsApi.getFilterOptions().catch(() => ({ categories: [], years: [] })),
      ]);
      setMembers(membersData);

      if (filterOptions.categories && filterOptions.categories.length > 0) {
        const uniqueThemes = Array.from(new Set([...DEFAULT_THEMES, ...filterOptions.categories]));
        setCategories(uniqueThemes);
      }
    } catch (err) {
      setError('Erro ao carregar dados da roleta.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (memberId: string) => {
    if (!isAdmin) return;
    try {
      const updated = await membersApi.toggleActive(memberId);
      setMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newMemberName.trim()) return;

    try {
      setCreatingMember(true);
      const created = await membersApi.create({
        name: newMemberName.trim(),
      });
      setMembers((prev) => [...prev, created]);
      setNewMemberName('');
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
    } finally {
      setCreatingMember(false);
    }
  };

  const handleSpinMembers = async () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }

    const activeMembers = members.filter((m) => m.active);
    if (activeMembers.length === 0 || isSpinning) return;

    try {
      setIsSpinning(true);
      setWinner(null);
      setError(null);

      const result = await membersApi.drawRandom();
      const chosenMember = result.member;

      const chosenIdx = activeMembers.findIndex((m) => m._id === chosenMember._id);
      const targetIdx = chosenIdx !== -1 ? chosenIdx : 0;

      const minRounds = 5;
      const totalSteps = activeMembers.length * minRounds + targetIdx;
      let currentStep = 0;
      let currentIndex = highlightedIndex !== null ? highlightedIndex : 0;

      const runStep = () => {
        currentIndex = (currentIndex + 1) % activeMembers.length;
        setHighlightedIndex(currentIndex);
        currentStep++;

        if (currentStep < totalSteps) {
          const progress = currentStep / totalSteps;
          const baseDelay = 45;
          const extraDelay = Math.pow(progress, 3) * 420;
          const currentDelay = baseDelay + extraDelay;

          timeoutRef.current = setTimeout(runStep, currentDelay);
        } else {
          setHighlightedIndex(targetIdx);
          setWinner(chosenMember);
          setIsSpinning(false);
        }
      };

      runStep();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar sorteio.');
      setIsSpinning(false);
    }
  };

  const handleSpinCategory = () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }

    if (categories.length === 0 || isCategorySpinning) return;

    setIsCategorySpinning(true);
    setDrawnCategory(null);

    const targetIdx = Math.floor(Math.random() * categories.length);
    const chosenCategory = categories[targetIdx];

    const minRounds = 4;
    const totalSteps = categories.length * minRounds + targetIdx;
    let currentStep = 0;
    let currentIndex = highlightedCategoryIndex !== null ? highlightedCategoryIndex : 0;

    const runStep = () => {
      currentIndex = (currentIndex + 1) % categories.length;
      setHighlightedCategoryIndex(currentIndex);
      currentStep++;

      if (currentStep < totalSteps) {
        const progress = currentStep / totalSteps;
        const currentDelay = 40 + Math.pow(progress, 3) * 380;
        setTimeout(runStep, currentDelay);
      } else {
        setHighlightedCategoryIndex(targetIdx);
        setDrawnCategory(chosenCategory);
        setIsCategorySpinning(false);
      }
    };

    runStep();
  };

  const activeMembers = members.filter((m) => m.active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Cabeçalho */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2.5 font-display">
          <Dices className="w-3.5 h-3.5" />
          <span>Sorteador Oficial</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-zinc-50 tracking-tight">
          A Roleta do Chapéu
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Sorteie o amigo responsável e o tema da próxima sessão de cinema.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Grid: Roleta e Gestão (Se !isAdmin, a roleta ocupa largura total centralizada) */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'max-w-4xl mx-auto'} gap-6`}>
        
        {/* Painel Central / Roleta de Membros */}
        <div className={`${isAdmin ? 'lg:col-span-2' : ''} bg-zinc-900/80 rounded-xl p-5 sm:p-8 border border-zinc-800 shadow-lg flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Sparkles className="w-3.5 h-3.5" />
                Membros no Chapéu ({activeMembers.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                {isSpinning ? 'Sorteando em alta velocidade...' : 'Apenas membros ativos participam'}
              </span>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-amber-500 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs text-zinc-400">Carregando membros...</span>
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Nenhum membro ativo cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
                {activeMembers.map((member, idx) => {
                  const isHighlighted = isSpinning && highlightedIndex === idx;
                  const isFinalWinner = !isSpinning && winner?._id === member._id;
                  const isDimmed = !isSpinning && winner && !isFinalWinner;

                  return (
                    <div
                      key={member._id}
                      className={`relative min-h-[120px] p-5 rounded-xl border flex flex-col items-center justify-center text-center cursor-default ${
                        // 1. Destaque Final do Vencedor
                        isFinalWinner
                          ? 'ring-2 ring-amber-500 bg-amber-500/10 text-amber-400 scale-110 shadow-[0_0_30px_rgba(245,158,11,0.3)] z-20 transition-all duration-500 border-amber-500'
                          // 2. Destaque Dinâmico Durante o Giro
                          : isHighlighted
                          ? 'ring-2 ring-zinc-100 bg-zinc-800 scale-105 shadow-lg border-zinc-500 transition-all duration-75 text-zinc-50 z-10'
                          // 3. Efeito Dimmed nos demais quando há vencedor
                          : isDimmed
                          ? 'bg-zinc-950/40 border-zinc-900 opacity-40 scale-95 transition-all duration-300'
                          // 4. Estado Normal (Minimalista - Apenas o Nome)
                          : 'bg-zinc-950/70 border-zinc-800/90 opacity-85 hover:opacity-100 hover:border-zinc-700 transition-all duration-200'
                      }`}
                    >
                      {/* Coroa / Troféu do Vencedor */}
                      {isFinalWinner && (
                        <div className="absolute -top-3 inset-x-0 flex justify-center animate-bounce">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                            <Trophy className="w-3.5 h-3.5 fill-zinc-950 stroke-none" />
                            <span>Vencedor</span>
                          </span>
                        </div>
                      )}

                      {/* Nome do Membro Centralizado */}
                      <h3
                        className={`text-2xl md:text-3xl font-bold font-display tracking-wide truncate max-w-full leading-none ${
                          isFinalWinner
                            ? 'text-amber-400'
                            : isHighlighted
                            ? 'text-zinc-50'
                            : 'text-zinc-200'
                        }`}
                      >
                        {member.name}
                      </h3>

                      {/* Subtítulo APENAS para o Vencedor */}
                      {isFinalWinner && (
                        <span className="text-xs font-bold text-amber-400 mt-2 font-sans">
                          👑 Escolhido pelo Chapéu!
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão de Rodar a Roleta de Membros */}
          <div className="flex justify-center pt-4 border-t border-zinc-800">
            {isAdmin ? (
              <button
                onClick={handleSpinMembers}
                disabled={isSpinning || activeMembers.length === 0}
                className={`w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isSpinning
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md hover:shadow-amber-500/20 active:scale-95'
                }`}
              >
                <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'O Chapéu Está Girando...' : winner ? 'Sortear Outro Amigo' : 'Girar Roleta de Amigos!'}</span>
              </button>
            ) : (
              <button
                onClick={openPinModal}
                className="w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-white transition-all shadow-md group"
              >
                <Lock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Login Admin para Girar Roleta</span>
              </button>
            )}
          </div>

          {/* Seção Opcional: Sorteio de Tema / Categoria */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-bold text-sm text-zinc-100 uppercase tracking-wider">
                  Sorteador de Tema da Sessão
                </h3>
              </div>
              <button
                onClick={handleSpinCategory}
                disabled={isCategorySpinning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCategorySpinning ? 'animate-spin' : ''}`} />
                <span>{isCategorySpinning ? 'Sorteando...' : 'Sortear Tema'}</span>
              </button>
            </div>

            {/* Display do Tema Sorteado */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center relative overflow-hidden">
              {drawnCategory ? (
                <div className="animate-fadeIn">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    Tema Definido para a Sessão:
                  </span>
                  <h4 className="font-display font-black text-lg sm:text-xl text-zinc-50 mt-1">
                    "{drawnCategory}"
                  </h4>
                </div>
              ) : isCategorySpinning ? (
                <div className="text-amber-400 text-sm font-display font-bold animate-pulse">
                  {categories[highlightedCategoryIndex ?? 0]}
                </div>
              ) : (
                <span className="text-xs text-zinc-500">
                  {isAdmin
                    ? 'Clique em "Sortear Tema" para definir o gênero ou desafio do filme.'
                    : 'Apenas administradores podem acionar o sorteador de tema.'}
                </span>
              )}
            </div>
          </div>

          {/* Banner de Ação Rápida */}
          {winner && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div>
                <h4 className="font-display font-bold text-base text-zinc-50">
                  🎉 {winner.name} foi sorteado(a)!
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {drawnCategory ? `Tema: "${drawnCategory}"` : 'Pronto para cadastrar a sessão oficial no catálogo.'}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => onSelectMemberForSession(winner, drawnCategory || undefined)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md active:scale-95 transition-all flex-shrink-0"
                >
                  <Film className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Registrar Filme de {winner.name}</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Gerenciamento de Membros (Exclusivo Admin) */}
        {isAdmin && (
          <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm mb-1 font-display">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Membros do Clube</span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-4">
                Ative ou pause participantes do sorteio.
              </p>

              {/* Adicionar Membro */}
              <form onSubmit={handleAddMember} className="flex gap-1.5 mb-4">
                <input
                  type="text"
                  placeholder="Nome do amigo..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={creatingMember || !newMemberName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </form>

              {/* Lista de Membros */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      member.active
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-zinc-900/40 border-zinc-800/40 opacity-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm font-display font-bold text-zinc-100 truncate">{member.name}</h4>
                    </div>

                    <button
                      onClick={() => handleToggleActive(member._id)}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 flex-shrink-0 ${
                        member.active
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {member.active ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center">
              Membros pausados são ignorados pelo sorteio.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default DrawPage;

