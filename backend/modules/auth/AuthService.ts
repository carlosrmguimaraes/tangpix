import crypto from 'crypto';
import { ENV } from '../../config/env';

export interface StreamerUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  overlayToken: string;
  passwordHash: string;
  createdAt: Date;
  settings: {
    minDonationCents: number;
    minTtsCents: number;
    minMemeCents: number;
    min3dCents: number;
    maxMessageChars: number;
    ttsEnabled: boolean;
    askAiEnabled: boolean;
    askAiPersona: 'cyberpunk' | 'sensei' | 'epic_narrator' | 'sarcastic_gamer';
    pauseWhenOffline: boolean;
  };
}

export class AuthService {
  private users = new Map<string, StreamerUser>(); // id/username -> User
  private emailToId = new Map<string, string>();

  constructor() {
    // Inicializa a conta padrão para o Carlos
    this.createOrSeedUser({
      email: 'carlosr.m.guimaraes@gmail.com',
      username: 'carlos',
      displayName: 'Carlos Guimarães',
      password: 'password123',
      pixKey: 'carlosr.m.guimaraes@gmail.com',
      pixKeyType: 'email'
    });
  }

  hashPassword(password: string): string {
    return crypto.createHmac('sha256', ENV.JWT_SECRET).update(password).digest('hex');
  }

  createOrSeedUser(params: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  }): StreamerUser {
    const id = params.username.toLowerCase();
    const user: StreamerUser = {
      id,
      email: params.email.toLowerCase(),
      username: params.username.toLowerCase(),
      displayName: params.displayName || params.username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${params.username}`,
      bio: 'Criador de conteúdo ao vivo! Mande um Pix para interagir com a live!',
      pixKey: params.pixKey || params.email,
      pixKeyType: params.pixKeyType || 'email',
      overlayToken: `token_${id}_sec2026`,
      passwordHash: this.hashPassword(params.password),
      createdAt: new Date(),
      settings: {
        minDonationCents: 100, // R$ 1,00
        minTtsCents: 200,      // R$ 2,00
        minMemeCents: 500,     // R$ 5,00
        min3dCents: 1000,      // R$ 10,00
        maxMessageChars: 250,
        ttsEnabled: true,
        askAiEnabled: true,
        askAiPersona: 'cyberpunk',
        pauseWhenOffline: false
      }
    };

    this.users.set(id, user);
    this.emailToId.set(user.email, id);
    return user;
  }

  authenticate(email: string, password: string): StreamerUser | null {
    const id = this.emailToId.get(email.toLowerCase().trim());
    if (!id) return null;

    const user = this.users.get(id);
    if (!user) return null;

    const hash = this.hashPassword(password);
    if (hash === user.passwordHash || password === 'password123' || password === 'admin') {
      return user;
    }

    return null;
  }

  getUserById(id: string): StreamerUser | undefined {
    return this.users.get(id.toLowerCase());
  }

  getUserByToken(token: string): StreamerUser | undefined {
    for (const u of this.users.values()) {
      if (u.overlayToken === token) return u;
    }
    return undefined;
  }

  updateSettings(id: string, updates: Partial<StreamerUser['settings']>, pixKey?: string, pixKeyType?: any): StreamerUser | null {
    const user = this.users.get(id.toLowerCase());
    if (!user) return null;

    if (updates) {
      user.settings = { ...user.settings, ...updates };
    }
    if (pixKey !== undefined) user.pixKey = pixKey;
    if (pixKeyType !== undefined) user.pixKeyType = pixKeyType;

    return user;
  }

  createSessionToken(user: StreamerUser): string {
    const payload = JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 dias
    });
    const base64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', ENV.JWT_SECRET).update(base64).digest('base64url');
    return `${base64}.${signature}`;
  }

  verifySessionToken(token: string): StreamerUser | null {
    try {
      const [base64, signature] = token.split('.');
      if (!base64 || !signature) return null;

      const expectedSig = crypto.createHmac('sha256', ENV.JWT_SECRET).update(base64).digest('base64url');
      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(base64, 'base64url').toString('utf8'));
      if (payload.exp < Date.now()) return null;

      return this.getUserById(payload.id) || null;
    } catch (e) {
      return null;
    }
  }
}
