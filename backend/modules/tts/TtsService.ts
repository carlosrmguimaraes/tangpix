import { ITtsProvider, TtsVoice, SynthesizeOptions } from './ITtsProvider';
import { EdgeTtsProvider } from './EdgeTtsProvider';
import { ElevenLabsProvider } from './ElevenLabsProvider';
import { SelfHostedTtsProvider } from './SelfHostedTtsProvider';
import { ENV } from '../../config/env';
import crypto from 'crypto';

export class TtsService {
  private providers = new Map<string, ITtsProvider>();
  private audioCache = new Map<string, { buffer: Buffer; contentType: string; audioBase64: string }>();

  constructor() {
    // 1. Provedor Padrão: Edge-TTS (100% Gratuito com vozes neurais brasileiras)
    this.providers.set('edge', new EdgeTtsProvider());

    // 2. Provedor ElevenLabs (caso configurado)
    if (ENV.ELEVENLABS_API_KEY) {
      this.providers.set('elevenlabs', new ElevenLabsProvider(ENV.ELEVENLABS_API_KEY));
    }

    // 3. Provedor Self-Hosted / Kokoro / Open Source
    if (ENV.SELF_HOSTED_TTS_URL) {
      this.providers.set('selfhosted', new SelfHostedTtsProvider(ENV.SELF_HOSTED_TTS_URL));
    }
  }

  async getAllVoices(): Promise<{ provider: string; voices: TtsVoice[] }[]> {
    const result: { provider: string; voices: TtsVoice[] }[] = [];

    for (const [providerName, provider] of this.providers.entries()) {
      try {
        const voices = await provider.getVoices();
        result.push({ provider: providerName, voices });
      } catch (e) {
        console.error(`Erro ao listar vozes do provedor ${providerName}:`, e);
      }
    }

    return result;
  }

  async synthesizeSpeech(text: string, providerName?: string, options: SynthesizeOptions = { voiceId: 'pt-BR-FranciscaNeural' }) {
    // 1. Gera chave única de cache (MD5 de texto + voz + provedor)
    const activeProvider = providerName || ENV.DEFAULT_TTS_PROVIDER || 'edge';
    const cacheKey = crypto.createHash('md5').update(`${activeProvider}:${options.voiceId}:${text}`).digest('hex');

    // 2. Se já estiver no cache em memória, retorna imediatamente (latência < 5ms, Custo ZERO!)
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // 3. Resolve o provedor
    const provider = this.providers.get(activeProvider) || this.providers.get('edge')!;

    try {
      const result = await provider.synthesize(text, options);
      const audioData = {
        buffer: result.audioBuffer,
        contentType: result.contentType,
        audioBase64: result.audioBase64 || result.audioBuffer.toString('base64')
      };

      // Salva no cache
      this.audioCache.set(cacheKey, audioData);
      return audioData;
    } catch (err) {
      console.warn(`Falha no provedor TTS '${activeProvider}', tentando fallback para 'edge'...`, err);
      // Fallback para Edge
      const fallback = this.providers.get('edge')!;
      const result = await fallback.synthesize(text, { voiceId: 'pt-BR-FranciscaNeural' });
      return {
        buffer: result.audioBuffer,
        contentType: result.contentType,
        audioBase64: result.audioBase64 || result.audioBuffer.toString('base64')
      };
    }
  }
}
