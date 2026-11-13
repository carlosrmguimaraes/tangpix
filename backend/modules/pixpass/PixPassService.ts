export interface PixPassTier {
  level: number;
  requiredRep: number;
  title: string;
  badge: string;
  perks: string[];
  platformFeeDiscount: number; // Redução percentual na taxa
}

export class PixPassService {
  private static tiers: PixPassTier[] = [
    { level: 1, requiredRep: 0, title: 'Iniciante TangPix', badge: '🌱', perks: ['Avatares 3D Básicos', 'Edge-TTS Grátis'], platformFeeDiscount: 0 },
    { level: 5, requiredRep: 500, title: 'Streamer Promissor', badge: '⚡', perks: ['+2 Memes de Tela Cheia', 'Badge no Chat'], platformFeeDiscount: 0.5 },
    { level: 10, requiredRep: 1500, title: 'TangPix Afiliado', badge: '🔥', perks: ['Avatar Dragão 3D', 'Ask AI Habilitado', 'Taxa 4.5%'], platformFeeDiscount: 1.0 },
    { level: 15, requiredRep: 3500, title: 'Mestre da Live', badge: '💎', perks: ['Vozes Clonadas Próprias', 'Taxa 4.0%'], platformFeeDiscount: 1.5 },
    { level: 20, requiredRep: 7000, title: 'TangPix Parceiro Oficial', badge: '👑', perks: ['Prioridade Máxima', 'Taxa Reduzida para 3.5%', 'Selo Verificado'], platformFeeDiscount: 2.0 },
    { level: 30, requiredRep: 15000, title: 'Lenda do Streaming', badge: '🚀', perks: ['Taxa VIP 2.5%', 'Avatares Customizados Exclusivos'], platformFeeDiscount: 2.5 }
  ];

  // Calcula o nível e o progresso atual com base no valor acumulado em centavos
  static calculateProgress(totalDonatedCents: number): {
    currentLevel: number;
    currentRep: number;
    currentTier: PixPassTier;
    nextTier?: PixPassTier;
    progressPercentage: number;
    repToNextLevel: number;
  } {
    // R$ 1,00 = 100 centavos = 10 REP
    const currentRep = Math.floor(totalDonatedCents / 10);

    let currentTier = this.tiers[0];
    let nextTier: PixPassTier | undefined = this.tiers[1];

    for (let i = 0; i < this.tiers.length; i++) {
      if (currentRep >= this.tiers[i].requiredRep) {
        currentTier = this.tiers[i];
        nextTier = this.tiers[i + 1];
      } else {
        break;
      }
    }

    if (!nextTier) {
      return {
        currentLevel: currentTier.level,
        currentRep,
        currentTier,
        progressPercentage: 100,
        repToNextLevel: 0
      };
    }

    const tierRange = nextTier.requiredRep - currentTier.requiredRep;
    const repInRange = currentRep - currentTier.requiredRep;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((repInRange / tierRange) * 100)));
    const repToNextLevel = Math.max(0, nextTier.requiredRep - currentRep);

    return {
      currentLevel: currentTier.level,
      currentRep,
      currentTier,
      nextTier,
      progressPercentage,
      repToNextLevel
    };
  }

  static getAllTiers(): PixPassTier[] {
    return this.tiers;
  }
}
