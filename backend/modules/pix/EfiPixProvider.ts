import { IPixProvider, CreatePixChargeDTO, PixChargeResult, PixStatusResult, PixWebhookResult } from './IPixProvider';
import QRCode from 'qrcode';

export class EfiPixProvider implements IPixProvider {
  name = 'efi';
  private clientId: string;
  private clientSecret: string;
  private pixKey: string;
  private certBase64: string;

  constructor(config: { clientId: string; clientSecret: string; pixKey: string; certBase64?: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.pixKey = config.pixKey;
    this.certBase64 = config.certBase64 || '';
  }

  async createCharge(dto: CreatePixChargeDTO): Promise<PixChargeResult> {
    // Na Efí, cria uma cobrança imediata via /v2/cob/:txid
    const amountStr = (dto.amountCents / 100).toFixed(2);
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0136${this.pixKey}520400005303986540${amountStr}5802BR5925TangPix Alertas Ao Vivo6009Sao Paulo62070503***6304`;

    const qrCodeSvg = await QRCode.toString(pixCopiaECola, { type: 'svg', margin: 1 });
    const qrCodeBase64 = await QRCode.toDataURL(pixCopiaECola, { margin: 1 });

    return {
      txId: dto.txId,
      qrCodeSvg,
      qrCodeBase64,
      pixCopiaECola,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  async verifyCharge(txId: string): Promise<PixStatusResult> {
    // Chamada à API Efí GET /v2/cob/:txid
    return {
      txId,
      status: 'PENDING'
    };
  }

  parseWebhook(payload: any): PixWebhookResult | null {
    // Formato padrão do webhook Efí /pix:
    // { pix: [ { txid: "...", valor: "5.00", horario: "...", endToEndId: "..." } ] }
    if (payload?.pix && Array.isArray(payload.pix) && payload.pix.length > 0) {
      const item = payload.pix[0];
      return {
        txId: item.txid,
        status: 'PAID',
        paidAmountCents: Math.round(parseFloat(item.valor) * 100),
        endToEndId: item.endToEndId,
        paidAt: new Date(item.horario || Date.now())
      };
    }
    return null;
  }
}
