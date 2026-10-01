import React, { useState, useEffect } from 'react';
import { Dices, Sparkles, Trophy, X, Film, RefreshCw, CheckCircle2 } from 'lucide-react';
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

      // Busca o vencedor sorteado no backend
      const result = await membersApi.drawRandom();
      const chosen = result.member;

      // Encontrar índice do vencedor
      const chosenIdx = activeMembers.findIndex((m) => m._id === chosen._id);
      const targetIdx = chosenIdx !== -1 ? chosenIdx : 0;

      // Animação de roleta acelerando e desacelerando
      let current = highlightedIndex;
      let speed = 60; // ms
      const totalSteps = activeMembers.length * 4 + targetIdx;

      let step = 0;
      const interval = () => {
        current = (current + 1) % activeMembers.length;
        setHighlightedIndex(current);
        step++;

        if (step < totalSteps) {
          if (step > totalSteps - 10) {
            speed += 35; // desacelera no final
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-cinema-900 border border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-gold-500/10 overflow-hidden">
        
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-gold-400 text-cinema-950 shadow-lg shadow-gold-500/30 mb-3 animate-bounce-gentle">
            <span className="text-3xl">🎩</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-cinematic gold-gradient-text tracking-wide">
            A Roleta do Chapéu Seletor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quem terá a honra (e a responsabilidade) de escolher o próximo filme?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Grade de Participantes Ativos */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gold-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando membros...</span>
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum membro ativo cadastrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
            {activeMembers.map((member, idx) => {
              const isSelected = idx === highlightedIndex;
              const isFinalWinner = winner?._id === member._id;

              return (
                <div
                  key={member._id}
                  className={`relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 border ${
                    isFinalWinner
                      ? 'bg-gradient-to-r from-gold-500/30 to-amber-600/30 border-gold-400 shadow-lg shadow-gold-500/40 scale-105 ring-2 ring-gold-400'
                      : isSelected
                      ? 'bg-gold-500/20 border-gold-400/80 scale-102 shadow-md shadow-gold-500/20'
                      : 'bg-cinema-850/80 border-white/5 opacity-70'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className={`w-11 h-11 rounded-full object-cover border-2 ${
                        isFinalWinner || isSelected ? 'border-gold-400' : 'border-slate-700'
                      }`}
                    />
                    {isFinalWinner && (
                      <div className="absolute -top-1.5 -right-1.5 bg-gold-400 text-cinema-950 p-0.5 rounded-full">
                        <Trophy className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isFinalWinner || isSelected ? 'text-gold-300' : 'text-slate-200'
                      }`}
                    >
                      {member.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      Ativo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner de Celebração do Vencedor */}
        {winner && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-500/20 via-amber-500/25 to-yellow-500/20 border border-gold-400/60 text-center animate-fadeIn mb-6">
            <div className="flex items-center justify-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Sorteado pelo Chapéu</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-extrabold text-white font-cinematic">
              Parabéns, {winner.name}! 🎬
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              É a sua vez de escolher o filme da próxima sessão do Cine Chapéu!
            </p>

            {onSelectMemberForSession && (
              <button
                onClick={() => {
                  onSelectMemberForSession(winner);
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gold-500 hover:bg-gold-400 text-cinema-950 shadow-md transition-transform active:scale-95"
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
            className={`w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold transition-all duration-300 shadow-xl ${
              isSpinning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10'
                : 'bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-400 text-cinema-950 hover:brightness-110 shadow-gold-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Girando a Roleta...' : winner ? 'Sortear Novamente' : 'Girar a Roleta!'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
