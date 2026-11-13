import React, { useEffect, useState, useRef } from 'react';
import { ThreeAvatar } from '../components/ThreeAvatar';
import { Sparkles, Volume2 } from 'lucide-react';

interface AlertItem {
  id: string;
  donorName: string;
  amountCents: number;
  message: string;
  actionType: 'tts' | 'meme_webm' | 'avatar_3d' | 'sound_effect';
  actionAssetUrl?: string;
  audioBase64?: string;
  audioContentType?: string;
}

export const OverlayWidget: React.FC<{ token: string }> = ({ token }) => {
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [queue, setQueue] = useState<AlertItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Conexão WebSocket
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}&role=overlay`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[TangPix OBS Overlay] Conectado com sucesso!');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ALERT_TRIGGER') {
            setQueue((prev) => [...prev, payload.data]);
          } else if (payload.type === 'SKIP_CURRENT') {
            handleSkip();
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [token]);

  // Processamento da Fila de Alertas
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      const nextAlert = queue[0];
      setQueue((prev) => prev.slice(1));
      playAlert(nextAlert);
    }
  }, [queue, isPlaying]);

  const playAlert = (alert: AlertItem) => {
    setIsPlaying(true);
    setCurrentAlert(alert);

    // Toca o áudio de TTS sintetizado pela IA se existir
    if (alert.audioBase64) {
      const audioSrc = `data:${alert.audioContentType || 'audio/mp3'};base64,${alert.audioBase64}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.onended = () => {
        finishAlert();
      };

      audio.onerror = () => {
        setTimeout(finishAlert, 5000);
      };

      audio.play().catch(() => {
        setTimeout(finishAlert, 5000);
      });
    } else {
      // Duração padrão se não houver áudio
      setTimeout(finishAlert, 6000);
    }
  };

  const finishAlert = () => {
    setTimeout(() => {
      setCurrentAlert(null);
      setIsPlaying(false);
    }, 1000);
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    finishAlert();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent flex items-center justify-center pointer-events-none select-none">
      {/* Indicador de Status discreto para debug no OBS */}
      {!isConnected && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-red-950/80 border border-red-500/50 rounded-full text-red-200 text-xs font-mono">
          OBS Desconectado (Tentando reconectar...)
        </div>
      )}

      {currentAlert && (
        <div className="flex flex-col items-center justify-center max-w-2xl animate-slide-up">
          {/* 1. Efeito Visual: Avatar 3D */}
          {currentAlert.actionType === 'avatar_3d' && (
            <div className="relative mb-2">
              <ThreeAvatar color="#32bcad" isTalking={true} />
              <div className="absolute -inset-4 bg-pix-cyan/20 blur-2xl rounded-full -z-10" />
            </div>
          )}

          {/* 2. Efeito Visual: Meme de Vídeo / GIF Animado */}
          {currentAlert.actionType === 'meme_webm' && currentAlert.actionAssetUrl && (
            <div className="relative mb-4 overflow-hidden rounded-2xl shadow-2xl border-2 border-neon-pink/50">
              <img
                src={currentAlert.actionAssetUrl}
                alt="Meme"
                className="max-h-64 object-contain rounded-xl"
              />
            </div>
          )}

          {/* 3. Cartão Principal do Alerta */}
          <div className="relative px-8 py-5 rounded-2xl glass-panel-glow border border-pix-cyan/40 shadow-2xl text-center min-w-[420px] max-w-lg">
            {/* Tag Superior com Valor em Destaque */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 -mt-9 mb-2 bg-gradient-to-r from-pix-cyan to-pix-emerald text-black font-extrabold text-sm rounded-full shadow-lg shadow-pix-cyan/30">
              <Sparkles className="w-4 h-4" />
              R$ {(currentAlert.amountCents / 100).toFixed(2).replace('.', ',')}
            </div>

            {/* Nome do Doador */}
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pix-cyan">
              {currentAlert.donorName}
            </h2>

            {/* Mensagem Lida pelo TTS */}
            {currentAlert.message && (
              <p className="mt-3 text-lg font-semibold text-slate-100 bg-slate-900/60 p-3 rounded-xl border border-white/5 leading-snug">
                "{currentAlert.message}"
              </p>
            )}

            {/* Rodapé Informativo */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-pix-cyan font-mono font-medium">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Voz de IA em tempo real via Pix
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
