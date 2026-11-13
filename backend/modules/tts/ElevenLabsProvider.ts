import { ITtsProvider, TtsVoice, SynthesizeOptions } from './ITtsProvider';

export class ElevenLabsProvider implements ITtsProvider {
  name = 'elevenlabs';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVoices(): Promise<TtsVoice[]> {
    return [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Clássica ElevenLabs)', gender: 'female', language: 'en/pt', isPremium: true },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Voz Intensa)', gender: 'female', language: 'en/pt', isPremium: true },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Locutor Profissional)', gender: 'male', language: 'en/pt', isPremium: true }
    ];
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<{ audioBuffer: Buffer; contentType: string; audioBase64?: string }> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API Key não configurada. Use o provedor 'edge' gratuito.");
    }

    const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return {
      audioBuffer,
      contentType: 'audio/mpeg',
      audioBase64: audioBuffer.toString('base64')
    };
  }
}
