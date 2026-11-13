import { ITtsProvider, TtsVoice, SynthesizeOptions } from './ITtsProvider';
import WebSocket from 'ws';
import crypto from 'crypto';

export class EdgeTtsProvider implements ITtsProvider {
  name = 'edge';

  private voices: TtsVoice[] = [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Voz Feminina Natural)', gender: 'female', language: 'pt-BR', isPremium: false },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Voz Masculina Firme)', gender: 'male', language: 'pt-BR', isPremium: false },
    { id: 'pt-BR-ThalitaNeural', name: 'Thalita (Voz Feminina Jovem)', gender: 'female', language: 'pt-BR', isPremium: false },
    { id: 'pt-BR-FabioNeural', name: 'Fabio (Voz Gamer Descontraída)', gender: 'male', language: 'pt-BR', isPremium: false },
    { id: 'en-US-GuyNeural', name: 'Guy (Gamer Americano)', gender: 'male', language: 'en-US', isPremium: false },
    { id: 'en-US-JennyNeural', name: 'Jenny (Assistente IA)', gender: 'female', language: 'en-US', isPremium: false },
  ];

  async getVoices(): Promise<TtsVoice[]> {
    return this.voices;
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<{ audioBuffer: Buffer; contentType: string; audioBase64?: string }> {
    const voice = options.voiceId || 'pt-BR-FranciscaNeural';
    
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomBytes(16).toString('hex');
      const connectionId = crypto.randomBytes(16).toString('hex');
      const wssUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaheadedge/v1?TrustedClientToken=6A5AA1D4EA651143A48E4F2372504F58&ConnectionId=${connectionId}`;

      const ws = new WebSocket(wssUrl, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold'
        }
      });

      const audioChunks: Buffer[] = [];
      let isDone = false;

      const timeout = setTimeout(() => {
        if (!isDone) {
          ws.terminate();
          // Fallback gracioso com áudio sintetizado sintetico se houver timeout
          resolve(this.createFallbackAudio(text));
        }
      }, 7000);

      ws.on('open', () => {
        // 1. Configura formato de áudio (MP3 48kbps / 128kbps para altíssima leveza na live)
        const timestamp = new Date().toISOString();
        const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`;
        ws.send(configMsg);

        // 2. Envia payload SSML
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${voice}'><prosody rate='0%' pitch='0%'>${escapeXml(text)}</prosody></voice></speak>`;
        const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      });

      ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
        if (isBinary) {
          const buffer = Buffer.from(data as Buffer);
          // O protocolo Edge-TTS envia um cabeçalho de 2 bytes com o tamanho do header
          if (buffer.length > 2) {
            const headerLen = buffer.readUInt16BE(0);
            if (buffer.length > headerLen + 2) {
              const audioPart = buffer.subarray(headerLen + 2);
              audioChunks.push(audioPart);
            }
          }
        } else {
          const textMsg = data.toString();
          if (textMsg.includes('Path:turn.end')) {
            isDone = true;
            clearTimeout(timeout);
            ws.close();
            const fullAudio = Buffer.concat(audioChunks);
            resolve({
              audioBuffer: fullAudio,
              contentType: 'audio/mp3',
              audioBase64: fullAudio.toString('base64')
            });
          }
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        // Em caso de erro na conexão externa, resolve com áudio fallback
        resolve(this.createFallbackAudio(text));
      });
    });
  }

  private createFallbackAudio(text: string): { audioBuffer: Buffer; contentType: string; audioBase64: string } {
    // Retorna buffer de áudio vazio ou sinalizador caso o ambiente não tenha acesso à internet
    const emptyWav = Buffer.from('RIFF24000000WAVEfmt 100000000100010044ac00008858010002001000data00000000', 'binary');
    return {
      audioBuffer: emptyWav,
      contentType: 'audio/wav',
      audioBase64: emptyWav.toString('base64')
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
