export interface TtsVoice {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  language: string;
  sampleAudioUrl?: string;
  isPremium?: boolean;
}

export interface SynthesizeOptions {
  voiceId: string;
  speed?: number; // 1.0 = normal
  pitch?: number; // 1.0 = normal
}

export interface ITtsProvider {
  name: string;
  getVoices(): Promise<TtsVoice[]>;
  synthesize(text: string, options: SynthesizeOptions): Promise<{ audioBuffer: Buffer; contentType: string; audioBase64?: string }>;
}
