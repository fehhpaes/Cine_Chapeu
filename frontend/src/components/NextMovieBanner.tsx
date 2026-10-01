import React from 'react';
import { Calendar, Clock, Film, Sparkles, Dices, Plus } from 'lucide-react';
import { Session } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface NextMovieBannerProps {
  session: Session | null;
  onOpenRoulette: () => void;
  onOpenCreateSession: () => void;
}

export const NextMovieBanner: React.FC<NextMovieBannerProps> = ({
  session,
  onOpenRoulette,
  onOpenCreateSession,
}) => {
  const { isAdmin } = useAuth();

  // Caso não haja nenhuma sessão futura agendada
  if (!session) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 mb-10 bg-zinc-900/80 border border-zinc-800 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-display">
              <Sparkles className="w-3 h-3" />
              <span>Próximo Encontro</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-50 tracking-tight">
              Nenhum filme agendado no momento.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Que tal girar a roleta do chapéu para escolher quem trará a próxima obra-prima?
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenRoulette}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm active:scale-95 transition-all"
            >
              <Dices className="w-4 h-4 stroke-[2.5]" />
              <span>Girar a Roleta</span>
            </button>
            {isAdmin && (
              <button
                onClick={onOpenCreateSession}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Agendar Sessão</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { movieId, memberId, drawnCategory, exhibitionDate, notes } = session;

  const formattedDate = exhibitionDate
    ? new Date(exhibitionDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'A definir';

  const posterUrl = movieId?.posterUrl || '';

  return (
    <div className="relative overflow-hidden rounded-2xl mb-10 border border-zinc-800 shadow-2xl bg-zinc-950 transition-all">
      
      {/* 1. Imagem de Fundo com Blur Intenso e Overlay Dark */}
      {posterUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/80 pointer-events-none" />

      {/* 2. Conteúdo em Duas Colunas */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
        
        {/* Coluna Esquerda: Pôster do Filme */}
        <div className="w-48 sm:w-56 md:w-64 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex-shrink-0 group relative">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movieId?.title || 'Pôster'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-4">
              <Film className="w-10 h-10 mb-2 stroke-[1.5]" />
              <span className="text-xs font-medium text-center">Sem Pôster</span>
            </div>
          )}
        </div>

        {/* Coluna Direita: Informações e Tipografia Monumental */}
        <div className="flex flex-col justify-between flex-grow text-center md:text-left h-full">
          <div>
            {/* Tag Superior */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold tracking-widest uppercase mb-3 font-display">
              <Sparkles className="w-3.5 h-3.5" />
              <span>🌟 EM BREVE</span>
            </div>

            {/* Título do Filme */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-zinc-50 tracking-tight leading-tight">
              {movieId?.title || 'Próximo Filme'}
            </h1>

            {/* Diretor & Ano */}
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
              {movieId?.releaseYear ? `${movieId.releaseYear} • ` : ''}
              Dir. {movieId?.director || 'Desconhecido'}
              {movieId?.originalTitle && movieId.originalTitle !== movieId.title ? ` (${movieId.originalTitle})` : ''}
            </p>

            {/* Gêneros */}
            {movieId?.genres && movieId.genres.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mt-3">
                {movieId.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Linhas de Informações Detalhadas */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2 text-xs sm:text-sm text-zinc-300">
              <div>
                <span className="text-zinc-500">Apresentado por: </span>
                <strong className="text-amber-400 font-display text-sm sm:text-base font-bold">
                  {memberId?.name || 'Membro'}
                </strong>
              </div>

              <div>
                <span className="text-zinc-500">Tema: </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium">
                  {drawnCategory}
                </span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Data da Sessão: <strong className="text-zinc-200">{formattedDate}</strong>
                </span>

                {movieId?.runtime ? (
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {movieId.runtime} min
                  </span>
                ) : null}
              </div>

              {notes && (
                <p className="mt-3 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 italic max-w-xl">
                  "{notes}"
                </p>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={onOpenRoulette}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm active:scale-95 transition-all"
            >
              <Dices className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Girar Nova Roleta</span>
            </button>
            {isAdmin && (
              <button
                onClick={onOpenCreateSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Nova Sessão</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default NextMovieBanner;
