import React from 'react';
import { Trophy, Crown, Sparkles } from 'lucide-react';
import { Award, Session } from '../types/index.ts';

interface AwardCategoryCardProps {
  award: Award;
}

export const AwardCategoryCard: React.FC<AwardCategoryCardProps> = ({ award }) => {
  const { categoryName, winner, nominees } = award;

  const winnerSessionId = winner?._id;

  return (
    <div className="w-full glass-gold rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-2xl relative overflow-hidden mb-8">
      
      {/* Luz ambiente e brilho de fundo */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho da Categoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-gold-400" />
            <span>Categoria Oficial do Oscar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinematic font-bold text-white tracking-wide">
            {categoryName}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{nominees?.length || 0} Indicados</span>
        </div>
      </div>

      {/* Grid de Indicados com destaque pro Vencedor */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {nominees?.map((session: Session) => {
          const isWinner = session._id === winnerSessionId;
          const movie = session.movieId;
          const member = session.memberId;

          return (
            <div
              key={session._id}
              className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                isWinner
                  ? 'bg-gradient-to-b from-amber-500/30 to-cinema-900 border-2 border-gold-400 shadow-xl shadow-gold-500/30 scale-105 sm:scale-105 z-10 animate-pulse-glow'
                  : 'bg-cinema-900/80 border border-white/10 opacity-80 hover:opacity-100 hover:scale-102'
              }`}
            >
              {/* Badge de Vencedor */}
              {isWinner && (
                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-gradient-to-r from-yellow-400 via-gold-500 to-amber-500 text-cinema-950 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-black/60">
                  <Crown className="w-3.5 h-3.5 fill-cinema-950 stroke-none" />
                  <span>VENCEDOR</span>
                </div>
              )}

              {/* Pôster */}
              <div className="relative aspect-[2/3] w-full bg-cinema-950 overflow-hidden">
                {movie?.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    Sem Pôster
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-black/20" />
              </div>

              {/* Informações do Filme & Membro */}
              <div className="p-3 flex flex-col flex-grow justify-between gap-2">
                <div>
                  <h4
                    className={`font-bold text-xs sm:text-sm line-clamp-1 ${
                      isWinner ? 'text-gold-300' : 'text-white'
                    }`}
                  >
                    {movie?.title || 'Filme'}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {movie?.releaseYear || ''} • Dir. {movie?.director || 'Desconhecido'}
                  </p>
                </div>

                {/* Membro que indicou */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-1.5">
                  <img
                    src={member?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={member?.name}
                    className={`w-5 h-5 rounded-full object-cover border ${
                      isWinner ? 'border-gold-400' : 'border-slate-700'
                    }`}
                  />
                  <span className="text-[11px] text-slate-300 truncate">
                    Por <strong className="font-semibold text-slate-200">{member?.name || 'Membro'}</strong>
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
