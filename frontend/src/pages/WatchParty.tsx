import { useEffect, useRef, useState } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { useAuth } from '../context/AuthContext.tsx';
import { MonitorPlay, Users } from 'lucide-react';

export function WatchParty() {
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [, setPeerInstance] = useState<Peer | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('A aguardar transmissão...');

  const ROOM_ID = 'cine-chapeu-admin-room-2026';

  useEffect(() => {
    // Inicializa o PeerJS
    // O Admin regista-se com o ID fixo. Os membros geram um ID aleatório.
    const peer = isAdmin ? new Peer(ROOM_ID) : new Peer();

    peer.on('open', () => {
      setConnectionStatus(isAdmin ? 'Pronto para transmitir' : 'Conectado. A tentar sintonizar...');
      if (!isAdmin) {
        joinStream(peer);
      }
    });

    // Lógica Exclusiva do Admin: Receber chamadas e enviar o ecrã
    if (isAdmin) {
      peer.on('call', (call: MediaConnection) => {
        // Se o admin já tiver o ecrã partilhado, atende e envia a stream
        if (videoRef.current && videoRef.current.srcObject) {
          call.answer(videoRef.current.srcObject as MediaStream);
          setViewerCount((prev) => prev + 1);
          
          call.on('close', () => setViewerCount((prev) => Math.max(0, prev - 1)));
        } else {
          // Se não estiver a transmitir, atende sem stream
          call.answer();
        }
      });
    }

    setPeerInstance(peer);

    return () => {
      peer.disconnect();
      peer.destroy();
    };
  }, [isAdmin]);

  // Função do Admin para iniciar a partilha de ecrã
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true // Importante para capturar o som do filme
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsStreaming(true);
      setConnectionStatus('A transmitir ao vivo');

      // Se parar a partilha pelo botão nativo do navegador
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Erro ao partilhar ecrã:', err);
      setConnectionStatus('Permissão negada ou erro na captura.');
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

  // Função dos Membros para se ligarem ao Admin
  const joinStream = (peer: Peer) => {
    // Cria uma stream de áudio/vídeo vazia apenas para iniciar a chamada
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((tempStream) => {
        const call = peer.call(ROOM_ID, tempStream);
        
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play();
            setConnectionStatus('A assistir ao vivo');
          }
        });

        call.on('close', () => {
          setConnectionStatus('Transmissão caiu ou foi encerrada.');
        });
      })
      .catch(() => {
        // Caso o membro não tenha microfone, podemos tentar forçar a chamada sem stream
        console.warn("Membro sem dispositivos de media. A tentar ligar em modo de escuta.");
        const call = peer.call(ROOM_ID, new MediaStream());
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play();
            setConnectionStatus('A assistir ao vivo');
          }
        });
      });
  };

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
      
      <div className="w-full max-w-6xl aspect-video bg-neutral-900 rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
        <video 
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay 
          playsInline
          controls={!isAdmin} // Membros podem ajustar o volume localmente
          muted={isAdmin} // O Admin fica mutado para si mesmo para não dar eco
        />
        
        {!isStreaming && isAdmin && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <button 
              onClick={startScreenShare}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
            >
              <MonitorPlay className="w-5 h-5"/> Iniciar Partilha de Ecrã
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchParty;
