import React, { useState, useEffect } from 'react';
import { Dices, Sparkles, Trophy, X, Film, Loader2 } from 'lucide-react';
import { Member } from '../types/index.ts';
import { membersApi } from '../api/client.ts';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMemberForSession?: (member: Member) => void;
}

export const RouletteModal: React.FC<RouletteModalProps> = ({
  isOpen,
  onClose,
  onSelectMemberForSession,
}) => {
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [winner, setWinner] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActiveMembers();
      setWinner(null);
      setError(null);
    }
  }, [isOpen]);

  const loadActiveMembers = async () => {
    try {
      setLoading(true);
      const members = await membersApi.getActive();
      setActiveMembers(members);
      if (members.length > 0) {
        setHighlightedIndex(0);
      }
    } catch (err: any) {
      setError('Erro ao carregar membros ativos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (activeMembers.length === 0 || isSpinning) return;

    try {
      setIsSpinning(true);
      setWinner(null);
      setError(null);

      const result = await membersApi.drawRandom();
      const chosen = result.member;

      const chosenIdx = activeMembers.findIndex((m) => m._id === chosen._id);
      const targetIdx = chosenIdx !== -1 ? chosenIdx : 0;

      let current = highlightedIndex;
      let speed = 60;
      const totalSteps = activeMembers.length * 4 + targetIdx;

      let step = 0;
      const interval = () => {
        current = (current + 1) % activeMembers.length;
        setHighlightedIndex(current);
        step++;

        if (step < totalSteps) {
          if (step > totalSteps - 10) {
            speed += 35;
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
      setError(err.response?.data?.message || 'Falha ao realizar sorteio.');
      setIsSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 shadow-2xl transition-all">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
            <span className="text-xl">🎩</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-zinc-50 tracking-tight">
            A Roleta do Chapéu
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Quem escolhe o próximo filme do grupo?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Grade de Participantes */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-amber-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs text-zinc-400">Carregando membros...</span>
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Nenhum membro ativo cadastrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-5">
            {activeMembers.map((member, idx) => {
              const isSelected = idx === highlightedIndex;
              const isFinalWinner = winner?._id === member._id;

              return (
                <div
                  key={member._id}
                  className={`relative min-h-[85px] p-3 rounded-lg transition-all duration-150 border flex flex-col items-center justify-center text-center ${
                    isFinalWinner
                      ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-2 ring-amber-500 scale-105'
                      : isSelected
                      ? 'bg-amber-500/10 border-amber-500/70 scale-102 ring-1 ring-amber-500/40'
                      : 'bg-zinc-950/60 border-zinc-800/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  {isFinalWinner && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-zinc-950 p-0.5 rounded-full">
                      <Trophy className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}

                  <h4
                    className={`font-display text-lg sm:text-xl font-bold tracking-wide truncate max-w-full leading-none ${
                      isFinalWinner || isSelected ? 'text-amber-400' : 'text-zinc-50'
                    }`}
                  >
                    {member.name}
                  </h4>

                  {isFinalWinner && (
                    <span className="text-[10px] font-bold text-amber-400 mt-1.5 font-sans">
                      👑 Sorteado(a)!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Vencedor Anúncio */}
        {winner && (
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-center animate-fadeIn mb-5">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 font-display">
              <Sparkles className="w-3 h-3" />
              <span>Sorteado pelo Chapéu</span>
              <Sparkles className="w-3 h-3" />
            </div>
            <h3 className="font-display font-black text-xl text-zinc-50">
              {winner.name} foi escolhido(a)! 🎬
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Hora de definir o filme da próxima sessão!
            </p>

            {onSelectMemberForSession && (
              <button
                onClick={() => {
                  onSelectMemberForSession(winner);
                  onClose();
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm transition-transform active:scale-95"
              >
                <Film className="w-3.5 h-3.5 stroke-[2.5]" />
                Registrar Sessão com {winner.name}
              </button>
            )}
          </div>
        )}

        {/* Botão de Rodar a Roleta */}
        <div className="flex justify-center">
          <button
            onClick={handleSpin}
            disabled={isSpinning || activeMembers.length === 0}
            className={`w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              isSpinning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm hover:shadow-amber-500/10 active:scale-95'
            }`}
          >
            <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Girando a Roleta...' : winner ? 'Sortear Novamente' : 'Girar Roleta!'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default RouletteModal;
