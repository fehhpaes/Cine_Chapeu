import React from 'react';
import { Search, RotateCcw, User, Calendar, Tag } from 'lucide-react';
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
    <div className="w-full bg-zinc-900/90 rounded-xl p-4 sm:p-5 border border-zinc-800 shadow-md mb-8 transition-all">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 font-display">
            Filtros do Catálogo
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition-colors px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Busca por Título */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Buscar Filme
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Digite o título..."
              value={movieTitle}
              onChange={(e) => onMovieTitleChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Filtro por Membro */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Membro Responsável
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedMember}
              onChange={(e) => onMemberChange(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todos os Membros</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} {!m.active ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Categoria Sorteada */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Categoria Sorteada
          </label>
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Ano */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Ano de Exibição
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer transition-all"
            >
              <option value="">Todos os Anos</option>
              {years.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
