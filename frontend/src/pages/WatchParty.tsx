import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { MonitorPlay, RefreshCw, ExternalLink, Radio } from 'lucide-react';

export function WatchParty() {
  const { isAdmin } = useAuth();
  const [iframeKey, setIframeKey] = useState(0);

  // ID fixo da sala de transmissão
  const STREAM_ID = 'cinechapeu2026';

  // Link de visualização para os membros (embutido no site com controles de vídeo e cabeçalho oculto)
  const viewerUrl = `https://vdo.ninja/?view=${STREAM_ID}&autoplay&videocontrols&hideheader`;

  // Link de transmissão para o Admin (abre em nova aba já configurado para tela + bitrate moderado)
  const broadcasterUrl = `https://vdo.ninja/?push=${STREAM_ID}&screenshare&quality=1&vb=2500`;

  const handleReloadPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-amber-500 font-cinema tracking-wide">
            Cine Chapéu: Watch Party
          </h1>
          <p className="text-sm text-neutral-400">
            Transmissão ao vivo direta pelo navegador via VDO.Ninja.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {isAdmin && (
            <a
              href={broadcasterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-bold text-sm rounded-lg hover:bg-amber-400 transition-colors shadow-md cursor-pointer"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Iniciar Transmissão (Admin)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleReloadPlayer}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm rounded-lg transition-colors cursor-pointer border border-neutral-700"
            title="Recarregar player caso o vídeo não apareça"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Player</span>
          </button>

          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Sala Ao Vivo</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-6xl aspect-video bg-neutral-900 rounded-xl overflow-hidden shadow-2xl relative border border-white/10">
        <iframe
          key={iframeKey}
          src={viewerUrl}
          title="Cine Chapéu Watch Party"
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="w-full max-w-6xl mt-4 text-xs text-neutral-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>
          💡 Dica: Se o vídeo ficar sem som ao entrar, clique no player para ativar o áudio.
        </span>
        {isAdmin && (
          <span className="text-amber-500/80 font-medium">
            Admin: Ao abrir o VDO.Ninja, escolha a tela/janela do filme e marque &quot;Compartilhar áudio do sistema&quot;.
          </span>
        )}
      </div>
    </div>
  );
}

export default WatchParty;
