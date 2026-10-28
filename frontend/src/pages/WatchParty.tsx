import { useEffect, useRef, useState, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { useAuth } from '../context/AuthContext.tsx';
import { MonitorPlay, Users, Maximize, Minimize, Volume2, VolumeX, Play } from 'lucide-react';

export function WatchParty() {
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('A iniciar sala...');
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(isAdmin);
  const [hasJoined, setHasJoined] = useState(isAdmin);

  const ROOM_ID = 'cine-chapeu-admin-room-2026';

  // Refs para evitar problemas de estado obsoleto (stale state) nos callbacks do PeerJS
  const connectedMembersRef = useRef<Set<string>>(new Set());
  const activeCallsRef = useRef<Set<string>>(new Set());

  // Gere o contador de espetadores do Admin
  const handleAdminCallEvents = useCallback((call: MediaConnection, memberId: string) => {
    activeCallsRef.current.add(memberId);
    setViewerCount(activeCallsRef.current.size);

    call.on('close', () => {
      activeCallsRef.current.delete(memberId);
      setViewerCount(activeCallsRef.current.size);
    });
  }, []);

  useEffect(() => {
    const peer = isAdmin ? new Peer(ROOM_ID) : new Peer();

    peer.on('open', () => {
      setConnectionStatus(isAdmin ? 'Pronto para transmitir' : 'Aguardando sintonização');

      if (!isAdmin) {
        // Membros apenas "batem à porta" do Admin (ligação de dados sem media)
        const conn = peer.connect(ROOM_ID);
        conn.on('open', () => console.log('Ligação de dados estabelecida com o Admin'));
      }
    });

    if (isAdmin) {
      // Admin regista quem está na sala
      peer.on('connection', (conn) => {
        const memberId = conn.peer;
        connectedMembersRef.current.add(memberId);

        conn.on('close', () => {
          connectedMembersRef.current.delete(memberId);
        });

        // Se o Admin já estiver a transmitir, liga ao membro imediatamente
        if (videoRef.current && videoRef.current.srcObject) {
          const call = peer.call(memberId, videoRef.current.srcObject as MediaStream);
          handleAdminCallEvents(call, memberId);
        }
      });
    } else {
      // Membros recebem a chamada do Admin
      peer.on('call', (call) => {
        // Atendem de mãos vazias (Receive-Only) - Garante que o vídeo não é cortado!
        call.answer();
        
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            setConnectionStatus('A assistir ao vivo');
            
            // Tenta reproduzir caso o utilizador já tenha interagido com a página
            videoRef.current.play().catch(() => console.log('A aguardar clique do utilizador'));
          }
        });
        
        call.on('close', () => setConnectionStatus('O Admin encerrou a transmissão.'));
      });
    }

    setPeerInstance(peer);
    return () => { peer.disconnect(); peer.destroy(); };
  }, [isAdmin, handleAdminCallEvents]);

  // Força o play quando o utilizador clica em "Sintonizar"
  useEffect(() => {
    if (!isAdmin && hasJoined && videoRef.current && videoRef.current.srcObject) {
      videoRef.current.play().catch(console.error);
    }
  }, [hasJoined, isAdmin]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsStreaming(true);
      setConnectionStatus('A transmitir ao vivo');

      // Admin inicia chamada para todos os membros que já estavam à espera
      connectedMembersRef.current.forEach(memberId => {
        if (peerInstance) {
          const call = peerInstance.call(memberId, stream);
          handleAdminCallEvents(call, memberId);
        }
      });

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch {
      setConnectionStatus('Permissão negada ou erro.');
    }
  };

  const stopScreenShare = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setConnectionStatus('Transmissão encerrada');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isAdmin ? true : isMuted;
    }
  }, [volume, isMuted, isAdmin]);

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-amber-500 font-cinema tracking-wide">Cine Chapéu: A Última Sessão</h1>
        <div className="flex gap-4 items-center">
          {isAdmin && isStreaming && (
            <span className="flex items-center gap-2 text-sm text-neutral-400">
              <Users className="w-4 h-4"/> {viewerCount} a assistir
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isStreaming || (!isAdmin && connectionStatus === 'A assistir ao vivo') ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
            {connectionStatus}
          </span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        onDoubleClick={toggleFullScreen}
        className="w-full max-w-6xl aspect-video bg-neutral-900 rounded-xl overflow-hidden shadow-2xl relative border border-white/5 group"
      >
        <video 
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay 
          playsInline
          controls={false} 
        />

        {hasJoined && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => !isAdmin && setIsMuted(!isMuted)} 
                disabled={isAdmin}
                className={`transition-colors cursor-pointer ${isAdmin ? 'text-neutral-600 cursor-not-allowed' : 'text-white hover:text-amber-500'}`}
                title={isAdmin ? 'Áudio do admin mutado localmente' : (isMuted ? 'Desmutar' : 'Mutar')}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6"/> : <Volume2 className="w-6 h-6"/>}
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
                className={`w-24 h-1 rounded-lg cursor-pointer ${isAdmin ? 'opacity-50' : 'accent-amber-500'}`}
              />
            </div>
            <button
              onClick={toggleFullScreen}
              className="text-white hover:text-amber-500 transition-colors p-2 cursor-pointer"
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? <Minimize className="w-6 h-6"/> : <Maximize className="w-6 h-6"/>}
            </button>
          </div>
        )}

        {!isStreaming && isAdmin && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-xs">
            <button 
              onClick={startScreenShare}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-transform hover:scale-105 cursor-pointer shadow-lg"
            >
              <MonitorPlay className="w-5 h-5"/> Iniciar Partilha de Ecrã
            </button>
          </div>
        )}

        {!isAdmin && !hasJoined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-xs">
            <button 
              onClick={() => setHasJoined(true)}
              className="flex items-center gap-2 px-8 py-4 bg-amber-500 text-black font-bold text-lg rounded-full hover:bg-amber-400 transition-transform hover:scale-105 shadow-xl shadow-amber-500/20 mb-4 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current"/> Sintonizar Transmissão
            </button>
            <p className="text-neutral-400 text-sm">Clique para ativar o áudio e vídeo da sessão.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchParty;
