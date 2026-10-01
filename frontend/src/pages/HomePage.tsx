import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Loader2, Plus, Trophy, ArrowRight, Sparkles, FolderUp, ExternalLink } from 'lucide-react';
import { Session, Member, FilterOptions, OscarCeremony } from '../types/index.ts';
import { sessionsApi, membersApi, ceremoniesApi } from '../api/client.ts';
import { MovieCard } from '../components/MovieCard.tsx';
import { SessionFilter } from '../components/SessionFilter.tsx';
import { NextMovieBanner } from '../components/NextMovieBanner.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HomePageProps {
  onOpenCreateSession: () => void;
  onOpenRoulette: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenCreateSession,
  onOpenRoulette,
}) => {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [activeCeremony, setActiveCeremony] = useState<OscarCeremony | null>(null);
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
      const [membersData, optionsData, nextSessionData, ceremonyRes] = await Promise.all([
        membersApi.getAll(),
        sessionsApi.getFilterOptions(),
        sessionsApi.getNext().catch(() => null),
        ceremoniesApi.getActive().catch(() => ({ ceremony: null, isOpen: false })),
      ]);
      setMembers(membersData);
      setFilterOptions(optionsData);
      setNextSession(nextSessionData);
      if (ceremonyRes.isOpen && ceremonyRes.ceremony) {
        setActiveCeremony(ceremonyRes.ceremony);
      }
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
    <div className="relative min-h-[calc(100vh-4rem)] bg-[url('/cinema-bg.jpg')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Camada de Overlay Escura com Blur Cinematográfico */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/80 to-zinc-950/95 backdrop-blur-[2px] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 0. Banner de Votação do Oscar (Exibido quando a votação estiver aberta) */}
      {activeCeremony && (
        <Link
          to="/votar"
          className="mb-8 block p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-zinc-900 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] transition-all group relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 fill-zinc-950 stroke-none" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 font-display">
                    <Sparkles className="w-3 h-3" />
                    Votação Oficial Aberta
                  </span>
                </div>
                <h3 className="font-display font-black text-lg sm:text-xl text-zinc-50 mt-1">
                  Votação do Oscar {activeCeremony.year} está aberta!
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Encerra em {new Date(activeCeremony.votingEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}. Vote nos seus favoritos e deixe seu recado!
                </p>
              </div>
            </div>

            <div className="self-end sm:self-center flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 group-hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider font-display shadow-md transition-all">
              <span>Votar Agora</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* 1. Destaque: Banner do Próximo Filme (Hero Cinematográfico) */}
      <NextMovieBanner
        session={nextSession}
        onOpenRoulette={onOpenRoulette}
        onOpenCreateSession={onOpenCreateSession}
      />

      {/* 2. Componente de Filtros Dinâmicos */}
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

      {/* 3. Cabeçalho do Catálogo com Acesso ao Drive do Grupo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-500" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-50">
            Todas as Sessões
          </h2>
          <span className="text-xs text-zinc-500 font-medium ml-1">
            ({sessions.length} {sessions.length === 1 ? 'filme' : 'filmes'})
          </span>
        </div>

        {/* Botão de Acesso Rápido ao Google Drive do Grupo */}
        {import.meta.env.VITE_GOOGLE_DRIVE_URL && (
          <a
            href={import.meta.env.VITE_GOOGLE_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Acessar pasta compartilhada no Google Drive"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-amber-400 border border-zinc-700 transition-colors px-4 py-2 rounded-md flex items-center gap-2 w-fit text-xs font-semibold shadow-sm group"
          >
            <FolderUp className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Acessar Acervo no Drive</span>
            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-amber-400 transition-colors" />
          </a>
        )}
      </div>

      {/* 4. Grid de Pôsteres (MovieCard com aspect-[2/3]) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-500 gap-2.5">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs text-zinc-400">Carregando catálogo...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-zinc-900/60 rounded-xl p-10 text-center border border-zinc-800 max-w-md mx-auto my-8">
          <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-display font-bold text-base text-zinc-200 mb-1">Nenhuma sessão encontrada</h3>
          <p className="text-xs text-zinc-500 mb-5">
            Nenhum filme corresponde aos filtros aplicados.
          </p>
          {isAdmin && (
            <button
              onClick={onOpenCreateSession}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Cadastrar Nova Sessão
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sessions.map((session) => (
            <MovieCard key={session._id} session={session} />
          ))}
        </div>
      )}

      </div>
    </div>
  );
};

export default HomePage;
