import React from 'react';
import { Search, Filter, RotateCcw, User, Calendar, Tag } from 'lucide-react';
import { Member } from '../types/index.ts';

interface SessionFilterProps {
  movieTitle: string;
  onMovieTitleChange: (val: string) => void;
  selectedMember: string;
  onMemberChange: (val: string) => void;
  selectedYear: string;
  onYearChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  members: Member[];
  categories: string[];
  years: number[];
  onReset: () => void;
}

export const SessionFilter: React.FC<SessionFilterProps> = ({
  movieTitle,
  onMovieTitleChange,
  selectedMember,
  onMemberChange,
  selectedYear,
  onYearChange,
  selectedCategory,
  onCategoryChange,
  members,
  categories,
  years,
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    movieTitle || selectedMember || selectedYear || selectedCategory
  );

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gold-400 font-semibold text-sm">
          <Filter className="w-4 h-4" />
          <span>Filtros do Catálogo</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400 transition-colors px-2.5 py-1 rounded-lg bg-cinema-800/60 hover:bg-cinema-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Busca por Título */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Filme
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={movieTitle}
              onChange={(e) => onMovieTitleChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-cinema-900/80 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/80 focus:ring-1 focus:ring-gold-500/50 transition-all"
            />
          </div>
        </div>

        {/* Filtro por Membro */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Membro Responsável
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedMember}
              onChange={(e) => onMemberChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-cinema-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-gold-500/80 focus:ring-1 focus:ring-gold-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todos os Membros</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} {!m.active ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Categoria Sorteada */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Categoria Sorteada
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-cinema-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-gold-500/80 focus:ring-1 focus:ring-gold-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Ano */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Ano de Exibição
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-cinema-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-gold-500/80 focus:ring-1 focus:ring-gold-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todos os Anos</option>
              {years.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
