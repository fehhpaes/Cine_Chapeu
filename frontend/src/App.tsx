import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DrawPage } from './pages/DrawPage.tsx';
import { AwardsPage } from './pages/AwardsPage.tsx';
import { TierListPage } from './pages/TierListPage.tsx';
import { VotingPage } from './pages/VotingPage.tsx';
import { PresenterDashboard } from './pages/PresenterDashboard.tsx';
import { RouletteModal } from './components/RouletteModal.tsx';
import { CreateSessionModal } from './components/CreateSessionModal.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { Member } from './types/index.ts';

const AppContent: React.FC = () => {
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [selectedMemberForSession, setSelectedMemberForSession] = useState<Member | null>(null);
  const [selectedCategoryForSession, setSelectedCategoryForSession] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectMemberForSession = (member: Member, category?: string) => {
    setSelectedMemberForSession(member);
    if (category) {
      setSelectedCategoryForSession(category);
    }
    setIsCreateSessionOpen(true);
  };

  const handleCloseCreateSession = () => {
    setIsCreateSessionOpen(false);
    setSelectedMemberForSession(null);
    setSelectedCategoryForSession('');
  };

  const handleSessionCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* Barra de Navegação Superior */}
      <Navbar onOpenCreateSession={() => setIsCreateSessionOpen(true)} />

      {/* Conteúdo Principal com Rotas */}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                key={refreshKey}
                onOpenCreateSession={() => setIsCreateSessionOpen(true)}
                onOpenRoulette={() => setIsRouletteOpen(true)}
              />
            }
          />
          <Route
            path="/sorteio"
            element={
              <DrawPage onSelectMemberForSession={handleSelectMemberForSession} />
            }
          />
          <Route path="/tierlist" element={<TierListPage />} />
          <Route path="/oscar" element={<AwardsPage />} />
          <Route path="/votar" element={<VotingPage />} />
          <Route path="/dashboard" element={<PresenterDashboard />} />
        </Routes>
      </main>

      {/* Modal da Roleta do Chapéu */}
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        onSelectMemberForSession={handleSelectMemberForSession}
      />

      {/* Modal de Criação de Sessão / Busca TMDB */}
      <CreateSessionModal
        isOpen={isCreateSessionOpen}
        onClose={handleCloseCreateSession}
        onSessionCreated={handleSessionCreated}
        initialMember={selectedMemberForSession}
        initialCategory={selectedCategoryForSession}
      />

      {/* Modal Global de Autenticação Admin PIN */}
      <AdminPinModal />

      {/* Rodapé Minimalista */}
      <footer className="border-t border-zinc-800/80 py-6 bg-zinc-950 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>🎩</span>
            <span className="font-display font-bold text-zinc-300">Cine Chapéu</span>
            <span>— Clube de Cinema & Roleta</span>
          </div>
          <p>Desenvolvido para amigos cinéfilos 🍿</p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
