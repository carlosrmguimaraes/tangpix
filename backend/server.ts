import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { PixService } from './modules/pix/PixService';
import { TtsService } from './modules/tts/TtsService';
import { WebSocketManager } from './modules/realtime/WebSocketManager';
import { AuthService } from './modules/auth/AuthService';
import { AskAiService } from './modules/ai/AskAiService';
import { createApiRouter } from './routes/api';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Middlewares essenciais
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Headers de segurança HTTP
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Inicializa Subsistemas Modulares
  const pixService = new PixService();
  const ttsService = new TtsService();
  const wsManager = new WebSocketManager(server);
  const authService = new AuthService();
  const askAiService = new AskAiService();

  // Registra streamer de demonstração padrão no WebSocket
  const carlosUser = authService.getUserById('carlos');
  if (carlosUser) {
    wsManager.registerStreamerToken(carlosUser.overlayToken, carlosUser.id);
  }

  // Rotas da API REST
  app.use('/api', createApiRouter(pixService, ttsService, wsManager, authService, askAiService));

  // Healthcheck para Docker e EasyPanel
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'TangPix' });
  });

  // Serve arquivos do frontend em produção
  const clientDistPath = path.resolve(__dirname, '../dist/client');
  app.use(express.static(clientDistPath));

  // Roteamento SPA (Single Page App)
  app.get('*', (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.send(`
          <html>
            <head><title>TangPix Server</title></head>
            <body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;">
              <h1 style="color:#32bcad">TangPix Engine rodando na porta ${ENV.PORT}</h1>
              <p>API ativa em <a href="/api/streamers/carlos" style="color:#00d182">/api/streamers/carlos</a></p>
              <p>Execute <code>pnpm run build</code> ou <code>vite dev</code> para compilar a interface web.</p>
            </body>
          </html>
        `);
      }
    });
  });

  server.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 TangPix Server rodando em http://0.0.0.0:${ENV.PORT}`);
    console.log(`📡 WebSocket ativo em ws://0.0.0.0:${ENV.PORT}/ws`);
    console.log(`💎 Provedor Pix Ativo: ${ENV.PIX_PROVIDER}`);
    console.log(`🎙️  Provedor TTS Ativo: ${ENV.DEFAULT_TTS_PROVIDER}`);
    console.log(`🤖 Ask AI Personas & PixPass Ativos!`);
    console.log(`=======================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha fatal ao iniciar TangPix:', err);
  process.exit(1);
});
