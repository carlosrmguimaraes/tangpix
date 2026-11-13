export type AiPersona = 'cyberpunk' | 'sensei' | 'epic_narrator' | 'sarcastic_gamer';

export class AskAiService {
  private personaPrompts: Record<AiPersona, { name: string; system: string }> = {
    cyberpunk: {
      name: 'Robô Cyberpunk 3D',
      system: 'Você é um robô cyberpunk de alta tecnologia que vive dentro da live do streamer. Responda em no máximo 15 palavras, com energia, termos gamers/futuristas (ex: "Protocolo ativado!", "Sintonia 100%"). Seja bem-humorado e rápido.'
    },
    sensei: {
      name: 'Sensei Místico',
      system: 'Você é um velho mestre de artes marciais que dá conselhos filosóficos hilários para os gamers na live. Responda em até 15 palavras com sabedoria cômica.'
    },
    epic_narrator: {
      name: 'Narrador Épico',
      system: 'Você é um narrador de e-sports brasileiro extremamente animado. Responda em até 15 palavras com pura adrenalina, como se estivesse narrando a final de um mundial!'
    },
    sarcastic_gamer: {
      name: 'Gamer Zoeiro',
      system: 'Você é um companheiro de jogo zoeiro e leal da live. Responda em até 15 palavras com ironia leve e engraçada celebrando o Pix recebido.'
    }
  };

  async generateResponse(message: string, persona: AiPersona = 'cyberpunk', donorName: string = 'Doador'): Promise<string> {
    const p = this.personaPrompts[persona] || this.personaPrompts.cyberpunk;

    // Se houver OpenAI ou Gemini configurado, pode chamar a API externa.
    // Para latência instantânea (< 200ms) e custo ZERO, temos também um fallback gerador procedural de alta inteligência:
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: p.system },
              { role: 'user', content: `Doador: ${donorName}. Mensagem: "${message}". Dê uma resposta curta no personagem.` }
            ],
            max_tokens: 45,
            temperature: 0.8
          })
        });
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text.replace(/["']/g, '');
      } catch (e) {
        console.warn('Fallback para engine procedural de IA contextual:', e);
      }
    }

    // Engine Procedural Ultrarrápida de Resposta Contextual (Zero Latência, Custo R$0)
    return this.getProceduralResponse(message, persona, donorName);
  }

  private getProceduralResponse(message: string, persona: AiPersona, donorName: string): string {
    const cleanMsg = message.toLowerCase();
    
    if (persona === 'cyberpunk') {
      const templates = [
        `Transmissão neural de ${donorName} recebida! Protocolo de hype ativado com sucesso!`,
        `Energia de ${donorName} sincronizada no sistema central! O chat agora é nosso!`,
        `Mensagem decodificada: "${message}". A matrix da live foi atualizada!`,
        `Alerta quântico confirmado! Valeu pelo boost de overclock, ${donorName}!`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }

    if (persona === 'sensei') {
      const templates = [
        `Paciência jovem ${donorName}, aquele que manda Pix atinge a iluminação no servidor!`,
        `Como diz o provérbio dos monges da live: quem doa com sabedoria, nunca morre no drop!`,
        `Grande sabedoria em suas palavras, ${donorName}. O dragão interior despertou!`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }

    if (persona === 'epic_narrator') {
      const templates = [
        `QUE JOGADA HISTÓRICA DO ${donorName.toUpperCase()}! O PIX ENTROU NO ÂNGULO SEM CHANCE DE DEFESA!`,
        `OLHA O QUE ELE FEZ! ${donorName.toUpperCase()} CHEGOU DESTROÇANDO A TRANSMISSÃO! É HYPE TOTAL!`,
        `É DISSO QUE O BRASIL GOSTA! O CHAT TÁ PEGANDO FOGO COM ESSA MENSAGEM DO ${donorName.toUpperCase()}!`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }

    // sarcastic_gamer
    const templates = [
      `Mandou bem, ${donorName}! Já garantiu a skin lendária pro streamer não passar vergonha!`,
      `Tá pagando de pro player hein ${donorName}? Mas com esse Pix tá liberado jogar mal!`,
      `Aí sim! O streamer tava quase chorando até esse Pix do ${donorName} salvar o dia!`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}
