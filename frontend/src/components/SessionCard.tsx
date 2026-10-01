import React from 'react';
import { Calendar, Clock, Film, Sparkles } from 'lucide-react';
import { Session } from '../types/index.ts';

interface SessionCardProps {
  session: Session;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const { movieId, memberId, drawnCategory, exhibitionDate, notes } = session;

  const formattedDate = new Date(exhibitionDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative flex flex-col bg-cinema-850 rounded-2xl overflow-hidden border border-white/10 hover:border-gold-500/50 shadow-lg hover:shadow-2xl hover:shadow-gold-500/10 transition-all duration-300 transform hover:-translate-y-1.5">
      
      {/* Pôster do Filme */}
      <div className="relative w-full aspect-[2/3] bg-cinema-900 overflow-hidden">
        {movieId?.posterUrl ? (
          <img
            src={movieId.posterUrl}
            alt={movieId.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500">
            <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
            <span className="text-xs text-center font-medium">Sem Pôster</span>
          </div>
        )}

        {/* Gradiente de overlay no pôster */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-black/30 opacity-90 group-hover:opacity-80 transition-opacity" />

        {/* Categoria Sorteada Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cinema-950/80 backdrop-blur-md text-gold-400 border border-gold-500/30 shadow-md">
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span className="truncate max-w-[170px]">{drawnCategory}</span>
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/10">
            {movieId?.releaseYear || '—'}
          </span>
        </div>

        {/* Membro Responsável (Avatar flutuante) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-cinema-950/90 backdrop-blur-md pl-1.5 pr-3 py-1 rounded-full border border-white/15">
          <img
            src={memberId?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
            alt={memberId?.name || 'Membro'}
            className="w-6 h-6 rounded-full object-cover border border-gold-400/60"
          />
          <span className="text-xs font-medium text-slate-200">
            Escolhido por <strong className="text-gold-400 font-semibold">{memberId?.name || 'Amigo'}</strong>
          </span>
        </div>
      </div>

      {/* Detalhes da Sessão */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-gold-400 transition-colors line-clamp-1">
            {movieId?.title || 'Título Indisponível'}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            Dir. {movieId?.director || 'Desconhecido'} {movieId?.originalTitle && movieId.originalTitle !== movieId.title ? `• (${movieId.originalTitle})` : ''}
          </p>

          {/* Gêneros */}
          {movieId?.genres && movieId.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {movieId.genres.slice(0, 3).map((genre, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cinema-800 text-slate-300 border border-white/5"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Informações de Exibição & Notas */}
        <div className="pt-3 border-t border-white/5 flex flex-col gap-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold-500" />
              {formattedDate}
            </span>
            {movieId?.runtime ? (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {movieId.runtime} min
              </span>
            ) : null}
          </div>

          {notes && (
            <div className="p-2 rounded-lg bg-cinema-900/60 border border-white/5 text-[11px] text-slate-300 italic line-clamp-2">
              "{notes}"
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
