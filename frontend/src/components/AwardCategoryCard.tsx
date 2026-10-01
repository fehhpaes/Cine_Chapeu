import React from 'react';
import { Crown, Film } from 'lucide-react';
import { Award, Session } from '../types/index.ts';

interface AwardCategoryCardProps {
  award: Award;
  concealWinner?: boolean;
}

export const AwardCategoryCard: React.FC<AwardCategoryCardProps> = ({ award, concealWinner = false }) => {
  const { categoryName, winner, nominees } = award;
  const winnerSessionId = winner?._id;

  return (
    <div className="w-full mb-14">
      {/* Título da Categoria com Peso Visual Máximo */}
      <h2 className="text-amber-500 font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-6 border-b border-zinc-800 pb-3 flex items-center justify-between">
        <span>{categoryName}</span>
        <span className="text-xs md:text-sm font-sans font-medium text-zinc-500">
          {nominees?.length || 0} indicados
        </span>
      </h2>

      {/* Grid de Indicados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 items-start">
        {nominees?.map((session: Session) => {
          const isWinner = !concealWinner && session._id === winnerSessionId;
          const movie = session.movieId;
          const member = session.memberId;

          return (
            <div
              key={session._id}
              className={`group relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 transition-all duration-300 ${
                isWinner
                  ? 'ring-4 ring-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-105 z-20'
                  : 'ring-1 ring-zinc-800 opacity-80 hover:opacity-100 hover:ring-zinc-700 transition-all duration-300 z-10'
              }`}
            >
              {/* Badge Luxuosa de Vencedor no Topo */}
              {isWinner && (
                <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-xl shadow-black/80 font-display">
                  <Crown className="w-4 h-4 fill-zinc-950 stroke-none" />
                  <span>VENCEDOR</span>
                </div>
              )}

              {/* Pôster do Filme */}
              {movie?.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 p-2">
                  <Film className="w-8 h-8 mb-1 stroke-[1.5]" />
                  <span className="text-[10px]">Sem Pôster</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

              {/* Informações Sobrepostas na Base */}
              <div className="absolute inset-x-0 bottom-0 p-3.5 z-20 flex flex-col justify-end">
                <h4
                  className={`font-display font-bold text-sm sm:text-base line-clamp-1 leading-snug ${
                    isWinner ? 'text-amber-400 font-extrabold' : 'text-zinc-100'
                  }`}
                >
                  {movie?.title || 'Filme'}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-1 font-sans mt-0.5">
                  {movie?.releaseYear || ''} • Dir. {movie?.director || 'Desconhecido'}
                </p>

                {/* Membro que indicou (Minimalista & Tipográfico) */}
                <div className="pt-2 mt-2 border-t border-white/10 flex items-center">
                  <span className="text-[11px] text-zinc-300 truncate">
                    Trazido por <strong className="font-semibold text-zinc-100">{member?.name || 'Membro'}</strong>
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

export default AwardCategoryCard;
