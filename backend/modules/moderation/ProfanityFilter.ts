export class ProfanityFilter {
  // Lista base de termos ofensivos e proibidos em transmissões ao vivo
  private static defaultBannedWords: string[] = [
    'viado', 'bicha', 'traveco', 'preto sujo', 'macaco', 'arrombado', 'filho da puta',
    'fdp', 'vtnc', 'nazista', 'hitler', 'estupro', 'pedofilo', 'suicidio', 'se mata'
  ];

  static filterText(text: string, customBannedWords: string[] = []): { cleanText: string; hasViolation: boolean; flaggedWords: string[] } {
    if (!text) return { cleanText: '', hasViolation: false, flaggedWords: [] };

    const allBanned = [...this.defaultBannedWords, ...customBannedWords.map(w => w.toLowerCase().trim())];
    let cleanText = text;
    const flaggedWords: string[] = [];
    let hasViolation = false;

    // Normalização básica de caracteres leet/repetidos
    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const word of allBanned) {
      if (!word) continue;
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(normalized)) {
        hasViolation = true;
        flaggedWords.push(word);
        cleanText = cleanText.replace(regex, '***');
      }
    }

    // Remove URLs suspeitas ou links maliciosos
    cleanText = cleanText.replace(/https?:\/\/[^\s]+/gi, '[link removido]');

    return {
      cleanText,
      hasViolation,
      flaggedWords
    };
  }
}
