export interface CreatePixChargeDTO {
  txId: string;
  amountCents: number; // Valor em centavos (ex: 500 = R$ 5,00)
  description: string;
  donorName: string;
  streamerId: string;
  expiresInSeconds?: number;
}

export interface PixChargeResult {
  txId: string;
  qrCodeSvg?: string;
  qrCodeBase64?: string;
  pixCopiaECola: string;
  expiresAt: Date;
}

export interface PixStatusResult {
  txId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  paidAt?: Date;
  paidAmountCents?: number;
}

export interface PixWebhookResult {
  txId: string;
  status: 'PAID' | 'FAILED';
  paidAmountCents: number;
  endToEndId?: string;
  paidAt: Date;
}

export interface IPixProvider {
  name: string;
  createCharge(dto: CreatePixChargeDTO): Promise<PixChargeResult>;
  verifyCharge(txId: string): Promise<PixStatusResult>;
  parseWebhook(payload: any, headers?: Record<string, any>): PixWebhookResult | null;
}
