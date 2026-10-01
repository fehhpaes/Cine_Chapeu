import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Dices, Trophy, Layers, Plus, Vote as VoteIcon, Presentation, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onOpenCreateSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateSession }) => {
  const location = useLocation();
  const { isAdmin, openPinModal, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/75 backdrop-blur-md border-b border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Minimalista & Tipografia Display */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg shadow-sm group-hover:border-amber-500/50 transition-colors">
              <span>🎩</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-zinc-50 group-hover:text-amber-400 transition-colors">
                CINE CHAPÉU
              </span>
              <span className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase -mt-1 font-sans">
                Clube de Cinema
              </span>
            </div>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/')
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Sessões</span>
            </Link>

            <Link
              to="/sorteio"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/sorteio')
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Roleta</span>
            </Link>

            <Link
              to="/tierlist"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/tierlist')
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tier List</span>
            </Link>

            <Link
              to="/oscar"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/oscar')
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Oscar</span>
            </Link>

            <Link
              to="/votar"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/votar')
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <VoteIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Votar</span>
            </Link>

            {/* Link Apresentador (visível, com indicador de lock se !isAdmin) */}
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive('/dashboard')
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Apresentador</span>
            </Link>
          </nav>

          {/* Área Direita: Botão Admin PIN + Ação Rápida */}
          <div className="flex items-center gap-2.5">
            {/* Botão Admin Lock / Unlock */}
            {isAdmin ? (
              <button
                onClick={logout}
                title="Modo Administrador Ativo (Clique para Sair)"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 hover:bg-amber-500/25 transition-all shadow-sm group"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Admin Ativo</span>
              </button>
            ) : (
              <button
                onClick={openPinModal}
                title="Acesso Administrador"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login Admin</span>
              </button>
            )}

            {/* Botão Nova Sessão (apenas se isAdmin) */}
            {isAdmin && (
              <button
                onClick={onOpenCreateSession}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm hover:shadow-amber-500/10 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Nova Sessão</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-zinc-800/80 bg-zinc-950/90 py-2 px-2 justify-around text-[11px]">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}
        >
          <Film className="w-4 h-4" />
          <span>Sessões</span>
        </Link>
        <Link
          to="/sorteio"
          className={`flex flex-col items-center gap-1 ${isActive('/sorteio') ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}
        >
          <Dices className="w-4 h-4" />
          <span>Roleta</span>
        </Link>
        <Link
          to="/tierlist"
          className={`flex flex-col items-center gap-1 ${isActive('/tierlist') ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}
        >
          <Layers className="w-4 h-4" />
          <span>Tier List</span>
        </Link>
        <Link
          to="/oscar"
          className={`flex flex-col items-center gap-1 ${isActive('/oscar') ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}
        >
          <Trophy className="w-4 h-4" />
          <span>Oscar</span>
        </Link>
        <Link
          to="/votar"
          className={`flex flex-col items-center gap-1 ${isActive('/votar') ? 'text-amber-400 font-semibold' : 'text-amber-400/70'}`}
        >
          <VoteIcon className="w-4 h-4" />
          <span>Votar</span>
        </Link>
        {isAdmin ? (
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-amber-400 font-bold"
          >
            <Unlock className="w-4 h-4" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={openPinModal}
            className="flex flex-col items-center gap-1 text-zinc-400"
          >
            <Lock className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};

