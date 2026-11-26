import { useEffect, useRef, useState, useCallback } from 'react';
import { Peer, MediaConnection, DataConnection } from 'peerjs';
import { useAuth } from '../context/AuthContext.tsx';
import {
  MonitorPlay,
  Users,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Radio,
  AlertCircle,
} from 'lucide-react';

const ROOM_ID = 'cine-chapeu-admin-room-2026';

// Servidores STUN públicos + TURN gratuito (Metered OpenRelay) para garantir transposição de NAT/Firewall
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turns:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
  },
};

export function WatchParty() {
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const peerRef = useRef<Peer | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const connectedMembersRef = useRef<Map<string, DataConnection>>(new Map());
  const activeCallsRef = useRef<Map<string, MediaConnection>>(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Iniciando...');
  const [isConnecting, setIsConnecting] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(isAdmin);
  const [hasJoined, setHasJoined] = useState(isAdmin);

  // Manipulador de chamadas para o Admin
  const handleAdminCall = useCallback((memberId: string) => {
    if (!peerRef.current || !currentStreamRef.current) return;

    try {
      // Fecha chamada anterior para o mesmo membro se existir
      if (activeCallsRef.current.has(memberId)) {
        activeCallsRef.current.get(memberId)?.close();
      }

      const call = peerRef.current.call(memberId, currentStreamRef.current);
      if (!call) return;

      activeCallsRef.current.set(memberId, call);
      setViewerCount(activeCallsRef.current.size);

      call.on('close', () => {
        activeCallsRef.current.delete(memberId);
        setViewerCount(activeCallsRef.current.size);
      });

      call.on('error', (err) => {
        console.warn(`[PeerJS Admin] Erro na chamada para ${memberId}:`, err);
        activeCallsRef.current.delete(memberId);
        setViewerCount(activeCallsRef.current.size);
      });
    } catch (err) {
      console.error(`[PeerJS Admin] Falha ao ligar para ${memberId}:`, err);
    }
  }, []);

  // Membro conecta ao Admin via DataConnection para pedir a stream
  const connectToAdmin = useCallback(() => {
    if (isAdmin || !peerRef.current || peerRef.current.destroyed) return;

    setIsConnecting(true);
    setConnectionStatus('Procurando transmissão do Admin...');

    try {
      const conn = peerRef.current.connect(ROOM_ID, { reliable: true });

      conn.on('open', () => {
        setIsConnecting(false);
        setConnectionStatus('Conectado à sala! Aguardando vídeo...');
        conn.send({ type: 'PULL_STREAM' });
      });

      conn.on('close', () => {
        setConnectionStatus('Conexão com o Admin encerrada.');
      });

      conn.on('error', (err) => {
        console.warn('[PeerJS Membro] Conexão com Admin falhou:', err);
        setIsConnecting(false);
        setConnectionStatus('Admin offline ou reconectando...');
      });
    } catch (err) {
      console.error('[PeerJS Membro] Erro ao conectar ao Admin:', err);
      setIsConnecting(false);
    }
  }, [isAdmin]);

  // Inicialização do PeerJS
  useEffect(() => {
    let isCancelled = false;

    const initPeer = () => {
      try {
        const peer = isAdmin
          ? new Peer(ROOM_ID, PEER_CONFIG)
          : new Peer(PEER_CONFIG);

        peerRef.current = peer;

        peer.on('open', (id) => {
          if (isCancelled) return;
          console.log(`[PeerJS] Peer aberto com ID: ${id} (isAdmin: ${isAdmin})`);
          setConnectionStatus(isAdmin ? 'Pronto para transmitir' : 'Conectado. Sintonizando...');

          if (!isAdmin) {
            connectToAdmin();
          }
        });

        if (isAdmin) {
          // Admin ouve novos membros chegando na sala
          peer.on('connection', (conn) => {
            const memberId = conn.peer;
            console.log(`[PeerJS Admin] Novo membro conectado: ${memberId}`);
            connectedMembersRef.current.set(memberId, conn);

            conn.on('data', (data: any) => {
              if (data?.type === 'PULL_STREAM' && currentStreamRef.current) {
                console.log(`[PeerJS Admin] Membro ${memberId} solicitou stream`);
                handleAdminCall(memberId);
              }
            });

            conn.on('close', () => {
              connectedMembersRef.current.delete(memberId);
            });

            // Se já estiver transmitindo, liga para o novo membro imediatamente
            if (currentStreamRef.current) {
              handleAdminCall(memberId);
            }
          });
        } else {
          // Membro ouve chamada de vídeo recebida do Admin
          peer.on('call', (call: MediaConnection) => {
            console.log('[PeerJS Membro] Chamada de vídeo recebida do Admin!');
            call.answer(); // Receive-only sem enviar stream

            call.on('stream', (remoteStream) => {
              console.log('[PeerJS Membro] Stream de vídeo recebida com sucesso!');
              if (videoRef.current) {
                videoRef.current.srcObject = remoteStream;
                setConnectionStatus('Ao vivo');

                // Tenta reproduzir; se o navegador bloquear áudio, toca mutado para não dar tela preta
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                  playPromise.catch((err) => {
                    console.warn('[Autoplay] Reprodução com áudio bloqueada pelo navegador:', err);
                    if (videoRef.current) {
                      videoRef.current.muted = true;
                      setIsMuted(true);
                      setNeedsAudioUnlock(true);
                      videoRef.current.play().catch(console.error);
                    }
                  });
                }
              }
            });

            call.on('close', () => {
              setConnectionStatus('O Admin encerrou a transmissão.');
            });

            call.on('error', (err) => {
              console.error('[PeerJS Membro] Erro na chamada:', err);
              setConnectionStatus('Falha no streaming.');
            });
          });
        }

        peer.on('error', (err: any) => {
          console.error('[PeerJS Error]:', err);
          if (err.type === 'unavailable-id') {
            setConnectionStatus('ID da sala ocupado no servidor. Aguardando liberação...');
            // Tenta reconectar após alguns segundos se o ID estava preso
            setTimeout(() => {
              if (!isCancelled && isAdmin) {
                peer.destroy();
                initPeer();
              }
            }, 5000);
          } else if (err.type === 'peer-unavailable') {
            setConnectionStatus('Admin ainda não iniciou a sala.');
          } else {
            setConnectionStatus(`Aviso de conexão: ${err.type || 'instabilidade'}`);
          }
        });
      } catch (e) {
        console.error('[PeerJS Fatal]:', e);
      }
    };

    initPeer();

    return () => {
      isCancelled = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (peerRef.current) {
        peerRef.current.disconnect();
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [isAdmin, connectToAdmin, handleAdminCall]);

  // Loop de reconexão automática para membros caso o Admin ainda não esteja online
  useEffect(() => {
    if (isAdmin || isStreaming || connectionStatus === 'Ao vivo') return;

    const interval = setInterval(() => {
      if (connectionStatus !== 'Ao vivo' && !isConnecting) {
        connectToAdmin();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isAdmin, isStreaming, connectionStatus, isConnecting, connectToAdmin]);

  // Ação manual do membro para sintonizar e liberar áudio
  const handleManualJoin = () => {
    setHasJoined(true);
    setNeedsAudioUnlock(false);

    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().catch((err) => {
        console.warn('Erro ao forçar play:', err);
      });
    }

    if (connectionStatus !== 'Ao vivo') {
      connectToAdmin();
    }
  };

  // Iniciar partilha de ecrã (Admin)
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      currentStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsStreaming(true);
      setConnectionStatus('Transmitindo ao vivo');

      // Liga imediatamente para todos os membros que já estão na sala aguardando
      connectedMembersRef.current.forEach((_conn, memberId) => {
        handleAdminCall(memberId);
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Erro ao capturar tela:', err);
      setConnectionStatus('Permissão de captura negada.');
    }
  };

  // Parar partilha de ecrã (Admin)
  const stopScreenShare = () => {
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((track) => track.stop());
      currentStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    activeCallsRef.current.forEach((call) => call.close());
    activeCallsRef.current.clear();
    setViewerCount(0);

    setIsStreaming(false);
    setConnectionStatus('Transmissão encerrada');
  };

  // Alternar tela cheia
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sincronizar volume e mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isAdmin ? true : isMuted;
    }
  }, [volume, isMuted, isAdmin]);

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex flex-col items-center p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-500 font-cinema tracking-wide">
              Cine Chapéu: Watch Party
            </h1>
            <p className="text-xs text-zinc-400">Transmissão síncrona P2P para o clube de cinema</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && isStreaming && (
            <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{viewerCount} espectador(es)</span>
            </span>
          )}

          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isStreaming || connectionStatus === 'Ao vivo'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStreaming || connectionStatus === 'Ao vivo'
                  ? 'bg-red-500 animate-ping'
                  : 'bg-zinc-500'
              }`}
            />
            {connectionStatus}
          </span>

          {!isAdmin && connectionStatus !== 'Ao vivo' && (
            <button
              onClick={connectToAdmin}
              disabled={isConnecting}
              title="Tentar reconectar à transmissão"
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>Reconectar</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de desbloqueio de áudio (se autoplay iniciou mutado) */}
      {needsAudioUnlock && (
        <div className="w-full max-w-6xl mb-3 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-300 text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>O navegador iniciou o vídeo mudo por segurança. Clique ao lado para ativar o som do filme!</span>
          </div>
          <button
            onClick={handleManualJoin}
            className="px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
          >
            Ativar Áudio
          </button>
        </div>
      )}

      {/* Moldura do Player */}
      <div
        ref={containerRef}
        onDoubleClick={toggleFullScreen}
        className="w-full max-w-6xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-800/80 group"
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay
          playsInline
          controls={false}
        />

        {/* Barra de Controles Flutuante */}
        {hasJoined && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => !isAdmin && setIsMuted(!isMuted)}
                disabled={isAdmin}
                className={`transition-colors p-1.5 rounded-lg cursor-pointer ${
                  isAdmin
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-200 hover:text-amber-400 hover:bg-zinc-800/60'
                }`}
                title={isAdmin ? 'Áudio do admin mutado localmente para evitar eco' : (isMuted ? 'Desmutar' : 'Mutar')}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                disabled={isAdmin}
                className={`w-24 sm:w-32 h-1.5 rounded-lg cursor-pointer ${
                  isAdmin ? 'opacity-40' : 'accent-amber-500'
                }`}
              />
            </div>

            <button
              onClick={toggleFullScreen}
              className="text-zinc-200 hover:text-amber-400 hover:bg-zinc-800/60 p-2 rounded-lg transition-colors cursor-pointer"
              title="Tela Cheia (ou duplo clique)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Botão de Iniciar para o Admin */}
        {!isStreaming && isAdmin && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-20 backdrop-blur-sm p-4 text-center">
            <button
              onClick={startScreenShare}
              className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-bold text-base sm:text-lg rounded-2xl hover:bg-amber-400 transition-transform hover:scale-105 cursor-pointer shadow-xl shadow-amber-500/20 mb-3"
            >
              <MonitorPlay className="w-6 h-6" />
              <span>Iniciar Partilha de Ecrã</span>
            </button>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
              Dica: escolha a janela ou aba do filme e certifique-se de marcar a opção de compartilhar áudio do sistema.
            </p>
          </div>
        )}

        {/* Botão de Sintonizar para os Membros */}
        {!isAdmin && !hasJoined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 backdrop-blur-sm p-4 text-center">
            <button
              onClick={handleManualJoin}
              className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-bold text-base sm:text-lg rounded-full hover:bg-amber-400 transition-transform hover:scale-105 shadow-xl shadow-amber-500/20 mb-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Sintonizar Sessão</span>
            </button>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-sm">
              Clique para conectar ao Admin e liberar áudio e vídeo em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchParty;
