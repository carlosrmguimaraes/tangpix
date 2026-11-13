import { IPixProvider, CreatePixChargeDTO, PixChargeResult, PixWebhookResult } from './IPixProvider';
import { MockPixProvider } from './MockPixProvider';
import { EfiPixProvider } from './EfiPixProvider';
import { ENV } from '../../config/env';

export interface DonationOrder {
  txId: string;
  streamerId: string;
  donorName: string;
  amountCents: number;
  platformFeeCents: number;
  streamerNetCents: number;
  message: string;
  actionType: 'tts' | 'meme_webm' | 'avatar_3d' | 'sound_effect';
  actionAssetUrl?: string;
  voiceId?: string;
  voiceProvider?: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REJECTED';
  createdAt: Date;
  paidAt?: Date;
}

export class PixService {
  private providers = new Map<string, IPixProvider>();
  private activeProviderName: string;
  private orders = new Map<string, DonationOrder>();

  constructor() {
    // Registra os provedores
    const mock = new MockPixProvider();
    this.providers.set('mock', mock);

    if (ENV.EFI_CLIENT_ID && ENV.EFI_CLIENT_SECRET) {
      this.providers.set('efi', new EfiPixProvider({
        clientId: ENV.EFI_CLIENT_ID,
        clientSecret: ENV.EFI_CLIENT_SECRET,
        pixKey: ENV.EFI_PIX_KEY,
        certBase64: ENV.EFI_CERTIFICATE_BASE64
      }));
    }

    this.activeProviderName = ENV.PIX_PROVIDER || 'mock';
  }

  getProvider(name?: string): IPixProvider {
    const provider = this.providers.get(name || this.activeProviderName);
    if (!provider) {
      return this.providers.get('mock')!;
    }
    return provider;
  }

  async createDonation(params: {
    streamerId: string;
    donorName: string;
    amountCents: number;
    message: string;
    actionType: 'tts' | 'meme_webm' | 'avatar_3d' | 'sound_effect';
    actionAssetUrl?: string;
    voiceId?: string;
    voiceProvider?: string;
  }): Promise<{ charge: PixChargeResult; order: DonationOrder }> {
    const txId = `TP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Cálculo do Split da Plataforma (ex: 5%)
    const platformFeeCents = Math.round((params.amountCents * ENV.PLATFORM_FEE_PERCENTAGE) / 100);
    const streamerNetCents = params.amountCents - platformFeeCents;

    const order: DonationOrder = {
      txId,
      streamerId: params.streamerId,
      donorName: params.donorName.trim() || 'Anônimo',
      amountCents: params.amountCents,
      platformFeeCents,
      streamerNetCents,
      message: params.message.trim(),
      actionType: params.actionType,
      actionAssetUrl: params.actionAssetUrl,
      voiceId: params.voiceId || 'pt-BR-FranciscaNeural',
      voiceProvider: params.voiceProvider || ENV.DEFAULT_TTS_PROVIDER,
      status: 'PENDING',
      createdAt: new Date()
    };

    this.orders.set(txId, order);

    const provider = this.getProvider();
    const charge = await provider.createCharge({
      txId,
      amountCents: params.amountCents,
      description: `TangPix Alerta: ${params.donorName}`,
      donorName: params.donorName,
      streamerId: params.streamerId
    });

    return { charge, order };
  }

  getOrder(txId: string): DonationOrder | undefined {
    return this.orders.get(txId);
  }

  // Permite simular o pagamento instantaneamente em dev ou demonstração
  simulatePayment(txId: string): DonationOrder | null {
    const mock = this.providers.get('mock') as MockPixProvider;
    if (mock) {
      const webhookRes = mock.simulatePayment(txId);
      if (webhookRes) {
        return this.processPaidOrder(webhookRes.txId, webhookRes.paidAmountCents);
      }
    }
    return null;
  }

  processPaidOrder(txId: string, paidAmountCents: number): DonationOrder | null {
    const order = this.orders.get(txId);
    if (!order) return null;

    order.status = 'PAID';
    order.paidAt = new Date();
    return order;
  }
}
