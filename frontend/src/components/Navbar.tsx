import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Dices, Trophy, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onOpenCreateSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateSession }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-cinema-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Marca */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-gold-500 to-yellow-300 p-0.5 shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-cinema-900 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl">🎩</span>
              </div>
            </div>
            <div>
              <span className="font-cinematic text-2xl font-bold tracking-wider gold-gradient-text">
                CINE CHAPÉU
              </span>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest -mt-1">
                Clube de Cinema
              </p>
            </div>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/')
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Catálogo de Sessões</span>
            </Link>

            <Link
              to="/sorteio"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/sorteio')
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>A Roleta do Chapéu</span>
            </Link>

            <Link
              to="/oscar"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/oscar')
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Oscar do Grupo</span>
            </Link>
          </nav>

          {/* Botão Ação Rápida */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateSession}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-gold-500 to-amber-600 text-cinema-950 hover:brightness-110 shadow-lg shadow-gold-500/20 active:scale-95 transition-all duration-200"
            >
              <PlusCircle className="w-4 h-4 text-cinema-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Nova Sessão</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-white/5 bg-cinema-900/90 py-2 px-4 justify-around text-xs">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-gold-400' : 'text-slate-400'}`}>
          <Film className="w-4 h-4" />
          <span>Sessões</span>
        </Link>
        <Link to="/sorteio" className={`flex flex-col items-center gap-1 ${isActive('/sorteio') ? 'text-gold-400' : 'text-slate-400'}`}>
          <Dices className="w-4 h-4" />
          <span>Roleta</span>
        </Link>
        <Link to="/oscar" className={`flex flex-col items-center gap-1 ${isActive('/oscar') ? 'text-gold-400' : 'text-slate-400'}`}>
          <Trophy className="w-4 h-4" />
          <span>Oscar</span>
        </Link>
      </div>
    </header>
  );
};
