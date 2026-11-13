import { Router, Request, Response } from 'express';
import { PixService } from '../modules/pix/PixService';
import { TtsService } from '../modules/tts/TtsService';
import { WebSocketManager } from '../modules/realtime/WebSocketManager';
import { ProfanityFilter } from '../modules/moderation/ProfanityFilter';
import { AuthService } from '../modules/auth/AuthService';
import { AskAiService } from '../modules/ai/AskAiService';
import { PixPassService } from '../modules/pixpass/PixPassService';

export function createApiRouter(
  pixService: PixService,
  ttsService: TtsService,
  wsManager: WebSocketManager,
  authService: AuthService,
  askAiService: AskAiService
): Router {
  const router = Router();

  // Middleware simples de autenticação
  const requireAuth = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, error: 'Acesso não autorizado. Faça login.' });

    const user = authService.verifySessionToken(token);
    if (!user) return res.status(401).json({ success: false, error: 'Sessão expirada ou inválida.' });

    (req as any).user = user;
    next();
  };

  // ==========================================
  // 1. AUTENTICAÇÃO DO STREAMER
  // ==========================================

  // Login do Streamer
  router.post('/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
    }

    const user = authService.authenticate(email, password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas. Verifique o e-mail ou a senha.' });
    }

    const token = authService.createSessionToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          pixKey: user.pixKey,
          pixKeyType: user.pixKeyType,
          overlayToken: user.overlayToken,
          settings: user.settings
        }
      }
    });
  });

  // Cadastro de Novo Streamer
  router.post('/auth/register', (req: Request, res: Response) => {
    const { email, username, displayName, password, pixKey, pixKeyType } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: 'Preencha todos os campos obrigatórios.' });
    }

    const existing = authService.getUserById(username);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Este nome de usuário já está em uso.' });
    }

    const user = authService.createOrSeedUser({
      email,
      username,
      displayName: displayName || username,
      password,
      pixKey,
      pixKeyType
    });

    wsManager.registerStreamerToken(user.overlayToken, user.id);
    const token = authService.createSessionToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  });

  // Perfil do Streamer Logado
  router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const isOnline = wsManager.isStreamerOnline(user.id);
    const pixPass = PixPassService.calculateProgress(38000); // R$ 380,00 de demonstração inicial

    return res.json({
      success: true,
      data: {
        user,
        isOnline,
        pixPass
      }
    });
  });

  // Atualização de Configurações do Streamer
  router.put('/streamer/settings', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { settings, pixKey, pixKeyType } = req.body;

    const updated = authService.updateSettings(user.id, settings, pixKey, pixKeyType);
    return res.json({ success: true, data: updated });
  });

  // ==========================================
  // 2. DADOS PÚBLICOS DO STREAMER (Doação /:username)
  // ==========================================
  router.get('/streamers/:username', (req: Request, res: Response) => {
    const { username } = req.params;
    let user = authService.getUserById(username);

    // Se o streamer ainda não existe, cria um perfil dinâmico
    if (!user) {
      user = authService.createOrSeedUser({
        email: `${username}@tangpix.gg`,
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        password: 'password123'
      });
    }

    wsManager.registerStreamerToken(user.overlayToken, user.id);
    const isOnline = wsManager.isStreamerOnline(user.id);
    const pixPass = PixPassService.calculateProgress(38000);

    const streamerData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      verified: true,
      isOnline, // Status em tempo real do OBS!
      overlayToken: user.overlayToken,
      settings: user.settings,
      pixPass,
      catalog: {
        memes: [
          { id: 'meme-dance', name: 'Gato Dançante Meme', minCents: 500, videoUrl: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
          { id: 'meme-cheer', name: 'Chuva de Dinheiro', minCents: 800, videoUrl: 'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif' },
          { id: 'meme-wow', name: 'Cachorro Doge Surpreso', minCents: 500, videoUrl: 'https://media.giphy.com/media/oBQZIgNobc7EWcpXO0/giphy.gif' },
        ],
        avatars3d: [
          { id: 'avatar-robot', name: 'Robô Cyberpunk 3D', minCents: 1000, description: 'Surge na live, dança e fala sua mensagem em voz de IA!' },
          { id: 'avatar-dragon', name: 'Dragão Neon 3D', minCents: 2000, description: 'Cospe fogo colorido com efeito de tremor na tela!' }
        ],
        soundEffects: [
          { id: 'snd-jumpscare', name: 'Buzina de Trem (Jumpscare)', minCents: 300, soundUrl: '/sounds/airhorn.mp3' },
          { id: 'snd-victory', name: 'Fanfarra de Vitória', minCents: 200, soundUrl: '/sounds/victory.mp3' }
        ]
      }
    };

    return res.json({ success: true, data: streamerData });
  });

  // ==========================================
  // 3. DOAÇÕES E SIMULAÇÃO DE PIX
  // ==========================================
  router.post('/donations/pix', async (req: Request, res: Response) => {
    try {
      const { streamerId, donorName, amountCents, message, actionType, actionAssetUrl, voiceId, voiceProvider } = req.body;

      if (!streamerId || !amountCents || amountCents < 100) {
        return res.status(400).json({ success: false, error: 'Valor mínimo de R$ 1,00 é obrigatório.' });
      }

      const user = authService.getUserById(streamerId);
      const isOnline = wsManager.isStreamerOnline(streamerId);

      // Se o streamer ativou "Pausar quando offline" e o OBS está desconectado
      if (user?.settings?.pauseWhenOffline && !isOnline) {
        return res.status(400).json({
          success: false,
          error: 'O streamer está com a live pausada/offline no momento e não está aceitando novos alertas.'
        });
      }

      // Filtro de moderação
      const filterResult = ProfanityFilter.filterText(message || '');

      const { charge, order } = await pixService.createDonation({
        streamerId,
        donorName: donorName || 'Anônimo',
        amountCents,
        message: filterResult.cleanText,
        actionType: actionType || 'tts',
        actionAssetUrl,
        voiceId,
        voiceProvider
      });

      return res.json({
        success: true,
        data: {
          txId: charge.txId,
          pixCopiaECola: charge.pixCopiaECola,
          qrCodeSvg: charge.qrCodeSvg,
          qrCodeBase64: charge.qrCodeBase64,
          expiresAt: charge.expiresAt,
          order
        }
      });
    } catch (err: any) {
      console.error('Erro ao gerar Pix:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Simulação de Pagamento Pix com Ask AI integrado
  router.post('/donations/simulate-payment', async (req: Request, res: Response) => {
    try {
      const { txId } = req.body;
      const order = pixService.simulatePayment(txId);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Ordem Pix não encontrada.' });
      }

      const user = authService.getUserById(order.streamerId);

      // 1. Executa "Ask AI" se habilitado pelo streamer
      let aiResponseText = '';
      if (user?.settings?.askAiEnabled && order.message) {
        aiResponseText = await askAiService.generateResponse(
          order.message,
          user.settings.askAiPersona || 'cyberpunk',
          order.donorName
        );
      }

      // 2. Sintetiza áudio de IA com o TTS Edge
      let audioBase64: string | undefined;
      let audioContentType: string | undefined;

      const fullSpokenText = aiResponseText
        ? `${order.message}. ${aiResponseText}`
        : order.message;

      if (fullSpokenText && (order.actionType === 'tts' || order.actionType === 'avatar_3d')) {
        try {
          const ttsResult = await ttsService.synthesizeSpeech(
            fullSpokenText,
            order.voiceProvider || 'edge',
            { voiceId: order.voiceId || 'pt-BR-FranciscaNeural' }
          );
          audioBase64 = ttsResult.audioBase64;
          audioContentType = ttsResult.contentType;
        } catch (e) {
          console.error('Erro na síntese TTS do alerta:', e);
        }
      }

      // 3. Dispara o alerta completo para o OBS via WebSocket
      wsManager.broadcastAlert(order.streamerId, {
        id: order.txId,
        donorName: order.donorName,
        amountCents: order.amountCents,
        message: order.message,
        aiResponse: aiResponseText,
        actionType: order.actionType,
        actionAssetUrl: order.actionAssetUrl,
        audioBase64,
        audioContentType,
        voiceId: order.voiceId,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, data: { order, aiResponse: aiResponseText, alertSent: true } });
    } catch (err: any) {
      console.error('Erro ao simular Pix:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Webhook Oficial
  router.post('/webhooks/pix/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const pixProvider = pixService.getProvider(provider);
      const parsed = pixProvider.parseWebhook(req.body, req.headers);

      if (parsed && parsed.status === 'PAID') {
        const order = pixService.processPaidOrder(parsed.txId, parsed.paidAmountCents);
        if (order) {
          const user = authService.getUserById(order.streamerId);
          let aiResponseText = '';
          if (user?.settings?.askAiEnabled && order.message) {
            aiResponseText = await askAiService.generateResponse(
              order.message,
              user.settings.askAiPersona || 'cyberpunk',
              order.donorName
            );
          }

          const fullSpokenText = aiResponseText ? `${order.message}. ${aiResponseText}` : order.message;
          let audioBase64: string | undefined;
          let audioContentType: string | undefined;

          if (fullSpokenText) {
            try {
              const ttsResult = await ttsService.synthesizeSpeech(
                fullSpokenText,
                order.voiceProvider,
                { voiceId: order.voiceId }
              );
              audioBase64 = ttsResult.audioBase64;
              audioContentType = ttsResult.contentType;
            } catch (e) {
              console.error('TTS error on webhook:', e);
            }
          }

          wsManager.broadcastAlert(order.streamerId, {
            id: order.txId,
            donorName: order.donorName,
            amountCents: order.amountCents,
            message: order.message,
            aiResponse: aiResponseText,
            actionType: order.actionType,
            actionAssetUrl: order.actionAssetUrl,
            audioBase64,
            audioContentType,
            voiceId: order.voiceId,
            createdAt: new Date().toISOString()
          });
        }
      }

      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('Erro no webhook Pix:', err);
      return res.status(500).send('ERR');
    }
  });

  // Disparo de teste
  router.post('/dashboard/:streamerId/test-alert', (req: Request, res: Response) => {
    const { streamerId } = req.params;
    wsManager.sendTestAlert(streamerId);
    return res.json({ success: true, message: 'Alerta de teste enviado com sucesso!' });
  });

  // Pular alerta
  router.post('/dashboard/:streamerId/skip-alert', (req: Request, res: Response) => {
    const { streamerId } = req.params;
    wsManager.broadcastAlert(streamerId, {
      id: 'SKIP',
      donorName: '',
      amountCents: 0,
      message: '',
      actionType: 'tts',
      createdAt: ''
    });
    return res.json({ success: true, message: 'Comando de pular enviado.' });
  });

  return router;
}
