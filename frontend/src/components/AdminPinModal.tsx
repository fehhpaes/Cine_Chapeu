import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AdminPinModal: React.FC = () => {
  const { isPinModalOpen, closePinModal, login } = useAuth();
  const [pinInput, setPinInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPinModalOpen) {
      setPinInput('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isPinModalOpen]);

  if (!isPinModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setError('Por favor, digite o PIN de administrador.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(pinInput.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'PIN incorreto.');
      inputRef.current?.select();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-center">
        
        {/* Fechar Modal */}
        <button
          onClick={closePinModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícone de Cadeado de Segurança */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <KeyRound className="w-7 h-7 stroke-[2]" />
        </div>

        <h3 className="font-display font-black text-xl text-zinc-100 mb-1">
          Acesso de Administrador
        </h3>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Digite o PIN de segurança para gerenciar membros, sessões, categorias e acessar o painel do apresentador.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-medium animate-in shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-[0.6em] text-2xl font-mono font-black py-3 px-4 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl text-amber-400 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <Lock className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !pinInput}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 active:scale-98 text-zinc-950 shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none font-display"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Desbloquear Painel</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-zinc-600 mt-4">
          Visitantes comuns podem votar e navegar sem necessidade de login.
        </p>

      </div>
    </div>
  );
};
