import WebSocket, { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { URL } from 'url';

export interface AlertPayload {
  id: string;
  donorName: string;
  amountCents: number;
  message: string;
  actionType: 'tts' | 'meme_webm' | 'avatar_3d' | 'sound_effect';
  actionAssetUrl?: string;
  audioBase64?: string;
  audioContentType?: string;
  voiceId?: string;
  createdAt: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  // Mapeia streamerId para conjunto de WebSockets (OBS overlays e Dashboards)
  private streamerRooms = new Map<string, Set<WebSocket>>();
  // Mapeia token secreto para streamerId
  private tokenToStreamer = new Map<string, string>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupListeners();
  }

  registerStreamerToken(token: string, streamerId: string) {
    this.tokenToStreamer.set(token, streamerId);
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

        const streamerId = this.tokenToStreamer.get(token) || token; // Em dev, token pode ser o próprio id

        if (!this.streamerRooms.has(streamerId)) {
          this.streamerRooms.set(streamerId, new Set());
        }
        this.streamerRooms.get(streamerId)!.add(ws);

        ws.send(JSON.stringify({
          type: 'CONNECTED',
          streamerId,
          role,
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
            if (room.size === 0) {
              this.streamerRooms.delete(streamerId);
            }
          }
        });
      } catch (err) {
        console.error('Erro na conexão WS:', err);
        ws.close();
      }
    });
  }

  private handleClientMessage(streamerId: string, data: any) {
    // Ações vindas do Dashboard do Streamer
    if (data.type === 'SKIP_ALERT') {
      this.broadcastToStreamer(streamerId, { type: 'SKIP_CURRENT' });
    } else if (data.type === 'TEST_ALERT') {
      this.sendTestAlert(streamerId);
    }
  }

  broadcastAlert(streamerId: string, alert: AlertPayload) {
    this.broadcastToStreamer(streamerId, {
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
      actionType: 'avatar_3d',
      actionAssetUrl: '',
      voiceId: 'pt-BR-FranciscaNeural',
      createdAt: new Date().toISOString()
    };
    this.broadcastAlert(streamerId, testAlert);
  }

  private broadcastToStreamer(streamerId: string, payload: any) {
    const clients = this.streamerRooms.get(streamerId);
    if (!clients || clients.size === 0) return;

    const json = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }
}
