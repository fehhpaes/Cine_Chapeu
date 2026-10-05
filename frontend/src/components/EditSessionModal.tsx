import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Calendar,
  Tag,
  FileText,
  Check,
  X,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Session, Member, TMDBMovieSearchItem } from '../types/index.ts';
import { sessionsApi, membersApi, tmdbApi } from '../api/client.ts';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  onSessionUpdated: () => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [drawnCategory, setDrawnCategory] = useState('');
  const [exhibitionDate, setExhibitionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tier, setTier] = useState('Unranked');

  // Estados de busca do TMDB
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovieSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNewMovie, setSelectedNewMovie] = useState<TMDBMovieSearchItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Inicialização ao abrir modal
  useEffect(() => {
    if (isOpen) {
      loadMembers();
      if (session) {
        setMemberId(session.memberId?._id || '');
        setDrawnCategory(session.drawnCategory || '');
        if (session.exhibitionDate) {
          const date = new Date(session.exhibitionDate);
          setExhibitionDate(date.toISOString().split('T')[0]);
        } else {
          setExhibitionDate(new Date().toISOString().split('T')[0]);
        }
        setNotes(session.notes || '');
        setTier(session.tier || 'Unranked');
      }
      setSelectedNewMovie(null);
      setSearchQuery('');
      setSearchResults([]);
      setIsDropdownOpen(false);
      setErrorMessage(null);
    }
  }, [isOpen, session]);

  // Fecha o dropdown de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce para busca no TMDB
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await tmdbApi.search(trimmed);
        setSearchResults(results || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Erro na busca do TMDB:', err);
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = async () => {
    try {
      const data = await membersApi.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  };

  const getPosterUrl = (posterPath?: string | null) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const handleSelectMovie = (movie: TMDBMovieSearchItem) => {
    setSelectedNewMovie(movie);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRevertMovie = () => {
    setSelectedNewMovie(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!memberId || !drawnCategory.trim() || !exhibitionDate) {
      setErrorMessage('Preencha todos os campos obrigatórios (membro, data e categoria).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await sessionsApi.update(session._id, {
        memberId,
        drawnCategory: drawnCategory.trim(),
        exhibitionDate,
        notes: notes.trim(),
        tier,
        ...(selectedNewMovie ? { tmdbData: selectedNewMovie } : {}),
      });

      onSessionUpdated();
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar sessão:', err);
      setErrorMessage(err.response?.data?.message || 'Erro ao salvar alterações no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !session) return null;

  // Filme atual vs Novo Filme selecionado
  const currentMovie = session.movieId;
  const displayTitle = selectedNewMovie
    ? selectedNewMovie.title
    : currentMovie?.title || 'Filme sem Título';
  const displayPoster = selectedNewMovie
    ? getPosterUrl(selectedNewMovie.poster_path)
    : currentMovie?.posterUrl || null;
  const displayYear = selectedNewMovie
    ? selectedNewMovie.release_date?.slice(0, 4) || '—'
    : currentMovie?.releaseYear || '—';
  const displayDirector = selectedNewMovie
    ? selectedNewMovie.original_title
      ? `Original: ${selectedNewMovie.original_title}`
      : ''
    : currentMovie?.director
    ? `Dir. ${currentMovie.director}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 shadow-2xl my-8 transition-all">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Título do Modal */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Pencil className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-50">
              Editar Sessão & Corrigir Pôster
            </h2>
            <p className="text-[11px] text-zinc-400">
              Vincule o filme exato no TMDB ou altere tema, data e membro.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* 1. Busca e Correção de Filme via TMDB */}
        <div className="mb-4" ref={searchContainerRef}>
          <label className="block text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1.5 font-display flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            Buscar e Substituir Filme no TMDB
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o título do filme para buscar no TMDB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* Dropdown de Resultados da Busca */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute left-6 right-6 sm:left-7 sm:right-7 mt-1 max-h-56 overflow-y-auto bg-zinc-950/95 backdrop-blur-md border border-zinc-700/80 rounded-lg shadow-2xl z-30 divide-y divide-zinc-800/80">
              {searchResults.map((item) => {
                const poster = getPosterUrl(item.poster_path);
                const year = item.release_date ? item.release_date.slice(0, 4) : '—';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMovie(item)}
                    className="w-full text-left p-2.5 hover:bg-zinc-800/80 transition-colors flex items-center gap-3 group"
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt={item.title}
                        className="w-8 h-12 rounded object-cover border border-zinc-700/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 flex-shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        {year} {item.original_title ? `• ${item.original_title}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Cartão de Preview do Filme (Atual ou Novo Selecionado) */}
        <div
          className={`mb-5 p-3 rounded-lg border flex items-center justify-between gap-3.5 transition-all ${
            selectedNewMovie
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-zinc-950/70 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {displayPoster ? (
              <img
                src={displayPoster}
                alt={displayTitle}
                className="w-12 h-16 rounded object-cover border border-zinc-700/60 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 flex-shrink-0">
                <Film className="w-5 h-5 stroke-[1.5]" />
              </div>
            )}
            <div className="min-w-0 flex-grow">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider font-display inline-flex items-center gap-1 ${
                  selectedNewMovie ? 'text-amber-400' : 'text-zinc-500'
                }`}
              >
                {selectedNewMovie ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Novo Filme Selecionado (TMDB)
                  </>
                ) : (
                  'Filme Atual'
                )}
              </span>
              <h3 className="text-sm font-bold text-zinc-100 truncate">{displayTitle}</h3>
              <p className="text-[11px] text-zinc-400">
                {displayYear} {displayDirector ? `• ${displayDirector}` : ''}
              </p>
            </div>
          </div>

          {selectedNewMovie && (
            <button
              type="button"
              onClick={handleRevertMovie}
              title="Desfazer e manter filme original"
              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700 flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desfazer</span>
            </button>
          )}
        </div>

        {/* 3. Formulário de Campos da Sessão */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Membro Responsável */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Membro Responsável *
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Selecione o membro</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {!m.active ? '(Inativo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data da Sessão */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Data da Sessão *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={exhibitionDate}
                  onChange={(e) => setExhibitionDate(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Tema / Categoria Sorteada */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Categoria / Tema Sorteado *
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: Ficção Científica, Clássico dos Anos 90..."
                value={drawnCategory}
                onChange={(e) => setDrawnCategory(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notas / Observações */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Notas e Comentários (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Comentários sobre a sessão..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;
