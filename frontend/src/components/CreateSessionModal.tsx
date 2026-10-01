import React, { useState, useEffect } from 'react';
import { Search, Film, Calendar, Tag, FileText, Check, X, Loader2, Sparkles } from 'lucide-react';
import { Member, TMDBMovieSearchItem } from '../types/index.ts';
import { sessionsApi, membersApi } from '../api/client.ts';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
  initialMember?: Member | null;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  initialMember,
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      if (initialMember) {
        setMemberId(initialMember._id);
      }
    }
  }, [isOpen, initialMember]);

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
      const results = await sessionsApi.searchTMDB(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMessage('Nenhum filme encontrado no TMDB.');
      }
    } catch (err: any) {
      setErrorMessage('Falha ao buscar filmes no TMDB.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie) {
      setErrorMessage('Por favor, selecione um filme antes de registrar.');
      return;
    }
    if (!memberId || !drawnCategory.trim() || !exhibitionDate) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await sessionsApi.create({
        tmdbId: selectedMovie.id,
        memberId,
        drawnCategory: drawnCategory.trim(),
        exhibitionDate,
        notes: notes.trim(),
      });

      // Sucesso
      onSessionCreated();
      onClose();
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao registrar sessão.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setSearchQuery('');
    setSearchResults([]);
    setDrawnCategory('');
    setNotes('');
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-cinema-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-600 flex items-center justify-center text-cinema-950 font-bold shadow-lg shadow-gold-500/20">
            <Film className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-cinematic text-white">
              Cadastrar Nova Sessão
            </h2>
            <p className="text-xs text-slate-400">
              Integração direta com o TMDB e registro oficial no Cine Chapéu
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* 1. Busca no TMDB */}
        <div className="mb-6 p-4 rounded-2xl bg-cinema-850 border border-white/5">
          <label className="block text-xs font-bold text-gold-400 uppercase tracking-wider mb-2">
            1. Pesquisar Filme no TMDB
          </label>
          <form onSubmit={handleSearchTMDB} className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: Interestelar, A Origem, Matrix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-cinema-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gold-500 hover:bg-gold-400 text-cinema-950 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {/* Lista de Resultados de Busca do TMDB */}
          {searchResults.length > 0 && !selectedMovie && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMovie(item)}
                  className="group cursor-pointer p-2 rounded-xl bg-cinema-900 border border-white/10 hover:border-gold-400/80 transition-all text-left flex flex-col"
                >
                  <div className="aspect-[2/3] w-full bg-cinema-800 rounded-lg overflow-hidden mb-2">
                    {item.poster_path ? (
                      <img
                        src={item.poster_path}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        Sem Imagem
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-gold-400 truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {item.release_date ? item.release_date.slice(0, 4) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Filme Selecionado Preview */}
          {selectedMovie && (
            <div className="mt-4 p-3 rounded-xl bg-gold-500/10 border border-gold-400/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {selectedMovie.poster_path && (
                  <img
                    src={selectedMovie.poster_path}
                    alt={selectedMovie.title}
                    className="w-12 h-16 rounded-lg object-cover border border-gold-400/40"
                  />
                )}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-400 uppercase tracking-wide">
                    <Check className="w-3 h-3" /> Filme Selecionado
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">
                    {selectedMovie.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedMovie.original_title} ({selectedMovie.release_date ? selectedMovie.release_date.slice(0, 4) : '—'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-cinema-800"
              >
                Trocar
              </button>
            </div>
          )}
        </div>

        {/* 2. Formulário de Dados da Sessão */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Membro */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Membro Responsável *
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-cinema-850 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-gold-500"
              >
                <option value="">Selecione o amigo</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {!m.active ? '(Inativo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Exibição */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data da Sessão *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={exhibitionDate}
                  onChange={(e) => setExhibitionDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-cinema-850 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Categoria Sorteada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoria / Tema Sorteado *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: Ficção Científica dos anos 80, Cinema Asiático, Terror Psicológico..."
                value={drawnCategory}
                onChange={(e) => setDrawnCategory(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-cinema-850 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Notas e Comentários */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notas e Memórias da Sessão (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Ex: Comentários do grupo, petiscos, reação ao final do filme..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-cinema-850 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedMovie}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-gold-500 to-amber-600 text-cinema-950 hover:brightness-110 shadow-lg shadow-gold-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Sessão...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Registrar Sessão</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
