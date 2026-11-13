import { IPixProvider, CreatePixChargeDTO, PixChargeResult, PixStatusResult, PixWebhookResult } from './IPixProvider';
import QRCode from 'qrcode';

export class MockPixProvider implements IPixProvider {
  name = 'mock';
  private charges = new Map<string, { status: 'PENDING' | 'PAID' | 'EXPIRED'; amountCents: number; createdAt: Date }>();

  async createCharge(dto: CreatePixChargeDTO): Promise<PixChargeResult> {
    const expiresAt = new Date(Date.now() + (dto.expiresInSeconds || 3600) * 1000);
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0136mock-chave-pix-${dto.txId}520400005303986540${(dto.amountCents / 100).toFixed(2)}5802BR5925TangPix Plataforma Gamificada6009Sao Paulo62070503***6304MOCK`;

    let qrCodeSvg = '';
    let qrCodeBase64 = '';
    try {
      qrCodeSvg = await QRCode.toString(pixCopiaECola, { type: 'svg', margin: 1 });
      qrCodeBase64 = await QRCode.toDataURL(pixCopiaECola, { margin: 1 });
    } catch (e) {
      // Fallback SVG
      qrCodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50" fill="black">MOCK PIX</text></svg>`;
    }

    this.charges.set(dto.txId, {
      status: 'PENDING',
      amountCents: dto.amountCents,
      createdAt: new Date()
    });

    return {
      txId: dto.txId,
      qrCodeSvg,
      qrCodeBase64,
      pixCopiaECola,
      expiresAt
    };
  }

  async verifyCharge(txId: string): Promise<PixStatusResult> {
    const charge = this.charges.get(txId);
    if (!charge) {
      return { txId, status: 'EXPIRED' };
    }
    return {
      txId,
      status: charge.status,
      paidAmountCents: charge.amountCents,
      paidAt: charge.status === 'PAID' ? new Date() : undefined
    };
  }

  // Simula o pagamento instantâneo do Pix para testes e demonstração
  simulatePayment(txId: string): PixWebhookResult | null {
    const charge = this.charges.get(txId);
    if (!charge) return null;

    charge.status = 'PAID';
    return {
      txId,
      status: 'PAID',
      paidAmountCents: charge.amountCents,
      endToEndId: `E${Date.now()}MOCKPIX${Math.random().toString(36).substring(7).toUpperCase()}`,
      paidAt: new Date()
    };
  }

  parseWebhook(payload: any): PixWebhookResult | null {
    if (payload?.txId && payload?.status === 'PAID') {
      return {
        txId: payload.txId,
        status: 'PAID',
        paidAmountCents: payload.paidAmountCents || 500,
        endToEndId: payload.endToEndId || `E${Date.now()}SIM`,
        paidAt: new Date()
      };
    }
    return null;
  }
}
