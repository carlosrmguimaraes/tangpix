import { ITtsProvider, TtsVoice, SynthesizeOptions } from './ITtsProvider';

export class SelfHostedTtsProvider implements ITtsProvider {
  name = 'selfhosted';
  private endpointUrl: string;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl || 'http://localhost:8000/tts';
  }

  async getVoices(): Promise<TtsVoice[]> {
    return [
      { id: 'kokoro-br-female', name: 'Kokoro Brasil (Feminina Open Source)', gender: 'female', language: 'pt-BR', isPremium: false },
      { id: 'kokoro-br-male', name: 'Kokoro Brasil (Masculina Open Source)', gender: 'male', language: 'pt-BR', isPremium: false }
    ];
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<{ audioBuffer: Buffer; contentType: string; audioBase64?: string }> {
    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options.voiceId,
          speed: options.speed || 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`Self-hosted TTS erro: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      return {
        audioBuffer,
        contentType: 'audio/wav',
        audioBase64: audioBuffer.toString('base64')
      };
    } catch (err: any) {
      throw new Error(`Falha ao conectar no servidor self-hosted: ${err.message}`);
    }
  }
}
