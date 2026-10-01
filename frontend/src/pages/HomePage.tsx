import React, { useState, useEffect } from 'react';
import { Film, Sparkles, RefreshCw, PlusCircle, Dices } from 'lucide-react';
import { Session, Member, FilterOptions } from '../types/index.ts';
import { sessionsApi, membersApi } from '../api/client.ts';
import { SessionCard } from '../components/SessionCard.tsx';
import { SessionFilter } from '../components/SessionFilter.tsx';

interface HomePageProps {
  onOpenCreateSession: () => void;
  onOpenRoulette: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenCreateSession,
  onOpenRoulette,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], years: [] });
  const [loading, setLoading] = useState(true);

  // Estados dos filtros
  const [movieTitle, setMovieTitle] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [movieTitle, selectedMember, selectedYear, selectedCategory]);

  const loadInitialData = async () => {
    try {
      const [membersData, optionsData] = await Promise.all([
        membersApi.getAll(),
        sessionsApi.getFilterOptions(),
      ]);
      setMembers(membersData);
      setFilterOptions(optionsData);
    } catch (err) {
      console.error('Erro ao carregar opções iniciais:', err);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionsApi.getAll({
        movieTitle: movieTitle.trim() || undefined,
        memberId: selectedMember || undefined,
        year: selectedYear || undefined,
        category: selectedCategory || undefined,
      });
      setSessions(data);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setMovieTitle('');
    setSelectedMember('');
    setSelectedYear('');
    setSelectedCategory('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Banner Cinematográfico */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 mb-10 bg-gradient-to-r from-cinema-900 via-cinema-850 to-cinema-900 border border-gold-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sessões Oficiais do Grupo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-cinematic text-white leading-tight">
            Cada Encontro, Uma Nova Obra-Prima.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Acompanhe o histórico de filmes assistidos pelo grupo, descubra quem foi o responsável por cada escolha e veja as notas e temas sorteados.
          </p>

          {/* Ações Rápidas Hero */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={onOpenRoulette}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-gold-500 text-cinema-950 hover:brightness-110 shadow-lg shadow-gold-500/25 active:scale-95 transition-all"
            >
              <Dices className="w-4 h-4 stroke-[2.5]" />
              <span>Girar a Roleta de Amigos</span>
            </button>
            <button
              onClick={onOpenCreateSession}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-cinema-800/80 hover:bg-cinema-700 text-white border border-white/10 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-gold-400" />
              <span>Adicionar Sessão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Componente de Filtros Dinâmicos */}
      <SessionFilter
        movieTitle={movieTitle}
        onMovieTitleChange={setMovieTitle}
        selectedMember={selectedMember}
        onMemberChange={setSelectedMember}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        members={members}
        categories={filterOptions.categories}
        years={filterOptions.years}
        onReset={handleResetFilters}
      />

      {/* Cabeçalho da Lista de Sessões */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinematic text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-gold-500" />
            <span>Catálogo de Exibições</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Exibindo {sessions.length} {sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}
          </p>
        </div>
      </div>

      {/* Grid de Pôsteres das Sessões */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gold-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Buscando filmes do Cine Chapéu...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-cinema-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma sessão encontrada</h3>
          <p className="text-xs text-slate-400 mb-6">
            Nenhum filme corresponde aos filtros atuais ou ainda não há sessões registradas.
          </p>
          <button
            onClick={onOpenCreateSession}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gold-500 text-cinema-950 hover:bg-gold-400 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Cadastrar Primeira Sessão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sessions.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      )}

    </div>
  );
};
