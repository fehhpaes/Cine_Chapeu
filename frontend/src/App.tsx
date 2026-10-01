import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DrawPage } from './pages/DrawPage.tsx';
import { OscarPage } from './pages/OscarPage.tsx';
import { RouletteModal } from './components/RouletteModal.tsx';
import { CreateSessionModal } from './components/CreateSessionModal.tsx';
import { Member } from './types/index.ts';

const AppContent: React.FC = () => {
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [selectedMemberForSession, setSelectedMemberForSession] = useState<Member | null>(null);

  const handleSelectMemberForSession = (member: Member) => {
    setSelectedMemberForSession(member);
    setIsCreateSessionOpen(true);
  };

  const handleCloseCreateSession = () => {
    setIsCreateSessionOpen(false);
    setSelectedMemberForSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cinema-950 text-slate-100">
      {/* Barra de Navegação Superior */}
      <Navbar onOpenCreateSession={() => setIsCreateSessionOpen(true)} />

      {/* Conteúdo Principal com Rotas */}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
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
          <Route path="/oscar" element={<OscarPage />} />
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
        onSessionCreated={() => {
          // Recarrega páginas se necessário
          window.location.reload();
        }}
        initialMember={selectedMemberForSession}
      />

      {/* Rodapé Elegante */}
      <footer className="border-t border-white/5 py-8 bg-cinema-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎩</span>
            <span className="font-cinematic font-bold text-slate-300">Cine Chapéu</span>
            <span>— Sistema de Registro & Roleta de Cinema</span>
          </div>
          <p>Feito para amigos apaixonados por cinema 🍿</p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
