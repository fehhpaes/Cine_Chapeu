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
} from 'lucide-react';

const ROOM_ID = 'cine-chapeu-admin-room-2026';

// Servidores STUN públicos + TURN gratuito para transposição de NAT
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
  const memberActiveCallRef = useRef<MediaConnection | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Iniciando...');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(isAdmin);

  // Executa play de forma segura aguardando o carregamento da mídia
  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    const tryPlay = () => {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('[SafePlay] Play desmutado falhou, tocando mutado:', err);
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.error('[SafePlay] Falha final:', e));
        });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.onloadeddata = () => {
        tryPlay();
      };
    }
  }, []);

  // Manipulador de chamadas para o Admin (evita ligações duplicadas para o mesmo membro)
  const handleAdminCall = useCallback((memberId: string) => {
    if (!peerRef.current || !currentStreamRef.current) return;

    // Se já tiver uma chamada ativa e aberta para este membro, não recria
    if (activeCallsRef.current.has(memberId)) {
      const existing = activeCallsRef.current.get(memberId);
      if (existing && existing.open) {
        console.log(`[PeerJS Admin] Membro ${memberId} já possui chamada ativa.`);
        return;
      }
      existing?.close();
      activeCallsRef.current.delete(memberId);
    }

    try {
      console.log(`[PeerJS Admin] Iniciando chamada única para membro: ${memberId}`);
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

  // Membro conecta ao Admin via DataConnection para registrar presença
  const connectToAdmin = useCallback(() => {
    if (isAdmin || !peerRef.current || peerRef.current.destroyed) return;

    setIsConnecting(true);
    setConnectionStatus('Procurando transmissão do Admin...');

    try {
      const conn = peerRef.current.connect(ROOM_ID, { reliable: true });

      conn.on('open', () => {
        setIsConnecting(false);
        setConnectionStatus('Conectado à sala! Aguardando o filme...');
      });

      conn.on('close', () => {
        setConnectionStatus('Conexão encerrada pelo Admin.');
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
          peer.on('connection', (conn) => {
            const memberId = conn.peer;
            console.log(`[PeerJS Admin] Novo membro conectado: ${memberId}`);
            connectedMembersRef.current.set(memberId, conn);

            conn.on('close', () => {
              connectedMembersRef.current.delete(memberId);
            });

            // Se o Admin já estiver transmitindo, liga para o membro
            if (currentStreamRef.current) {
              handleAdminCall(memberId);
            }
          });
        } else {
          // Membro recebe chamada do Admin
          peer.on('call', (call: MediaConnection) => {
            console.log('[PeerJS Membro] Chamada de vídeo recebida do Admin!');

            // Fecha chamada anterior para não conflitar
            if (memberActiveCallRef.current) {
              memberActiveCallRef.current.close();
            }
            memberActiveCallRef.current = call;

            call.answer();

            call.on('stream', (remoteStream) => {
              console.log('[PeerJS Membro] Stream de vídeo recebida com sucesso!');
              setHasRemoteStream(true);
              setConnectionStatus('Ao vivo');

              if (videoRef.current) {
                if (videoRef.current.srcObject !== remoteStream) {
                  videoRef.current.srcObject = remoteStream;
                }
                safePlay();
              }
            });

            call.on('close', () => {
              setConnectionStatus('O Admin encerrou a transmissão.');
              setHasRemoteStream(false);
              setIsPlaying(false);
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
            setTimeout(() => {
              if (!isCancelled && isAdmin) {
                peer.destroy();
                initPeer();
              }
            }, 5000);
          } else if (err.type === 'peer-unavailable') {
            setConnectionStatus('Admin ainda não iniciou a sala.');
          } else {
            setConnectionStatus(`Aviso: ${err.type || 'instabilidade'}`);
          }
        });
      } catch (e) {
        console.error('[PeerJS Fatal]:', e);
      }
    };

    initPeer();

    return () => {
      isCancelled = true;
      if (peerRef.current) {
        peerRef.current.disconnect();
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [isAdmin, connectToAdmin, handleAdminCall, safePlay]);

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

      // Liga para todos os membros conectados sem duplicar
      connectedMembersRef.current.forEach((_conn, memberId) => {
        handleAdminCall(memberId);
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Erro ao capturar tela:', err);
      setConnectionStatus('Permissão negada.');
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

      {/* Moldura do Player */}
      <div
        ref={containerRef}
        onDoubleClick={toggleFullScreen}
        onClick={() => {
          if (!isAdmin) {
            safePlay();
            if (isMuted) {
              setIsMuted(false);
              if (videoRef.current) videoRef.current.muted = false;
            }
          }
        }}
        className="w-full max-w-6xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-800/80 group cursor-pointer"
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay
          playsInline
          muted={isAdmin ? true : isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Barra de Controles Flutuante */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-10 pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAdmin) {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (videoRef.current) videoRef.current.muted = nextMuted;
                  if (!isPlaying) safePlay();
                }
              }}
              disabled={isAdmin}
              className={`transition-colors p-1.5 rounded-lg cursor-pointer ${
                isAdmin
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-200 hover:text-amber-400 hover:bg-zinc-800/60'
              }`}
              title={isAdmin ? 'Áudio do admin mutado localmente' : (isMuted ? 'Desmutar' : 'Mutar')}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (isMuted) {
                  setIsMuted(false);
                  if (videoRef.current) videoRef.current.muted = false;
                }
              }}
              disabled={isAdmin}
              className={`w-24 sm:w-32 h-1.5 rounded-lg cursor-pointer ${
                isAdmin ? 'opacity-40' : 'accent-amber-500'
              }`}
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullScreen();
            }}
            className="text-zinc-200 hover:text-amber-400 hover:bg-zinc-800/60 p-2 rounded-lg transition-colors cursor-pointer"
            title="Tela Cheia (ou duplo clique)"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>

        {/* Botão de Iniciar para o Admin */}
        {!isStreaming && isAdmin && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm p-4 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startScreenShare();
              }}
              className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-bold text-base sm:text-lg rounded-2xl hover:bg-amber-400 transition-transform hover:scale-105 cursor-pointer shadow-xl shadow-amber-500/20 mb-3"
            >
              <MonitorPlay className="w-6 h-6" />
              <span>Iniciar Partilha de Ecrã</span>
            </button>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
              💡 <strong>Dica de ouro:</strong> Escolha <strong>"Tela Inteira"</strong> e marque <strong>"Compartilhar áudio do sistema"</strong> para transmitir o VLC sem tela preta!
            </p>
          </div>
        )}

        {/* Botão Gigante de Interação para o Membro quando pausado ou sem som */}
        {!isAdmin && (!isPlaying || isMuted) && hasRemoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-xs p-4 text-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                safePlay();
                setIsMuted(false);
                if (videoRef.current) videoRef.current.muted = false;
              }}
              className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-amber-500 text-black font-bold text-base sm:text-lg rounded-full hover:bg-amber-400 transition-transform hover:scale-105 shadow-2xl shadow-amber-500/30 mb-3 cursor-pointer animate-bounce"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>CLIQUE PARA ASSISTIR COM SOM</span>
            </button>
            <p className="text-zinc-300 text-xs sm:text-sm max-w-sm drop-shadow-md">
              O navegador exige um clique para liberar a reprodução de áudio e vídeo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchParty;
