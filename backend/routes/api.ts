import { Router, Request, Response } from 'express';
import { PixService } from '../modules/pix/PixService';
import { TtsService } from '../modules/tts/TtsService';
import { WebSocketManager } from '../modules/realtime/WebSocketManager';
import { ProfanityFilter } from '../modules/moderation/ProfanityFilter';

export function createApiRouter(
  pixService: PixService,
  ttsService: TtsService,
  wsManager: WebSocketManager
): Router {
  const router = Router();

  // 1. Dados públicos do Streamer (para a página de doação /:username)
  router.get('/streamers/:username', async (req: Request, res: Response) => {
    const { username } = req.params;

    // Perfil mock/inicial padrão para qualquer username de streamer
    const streamerData = {
      id: username.toLowerCase(),
      username: username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: 'Criador de conteúdo ao vivo! Mande um Pix para interagir com a live!',
      verified: true,
      overlayToken: `token_${username.toLowerCase()}_sec2026`,
      settings: {
        minDonationCents: 100, // R$ 1,00
        minTtsCents: 200,      // R$ 2,00 para ler mensagem
        minMemeCents: 500,     // R$ 5,00 para meme de vídeo
        min3dCents: 1000,      // R$ 10,00 para avatar 3D interativo
        maxMessageChars: 250,
        ttsEnabled: true,
      },
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

    // Registra o token no WebSocketManager para que o OBS conecte
    wsManager.registerStreamerToken(streamerData.overlayToken, streamerData.id);

    return res.json({ success: true, data: streamerData });
  });

  // 2. Inicia doação via Pix
  router.post('/donations/pix', async (req: Request, res: Response) => {
    try {
      const { streamerId, donorName, amountCents, message, actionType, actionAssetUrl, voiceId, voiceProvider } = req.body;

      if (!streamerId || !amountCents || amountCents < 100) {
        return res.status(400).json({ success: false, error: 'Valor mínimo de R$ 1,00 é obrigatório.' });
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

  // 3. Simula o pagamento do Pix (para testes imediatos)
  router.post('/donations/simulate-payment', async (req: Request, res: Response) => {
    try {
      const { txId } = req.body;
      const order = pixService.simulatePayment(txId);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Ordem Pix não encontrada.' });
      }

      // Sintetiza áudio de IA se o alerta tiver mensagem e TTS
      let audioBase64: string | undefined;
      let audioContentType: string | undefined;

      if (order.message && (order.actionType === 'tts' || order.actionType === 'avatar_3d')) {
        try {
          const ttsResult = await ttsService.synthesizeSpeech(
            order.message,
            order.voiceProvider || 'edge',
            { voiceId: order.voiceId || 'pt-BR-FranciscaNeural' }
          );
          audioBase64 = ttsResult.audioBase64;
          audioContentType = ttsResult.contentType;
        } catch (e) {
          console.error('Erro na síntese TTS do alerta:', e);
        }
      }

      // Dispara o alerta instantaneamente para todos os OBS conectados
      wsManager.broadcastAlert(order.streamerId, {
        id: order.txId,
        donorName: order.donorName,
        amountCents: order.amountCents,
        message: order.message,
        actionType: order.actionType,
        actionAssetUrl: order.actionAssetUrl,
        audioBase64,
        audioContentType,
        voiceId: order.voiceId,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, data: { order, alertSent: true } });
    } catch (err: any) {
      console.error('Erro ao simular Pix:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Webhook Oficial de Pagamento PIX (Efí, Asaas, etc)
  router.post('/webhooks/pix/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const pixProvider = pixService.getProvider(provider);
      const parsed = pixProvider.parseWebhook(req.body, req.headers);

      if (parsed && parsed.status === 'PAID') {
        const order = pixService.processPaidOrder(parsed.txId, parsed.paidAmountCents);
        if (order) {
          // Sintetiza áudio de IA
          let audioBase64: string | undefined;
          let audioContentType: string | undefined;

          if (order.message) {
            try {
              const ttsResult = await ttsService.synthesizeSpeech(
                order.message,
                order.voiceProvider,
                { voiceId: order.voiceId }
              );
              audioBase64 = ttsResult.audioBase64;
              audioContentType = ttsResult.contentType;
            } catch (e) {
              console.error('TTS error on webhook:', e);
            }
          }

          // Dispara para o OBS da live
          wsManager.broadcastAlert(order.streamerId, {
            id: order.txId,
            donorName: order.donorName,
            amountCents: order.amountCents,
            message: order.message,
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

  // 5. Lista todas as vozes de IA disponíveis
  router.get('/tts/voices', async (req: Request, res: Response) => {
    const list = await ttsService.getAllVoices();
    return res.json({ success: true, data: list });
  });

  // 6. Teste de alerta no OBS disparado pelo streamer
  router.post('/dashboard/:streamerId/test-alert', (req: Request, res: Response) => {
    const { streamerId } = req.params;
    wsManager.sendTestAlert(streamerId);
    return res.json({ success: true, message: 'Alerta de teste enviado com sucesso!' });
  });

  // 7. Pula alerta atual no OBS
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
