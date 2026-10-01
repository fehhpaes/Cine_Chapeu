import React, { useState, useEffect } from 'react';
import { Dices, Users, Sparkles, Trophy, Plus, CheckCircle2, XCircle, RefreshCw, Film } from 'lucide-react';
import { Member } from '../types/index.ts';
import { membersApi } from '../api/client.ts';

interface DrawPageProps {
  onSelectMemberForSession: (member: Member) => void;
}

export const DrawPage: React.FC<DrawPageProps> = ({ onSelectMemberForSession }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [winner, setWinner] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulário para novo membro
  const [newMemberName, setNewMemberName] = useState('');
  const [creatingMember, setCreatingMember] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await membersApi.getAll();
      setMembers(data);
    } catch (err) {
      setError('Erro ao carregar lista de membros.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (memberId: string) => {
    try {
      const updated = await membersApi.toggleActive(memberId);
      setMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      setCreatingMember(true);
      const created = await membersApi.create({
        name: newMemberName.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMemberName.trim())}`,
      });
      setMembers((prev) => [...prev, created]);
      setNewMemberName('');
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
    } finally {
      setCreatingMember(false);
    }
  };

  const handleSpin = async () => {
    const activeMembers = members.filter((m) => m.active);
    if (activeMembers.length === 0 || isSpinning) return;

    try {
      setIsSpinning(true);
      setWinner(null);
      setError(null);

      const result = await membersApi.drawRandom();
      const chosen = result.member;

      const chosenIdx = activeMembers.findIndex((m) => m._id === chosen._id);
      const targetIdx = chosenIdx !== -1 ? chosenIdx : 0;

      let current = 0;
      let speed = 50;
      const totalSteps = activeMembers.length * 5 + targetIdx;

      let step = 0;
      const interval = () => {
        current = (current + 1) % activeMembers.length;
        setHighlightedIndex(current);
        step++;

        if (step < totalSteps) {
          if (step > totalSteps - 12) {
            speed += 40;
          }
          setTimeout(interval, speed);
        } else {
          setHighlightedIndex(targetIdx);
          setWinner(chosen);
          setIsSpinning(false);
        }
      };

      setTimeout(interval, speed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar sorteio.');
      setIsSpinning(false);
    }
  };

  const activeMembers = members.filter((m) => m.active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Cabeçalho */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Dices className="w-3.5 h-3.5" />
          <span>Sorteador Oficial</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-cinematic text-white">
          A Roleta do Chapéu
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2">
          Deixe a sorte decidir quem trará o filme para a próxima sessão de cinema do grupo!
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm text-center max-w-xl mx-auto">
          {error}
        </div>
      )}

      {/* Seção Principal da Roleta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel Central / Roleta (2 colunas em desktop) */}
        <div className="lg:col-span-2 glass-gold rounded-3xl p-6 sm:p-10 border border-gold-500/30 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gold-500/20 pb-4 mb-6">
              <span className="text-sm font-bold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Membros Concorrendo ({activeMembers.length})
              </span>
              <span className="text-xs text-slate-400">
                Apenas membros ativos participam
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gold-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-sm">Carregando lista de amigos...</span>
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Nenhum membro ativo para o sorteio. Ative membros no painel ao lado!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {activeMembers.map((member, idx) => {
                  const isSelected = idx === highlightedIndex && isSpinning;
                  const isFinalWinner = winner?._id === member._id && !isSpinning;

                  return (
                    <div
                      key={member._id}
                      className={`relative p-4 rounded-2xl border transition-all duration-150 flex flex-col items-center text-center ${
                        isFinalWinner
                          ? 'bg-gradient-to-b from-amber-500/30 to-cinema-900 border-gold-400 ring-2 ring-gold-400 shadow-xl shadow-gold-500/30 scale-105'
                          : isSelected
                          ? 'bg-gold-500/20 border-gold-400 scale-102 shadow-lg shadow-gold-500/20'
                          : 'bg-cinema-900/70 border-white/5 opacity-85'
                      }`}
                    >
                      <div className="relative mb-2">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className={`w-16 h-16 rounded-full object-cover border-2 ${
                            isFinalWinner || isSelected ? 'border-gold-400' : 'border-slate-700'
                          }`}
                        />
                        {isFinalWinner && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-gold-500 to-yellow-300 text-cinema-950 p-1.5 rounded-full shadow-md">
                            <Trophy className="w-4 h-4 fill-cinema-950 stroke-none" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white truncate max-w-full">
                        {member.name}
                      </h3>
                      <span className="text-[10px] text-gold-400 font-semibold mt-0.5">
                        {isFinalWinner ? '👑 Vencedor Sorteado!' : 'Pronto para o Sorteio'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resultado Vencedor */}
          {winner && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-gold-500/20 via-amber-500/30 to-yellow-500/20 border-2 border-gold-400 text-center animate-fadeIn shadow-xl shadow-gold-500/20">
              <div className="flex items-center justify-center gap-2 text-gold-400 text-xs font-black uppercase tracking-widest mb-1">
                <Trophy className="w-4 h-4" />
                <span>Membro Escolhido Pela Sorte</span>
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-cinematic">
                🎉 {winner.name} foi sorteado(a)!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Prepare a pipoca! É hora de cadastrar o filme escolhido por {winner.name}.
              </p>
              <button
                onClick={() => onSelectMemberForSession(winner)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gold-500 hover:bg-gold-400 text-cinema-950 shadow-md transition-all active:scale-95"
              >
                <Film className="w-4 h-4 stroke-[2.5]" />
                Registrar Sessão com {winner.name}
              </button>
            </div>
          )}

          {/* Botão de Rodar a Roleta */}
          <div className="flex justify-center pt-4 border-t border-gold-500/20">
            <button
              onClick={handleSpin}
              disabled={isSpinning || activeMembers.length === 0}
              className={`w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all shadow-xl ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-400 text-cinema-950 hover:brightness-110 shadow-gold-500/30 hover:scale-105 active:scale-95'
              }`}
            >
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Girando o Chapéu...' : winner ? 'Rodar Roleta Novamente' : 'Sortear Amigo!'}</span>
            </button>
          </div>

        </div>

        {/* Gerenciamento de Membros (1 coluna) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
              <Users className="w-5 h-5 text-gold-500" />
              <span>Lista do Grupo</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ative ou pause membros para ajustar quem participa do sorteio.
            </p>

            {/* Adicionar Novo Membro */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Nome do amigo..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-3 py-2 bg-cinema-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                disabled={creatingMember || !newMemberName.trim()}
                className="p-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-cinema-950 font-bold transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </form>

            {/* Lista com Toggle */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member._id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    member.active
                      ? 'bg-cinema-900/90 border-white/10'
                      : 'bg-cinema-900/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{member.name}</h4>
                      <span className="text-[10px] text-slate-400">
                        {member.active ? 'Ativo no sorteio' : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(member._id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                      member.active
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {member.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Inativo</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-slate-400 text-center">
            💡 Membros inativos não serão sorteados pela roleta.
          </div>
        </div>

      </div>

    </div>
  );
};
