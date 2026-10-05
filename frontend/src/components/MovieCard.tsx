import React from 'react';
import { Sparkles, Film, Calendar, Pencil, Trash2 } from 'lucide-react';
import { Session } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface MovieCardProps {
  session: Session;
  isWinner?: boolean;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  session,
  isWinner = false,
  onEdit,
  onDelete,
}) => {
  const { isAdmin } = useAuth();
  const { movieId, memberId, drawnCategory, exhibitionDate } = session;

  const formattedDate = exhibitionDate
    ? new Date(exhibitionDate).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(session);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(session);
    }
  };

  return (
    <div
      className={`group relative aspect-[2/3] w-full rounded-xl overflow-hidden cursor-pointer bg-zinc-900 ring-1 transition-all duration-300 ${
        isWinner
          ? 'ring-2 ring-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
          : 'ring-white/10 hover:ring-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5'
      }`}
    >
      {/* 1. Imagem do Pôster de Cinema */}
      {movieId?.posterUrl ? (
        <img
          src={movieId.posterUrl}
          alt={movieId.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 p-4">
          <Film className="w-10 h-10 mb-2 stroke-[1.5]" />
          <span className="text-xs font-medium text-center">Sem Pôster</span>
        </div>
      )}

      {/* 2. Gradient Overlay Cinematográfico */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

      {/* 3. Botões de Ação de Admin (Editar & Excluir) */}
      {isAdmin && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              onClick={handleEditClick}
              title="Editar sessão"
              className="p-1.5 rounded-md bg-zinc-950/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 backdrop-blur-md border border-white/10 shadow-md transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              title="Excluir sessão"
              className="p-1.5 rounded-md bg-zinc-950/80 hover:bg-red-500 hover:text-white text-zinc-300 backdrop-blur-md border border-white/10 shadow-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 4. Badge Superior de Ano */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-white/10 font-display">
          {movieId?.releaseYear || '—'}
        </span>
      </div>

      {/* 5. Informações Sobrepostas na Base do Card */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex flex-col justify-end">
        {/* Categoria Sorteada */}
        {drawnCategory && (
          <div className="transform translate-y-2 opacity-85 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span className="truncate max-w-[190px]">{drawnCategory}</span>
            </span>
          </div>
        )}

        {/* Título do Filme na Fonte Display */}
        <h3 className="font-display font-bold text-base sm:text-lg text-zinc-50 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
          {movieId?.title || 'Título Desconhecido'}
        </h3>

        {/* Diretor */}
        {movieId?.director && (
          <p className="text-[11px] text-zinc-400 line-clamp-1 font-sans mt-0.5">
            Dir. {movieId.director}
          </p>
        )}

        {/* Membro Responsável + Data da Sessão */}
        <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="truncate">
            Trazido por <strong className="text-zinc-200 font-medium">{memberId?.name || 'Amigo'}</strong>
          </span>

          {formattedDate && (
            <span className="flex items-center gap-1 text-zinc-500 flex-shrink-0 text-[10px]">
              <Calendar className="w-3 h-3 text-zinc-600" />
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
