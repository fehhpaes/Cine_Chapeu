import React, { useState, useEffect } from 'react';
import { Search, Film, Calendar, Tag, FileText, Check, X, Loader2, Plus } from 'lucide-react';
import { Member, TMDBMovieSearchItem } from '../types/index.ts';
import { tmdbApi, sessionsApi, membersApi } from '../api/client.ts';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
  initialMember?: Member | null;
  initialCategory?: string;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  initialMember,
  initialCategory = '',
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovieSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovieSearchItem | null>(null);

  const [memberId, setMemberId] = useState('');
  const [drawnCategory, setDrawnCategory] = useState('');
  const [exhibitionDate, setExhibitionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      if (initialMember) {
        setMemberId(initialMember._id);
      }
      if (initialCategory) {
        setDrawnCategory(initialCategory);
      }
    }
  }, [isOpen, initialMember, initialCategory]);

  const loadMembers = async () => {
    try {
      const data = await membersApi.getAll();
      setMembers(data);
      if (!initialMember && data.length > 0 && !memberId) {
        setMemberId(data[0]._id);
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  };

  const handleSearchTMDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setErrorMessage(null);

      const results = await tmdbApi.search(searchQuery.trim());
      setSearchResults(results);

      if (!results || results.length === 0) {
        setErrorMessage(`Nenhum filme encontrado para "${searchQuery.trim()}".`);
      }
    } catch (err: any) {
      console.error('Erro na busca do TMDB:', err);
      setErrorMessage(err.response?.data?.message || 'Falha ao buscar filmes no TMDB.');
    } finally {
      setSearching(false);
    }
  };

  const getPosterUrl = (posterPath?: string | null) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setSearchQuery('');
    setSearchResults([]);
    setDrawnCategory('');
    setNotes('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMovie) {
      setErrorMessage('Por favor, pesquise e selecione um filme da lista antes de salvar.');
      return;
    }

    if (!memberId || !drawnCategory.trim() || !exhibitionDate) {
      setErrorMessage('Preencha todos os campos obrigatórios (membro, data e categoria).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const releaseYear = selectedMovie.release_date
        ? parseInt(selectedMovie.release_date.slice(0, 4), 10)
        : new Date().getFullYear();

      const posterUrl = getPosterUrl(selectedMovie.poster_path) || '';

      await sessionsApi.create({
        movie: {
          tmdbId: selectedMovie.id,
          title: selectedMovie.title,
          originalTitle: selectedMovie.original_title || selectedMovie.title,
          posterUrl,
          releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
        },
        memberId,
        drawnCategory: drawnCategory.trim(),
        exhibitionDate,
        notes: notes.trim(),
      });

      onSessionCreated();
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar sessão:', err);
      setErrorMessage(err.response?.data?.message || 'Erro ao registrar sessão no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-7 shadow-2xl my-8 transition-all">
        
        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Título */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-50">
              Cadastrar Sessão
            </h2>
            <p className="text-[11px] text-zinc-400">
              Selecione o filme no TMDB e salve no histórico do Cine Chapéu.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* 1. Busca TMDB */}
        <div className="mb-5 p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <label className="block text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-2 font-display">
            1. Pesquisar Filme no TMDB
          </label>
          <form onSubmit={handleSearchTMDB} className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: O Poderoso Chefão, Interestelar, Oppenheimer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {/* Resultados de Busca */}
          {searchResults.length > 0 && !selectedMovie && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {searchResults.map((item) => {
                const posterUrl = getPosterUrl(item.poster_path);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMovie(item)}
                    className="group cursor-pointer p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/70 transition-all flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full bg-zinc-950 rounded overflow-hidden mb-1.5 relative">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-zinc-600 bg-zinc-900 p-2">
                          <Film className="w-6 h-6 mb-1 stroke-[1.5]" />
                          <span>Sem Pôster</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-100 group-hover:text-amber-400 truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500">
                      {item.release_date ? item.release_date.slice(0, 4) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filme Selecionado Preview */}
          {selectedMovie && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {getPosterUrl(selectedMovie.poster_path) ? (
                  <img
                    src={getPosterUrl(selectedMovie.poster_path)!}
                    alt={selectedMovie.title}
                    className="w-10 h-14 rounded object-cover border border-amber-500/30"
                  />
                ) : (
                  <div className="w-10 h-14 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <Film className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                    <Check className="w-3 h-3" /> Filme Selecionado
                  </span>
                  <h4 className="text-xs font-bold text-zinc-100 truncate">
                    {selectedMovie.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {selectedMovie.original_title} ({selectedMovie.release_date ? selectedMovie.release_date.slice(0, 4) : '—'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="text-[11px] text-zinc-400 hover:text-zinc-100 px-2.5 py-1 rounded bg-zinc-800"
              >
                Trocar
              </button>
            </div>
          )}
        </div>

        {/* 2. Formulário da Sessão */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Membro */}
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

            {/* Data de Exibição */}
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

          {/* Categoria Sorteada */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Categoria / Tema Sorteado *
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: Ficção Científica, Clássico dos Anos 90, Cinema Asiático..."
                value={drawnCategory}
                onChange={(e) => setDrawnCategory(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Notas e Comentários (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Comentários sobre a sessão, discussões..."
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
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedMovie}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Sessão...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Salvar Sessão</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateSessionModal;
