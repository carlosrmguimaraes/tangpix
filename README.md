# ⚡ TangPix — Plataforma de Monetização Pix + Alertas Gamificados 3D

> **A união definitiva da velocidade do PIX brasileiro com a interatividade e entretenimento da Tangia.**

---

## 🌟 O que é o TangPix?

O **TangPix** transforma cada Pix enviado ao criador de conteúdo em um evento audiovisual interativo na transmissão ao vivo:
1. **Avatares 3D Interativos:** Modelos renderizados em WebGL/Three.js diretamente na tela da live que falam a mensagem do doador com sincronia labial.
2. **Memes de Vídeo Transparentes:** Memes flutuantes (WebM com canal alpha e animações CSS).
3. **AI TTS Modular de Custo ZERO:** Suporte nativo ao **Microsoft Edge Neural TTS** (100% gratuito e com vozes brasileiras hiper-naturais como Francisca, Antonio, Thalita e Fabio), com fallback e suporte a ElevenLabs e servidores GPU locais (Kokoro-TTS).
4. **Widget OBS Ultra-Leve:** Browser Source otimizado com transparência total e baixa utilização de CPU/GPU.
5. **Pagamento Instantâneo via Pix:** Confirmação em menos de 1 segundo via webhook (Efí, Asaas, Mercado Pago ou Mock Provider para testes).

---

## 🏗️ Arquitetura Modular

```
[ Espectador Mobile / Web ]
           │
           ▼
┌──────────────────────────┐       Pix (Webhook < 1s)       ┌────────────────────────┐
│  Página Pública /:user   │ ─────────────────────────────> │  PixService (Provider) │
│ (Escolhe 3D, Meme e Voz) │                                └────────────────────────┘
└──────────────────────────┘                                             │
                                                                         ▼
┌──────────────────────────┐      Alerta Instantâneo WS     ┌────────────────────────┐
│    OBS Browser Source    │ <───────────────────────────── │    WebSocketManager    │
│  (Three.js + TTS + WebM) │                                └────────────────────────┘
└──────────────────────────┘                                             ▲
                                                                         │
                                                            ┌────────────────────────┐
                                                            │  TtsService (Modular)  │
                                                            │ • Edge-TTS (Custo R$0) │
                                                            │ • ElevenLabs (Premium) │
                                                            │ • Kokoro (GPU Local)   │
                                                            └────────────────────────┘
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v20+
* Docker / Docker Compose

### Passo a Passo
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor em desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build
npm start
```

Acesse:
* **Página de Doação:** `http://localhost:3000/carlos`
* **Painel do Streamer:** `http://localhost:3000/dashboard`
* **Widget do OBS:** `http://localhost:3000/overlay/token_carlos_sec2026`

---

## ☁️ Implantação no EasyPanel

O projeto foi estruturado com suporte nativo ao **EasyPanel**:
1. Crie o projeto `tangpix` no seu painel.
2. Adicione os serviços:
   * **tangpix-postgres** (Banco PostgreSQL)
   * **tangpix-redis** (Fila e Cache de Áudio)
   * **tangpix-app** (Aplicação Node + Vite com Dockerfile multi-stage)
3. Conecte o repositório GitHub `carlosrmguimaraes/tangpix` com o Dockerfile padrão.
4. Mapeie a porta `3000` e ative o domínio SSL automático.

---

## 🔒 Segurança e Moderação
* Filtro de profanidade e termos proibidos com substituição por `***`.
* Sanitização contra injeção de links e exploits no TTS.
* Rate limiting e proteção contra DoS.
