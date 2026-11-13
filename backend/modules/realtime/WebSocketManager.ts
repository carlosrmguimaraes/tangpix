import WebSocket, { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { URL } from 'url';

export interface AlertPayload {
  id: string;
  donorName: string;
  amountCents: number;
  message: string;
  aiResponse?: string;
  actionType: 'tts' | 'meme_webm' | 'avatar_3d' | 'sound_effect';
  actionAssetUrl?: string;
  audioBase64?: string;
  audioContentType?: string;
  voiceId?: string;
  createdAt: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private streamerRooms = new Map<string, Set<WebSocket>>();
  private streamerOverlayClients = new Map<string, Set<WebSocket>>(); // Conexões específicas de OBS
  private tokenToStreamer = new Map<string, string>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupListeners();
  }

  registerStreamerToken(token: string, streamerId: string) {
    this.tokenToStreamer.set(token, streamerId);
  }

  // Verifica se o OBS Studio do streamer está aberto e conectado agora
  isStreamerOnline(streamerId: string): boolean {
    const overlays = this.streamerOverlayClients.get(streamerId.toLowerCase());
    return !!(overlays && overlays.size > 0);
  }

  private setupListeners() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      try {
        const reqUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const token = reqUrl.searchParams.get('token');
        const role = reqUrl.searchParams.get('role') || 'overlay'; // 'overlay' ou 'dashboard'

        if (!token) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Token de autenticação ausente' }));
          ws.close();
          return;
        }

        const streamerId = (this.tokenToStreamer.get(token) || token).toLowerCase();

        if (!this.streamerRooms.has(streamerId)) {
          this.streamerRooms.set(streamerId, new Set());
        }
        this.streamerRooms.get(streamerId)!.add(ws);

        // Se for overlay do OBS, registra na lista de overlays ativos
        if (role === 'overlay') {
          if (!this.streamerOverlayClients.has(streamerId)) {
            this.streamerOverlayClients.set(streamerId, new Set());
          }
          this.streamerOverlayClients.get(streamerId)!.add(ws);
          this.broadcastStatus(streamerId, true);
          console.log(`[TangPix OBS] Streamer '${streamerId}' está ONLINE no OBS!`);
        }

        ws.send(JSON.stringify({
          type: 'CONNECTED',
          streamerId,
          role,
          isOnline: this.isStreamerOnline(streamerId),
          message: `Conectado com sucesso ao canal de alertas (${role})`
        }));

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleClientMessage(streamerId, data);
          } catch (e) {
            console.error('Mensagem WS inválida:', e);
          }
        });

        ws.on('close', () => {
          const room = this.streamerRooms.get(streamerId);
          if (room) {
            room.delete(ws);
            if (room.size === 0) this.streamerRooms.delete(streamerId);
          }

          if (role === 'overlay') {
            const overlays = this.streamerOverlayClients.get(streamerId);
            if (overlays) {
              overlays.delete(ws);
              if (overlays.size === 0) {
                this.streamerOverlayClients.delete(streamerId);
                this.broadcastStatus(streamerId, false);
                console.log(`[TangPix OBS] Streamer '${streamerId}' ficou OFFLINE no OBS.`);
              }
            }
          }
        });
      } catch (err) {
        console.error('Erro na conexão WS:', err);
        ws.close();
      }
    });
  }

  private broadcastStatus(streamerId: string, isOnline: boolean) {
    this.broadcastToStreamer(streamerId, {
      type: 'STREAMER_STATUS',
      streamerId,
      isOnline,
      timestamp: new Date().toISOString()
    });
  }

  private handleClientMessage(streamerId: string, data: any) {
    if (data.type === 'SKIP_ALERT') {
      this.broadcastToStreamer(streamerId, { type: 'SKIP_CURRENT' });
    } else if (data.type === 'TEST_ALERT') {
      this.sendTestAlert(streamerId);
    }
  }

  broadcastAlert(streamerId: string, alert: AlertPayload) {
    this.broadcastToStreamer(streamerId.toLowerCase(), {
      type: 'ALERT_TRIGGER',
      data: alert
    });
  }

  sendTestAlert(streamerId: string) {
    const testAlert: AlertPayload = {
      id: `TEST_${Date.now()}`,
      donorName: 'TangPix Fan #1',
      amountCents: 1000,
      message: 'TangPix tá surreal! O Pix caiu em 1 segundo e o alerta 3D tocou direto na live!',
      aiResponse: 'Transmissão neural recebida! Hype nível 10 ativado no servidor!',
      actionType: 'avatar_3d',
      actionAssetUrl: '',
      voiceId: 'pt-BR-FranciscaNeural',
      createdAt: new Date().toISOString()
    };
    this.broadcastAlert(streamerId, testAlert);
  }

  private broadcastToStreamer(streamerId: string, payload: any) {
    const clients = this.streamerRooms.get(streamerId.toLowerCase());
    if (!clients || clients.size === 0) return;

    const json = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }
}
