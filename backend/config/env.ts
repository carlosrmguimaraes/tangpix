import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:tangpix_secure_pass_2026@localhost:5432/tangpix',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'tangpix_super_secret_jwt_key_2026_xyz987',

  // PIX Provider Configuration
  PIX_PROVIDER: (process.env.PIX_PROVIDER || 'mock') as 'mock' | 'efi' | 'asaas' | 'mercadopago',
  EFI_CLIENT_ID: process.env.EFI_CLIENT_ID || '',
  EFI_CLIENT_SECRET: process.env.EFI_CLIENT_SECRET || '',
  EFI_CERTIFICATE_BASE64: process.env.EFI_CERTIFICATE_BASE64 || '',
  EFI_PIX_KEY: process.env.EFI_PIX_KEY || '',

  ASAAS_API_KEY: process.env.ASAAS_API_KEY || '',
  ASAAS_WALLET_ID: process.env.ASAAS_WALLET_ID || '',

  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || '',

  // TTS Configuration (Modular)
  DEFAULT_TTS_PROVIDER: (process.env.DEFAULT_TTS_PROVIDER || 'edge') as 'edge' | 'elevenlabs' | 'openai' | 'selfhosted',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SELF_HOSTED_TTS_URL: process.env.SELF_HOSTED_TTS_URL || 'http://localhost:8000/tts',

  // Platform Economics
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5.0'), // 5% de taxa
  MINIMUM_DONATION_CENTS: parseInt(process.env.MINIMUM_DONATION_CENTS || '100', 10), // R$ 1,00 mínimo
};
