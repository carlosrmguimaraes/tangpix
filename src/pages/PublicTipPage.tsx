import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Bot,
  Film,
  Mic,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Play,
  Flame,
  HelpCircle,
  Moon,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { PixModal } from '../components/PixModal';

interface StreamerProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  pixPass?: {
    level: number;
    title: string;
    rep: number;
    feeDiscountPercentage: number;
  };
  settings: {
    minDonationCents: number;
    minTtsCents: number;
    minMemeCents: number;
    min3dCents: number;
    maxMessageChars: number;
    ttsEnabled: boolean;
    askAiEnabled: boolean;
    pauseWhenOffline: boolean;
  };
}

const QUICK_AMOUNTS = [2, 5, 10, 20, 50, 100];

const VOICES = [
  { id: 'default', name: 'Voz Padrão (Neural Francisca)', desc: 'Natural e cristalina' },
  { id: 'silvao', name: 'Silvão (Caricatura)', desc: 'Quem quer dinheiro?!' },
  { id: 'faustinho', name: 'Faustinho (Caricatura)', desc: 'Ô loco meu!' },
  { id: 'molusco', name: 'Molusco (Caricatura)', desc: 'Companheiro!' },
  { id: 'bolso', name: 'Bolso (Caricatura)', desc: 'Ta ok?!' },
  { id: 'epic_narrator', name: 'Narrador Épico', desc: 'Voz de cinema' },
  { id: 'cyberpunk', name: 'Cyberpunk IA', desc: 'Sintética do futuro' }
];

const AVATARS_3D = [
  { id: 'robot_cyber', name: 'Robô Cyberpunk', color: '#00d182', icon: '🤖' },
  { id: 'alien_neon', name: 'Alien Neon', color: '#8b5cf6', icon: '👽' },
  { id: 'mech_gold', name: 'Mech Dourado', color: '#f59e0b', icon: '⚡' },
  { id: 'holo_matrix', name: 'Holograma Matrix', color: '#06b6d4', icon: '👾' }
];

const MEMES_LIST = [
  { id: 'confetti', name: 'Chuva de Confetes', icon: '🎉' },
  { id: 'dancing_cat', name: 'Gato Dançante', icon: '🐱' },
  { id: 'fireworks', name: 'Fogos de Artifício', icon: '🎆' },
  { id: 'deal_with_it', name: 'Óculos Thug Life', icon: '🕶️' }
];

const AI_SAMPLE_MESSAGES = [
  'Parabéns pela live mano, a gameplay hoje tá absurda!',
  'Manda um salve pro pessoal do Discord! Tamo junto demais!',
  'Essa jogada merece entrar pros melhores clipes do ano!',
  'Qual seu setup atual pra aguentar rodar tudo no ultra?',
  'Mais um sub pra conta! Continua amassando na stream!'
];

interface PublicTipPageProps {
  username?: string;
}

export const PublicTipPage: React.FC<PublicTipPageProps> = ({ username = 'carlos' }) => {
  const [streamer, setStreamer] = useState<StreamerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [modality, setModality] = useState<'message' | '3d' | 'meme' | 'audio' | 'sound'>('message');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedAvatar, setSelectedAvatar] = useState('robot_cyber');
  const [selectedMeme, setSelectedMeme] = useState('confetti');
  const [askAi, setAskAi] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const [coverFee, setCoverFee] = useState(true);

  // Modal Pix State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    txId: string;
    amountCents: number;
    qrCodeSvg: string;
    pixCopiaECola: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadStreamer() {
      try {
        const res = await fetch(`/api/streamers/${username || 'carlos'}`);
        const data = await res.json();
        if (data.success) {
          setStreamer(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStreamer();
  }, [username]);

  // Cálculos financeiros com a taxa LivePix (5%)
  const baseCents = Math.round(amount * 100);
  const feeCents = coverFee ? Math.round(baseCents * 0.05) : 0;
  const totalCents = baseCents + feeCents;

  const handleGenerateAiMessage = () => {
    const randomMsg = AI_SAMPLE_MESSAGES[Math.floor(Math.random() * AI_SAMPLE_MESSAGES.length)];
    setMessage(randomMsg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert('Por favor, informe seu nome ou apelido.');
      return;
    }
    if (amount < 1) {
      alert('O valor mínimo de doação é R$ 1,00.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        streamerUsername: streamer?.username || 'carlos',
        donorName: donorName.trim(),
        amountCents: totalCents,
        message: message.trim(),
        ttsVoice: selectedVoice,
        avatar3dId: modality === '3d' ? selectedAvatar : undefined,
        memeUrl: modality === 'meme' ? selectedMeme : undefined,
        askAi: askAi,
        feeCovered: coverFee
      };

      const res = await fetch('/api/donations/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPixData({
          txId: data.data.txId,
          amountCents: totalCents,
          qrCodeSvg: data.data.qrCodeSvg,
          pixCopiaECola: data.data.pixCopiaECola
        });
        setIsModalOpen(true);
      } else {
        alert(data.error || 'Erro ao gerar Pix.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-[#00d182] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Carregando perfil do criador...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Livepix Style */}
      <header className="border-b border-[#1c2230] bg-[#0e121a]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              Tang<span className="text-[#00d182]">Pix</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/20 hidden sm:inline-block">
              Livepix + Tangia
            </span>
          </a>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-[#171c2b] hover:bg-[#20273c] text-slate-300 hover:text-white border border-[#232b3d] transition"
            >
              Sou Streamer
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        {/* Streamer Profile Card */}
        <div className="bg-[#131722] rounded-2xl border border-[#202636] p-6 mb-6 text-center relative overflow-hidden shadow-xl">
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {streamer?.isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/30">
                <span className="w-2 h-2 rounded-full bg-[#00d182] animate-pulse"></span>
                Ao Vivo no OBS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                OBS Offline
              </span>
            )}
          </div>

          {/* Avatar */}
          <div className="relative inline-block mb-3">
            <img
              src={streamer?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos'}
              alt={streamer?.displayName}
              className="w-20 h-20 rounded-full bg-[#1a202c] border-2 border-[#00d182] p-1 shadow-lg"
            />
            <div className="absolute bottom-0 right-0 p-1 bg-[#00d182] text-[#0b0e14] rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
            {streamer?.displayName || 'Carlos Guimarães'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">@{streamer?.username || 'carlos'}</p>
          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            {streamer?.bio || 'Mande um Pix para interagir com a live! Mensagens lidas com voz ao vivo e avatares 3D!'}
          </p>

          {/* Gamification PixPass Progress Bar */}
          {streamer?.pixPass && (
            <div className="mt-4 pt-4 border-t border-[#1c2230] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#00d182]" />
                <span className="font-semibold text-white">Nível {streamer.pixPass.level}</span>
                <span>• {streamer.pixPass.title}</span>
              </div>
              <span className="text-[11px] text-[#00d182] font-semibold bg-[#00d182]/10 px-2 py-0.5 rounded-md border border-[#00d182]/20">
                Taxa {5 - streamer.pixPass.feeDiscountPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Tip Form Card */}
        <div className="bg-[#131722] rounded-2xl border border-[#202636] p-6 shadow-xl space-y-6">
          {/* Modality Selector Pills (Livepix Style) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Escolha como deseja apoiar:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setModality('message')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition ${
                  modality === 'message'
                    ? 'bg-[#00d182]/15 border-[#00d182] text-white shadow-sm'
                    : 'bg-[#171c2b] border-[#202636] text-slate-400 hover:text-white hover:bg-[#1d2336]'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-[#00d182]" />
                <span>Mensagem</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('3d')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition ${
                  modality === '3d'
                    ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-white shadow-sm'
                    : 'bg-[#171c2b] border-[#202636] text-slate-400 hover:text-white hover:bg-[#1d2336]'
                }`}
              >
                <Bot className="w-4 h-4 text-[#8b5cf6]" />
                <span>Avatar 3D</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('meme')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition ${
                  modality === 'meme'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                    : 'bg-[#171c2b] border-[#202636] text-slate-400 hover:text-white hover:bg-[#1d2336]'
                }`}
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>Meme</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('audio')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition ${
                  modality === 'audio'
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                    : 'bg-[#171c2b] border-[#202636] text-slate-400 hover:text-white hover:bg-[#1d2336]'
                }`}
              >
                <Mic className="w-4 h-4 text-rose-400" />
                <span>Voz</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('sound')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition ${
                  modality === 'sound'
                    ? 'bg-sky-500/20 border-sky-500 text-white shadow-sm'
                    : 'bg-[#171c2b] border-[#202636] text-slate-400 hover:text-white hover:bg-[#1d2336]'
                }`}
              >
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Som</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Donor Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Seu nome de usuário ou apelido:
              </label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="Ex: PedroGamer, DevAnonimo..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00d182] transition"
              />
            </div>

            {/* Message with AI Assistant */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mensagem que será lida na stream:
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiMessage}
                  className="text-[11px] font-semibold text-[#00d182] hover:text-[#00b872] flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" /> Gerar com IA
                </button>
              </div>
              <textarea
                rows={3}
                maxLength={400}
                placeholder="Escreva algo épico para aparecer no OBS e ser sintetizado ao vivo..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00d182] transition resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Voz neural sintetizada em tempo real</span>
                <span>{message.length}/400 caracteres</span>
              </div>
            </div>

            {/* Voice Picker Dropdown (Livepix 25 Voices Style) */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Escolha a voz do Text-to-Speech:
              </label>
              <button
                type="button"
                onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-sm text-left flex items-center justify-between hover:border-slate-600 transition"
              >
                <div>
                  <span className="font-medium text-white">
                    {VOICES.find((v) => v.id === selectedVoice)?.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({VOICES.find((v) => v.id === selectedVoice)?.desc})
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {voiceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#171c2b] border border-[#262f44] rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto p-1">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVoice(v.id);
                        setVoiceDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition ${
                        selectedVoice === v.id
                          ? 'bg-[#00d182]/15 text-[#00d182] font-semibold'
                          : 'text-slate-300 hover:bg-[#1e2538] hover:text-white'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="text-[11px] text-slate-400">{v.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modality Extra: Avatar 3D (Tangia Power) */}
            {modality === '3d' && (
              <div className="p-4 bg-[#171c2b] rounded-xl border border-[#8b5cf6]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8b5cf6]">
                  <Bot className="w-4 h-4" /> Selecione o Avatar 3D Interativo:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVATARS_3D.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-3 rounded-xl border text-center transition ${
                        selectedAvatar === av.id
                          ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-white shadow-md'
                          : 'bg-[#0b0e14] border-[#202636] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{av.icon}</div>
                      <div className="text-xs font-semibold">{av.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modality Extra: Memes Flutuantes */}
            {modality === 'meme' && (
              <div className="p-4 bg-[#171c2b] rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Film className="w-4 h-4" /> Selecione o Meme Alpha em Tela:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MEMES_LIST.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMeme(m.id)}
                      className={`p-3 rounded-xl border text-center transition ${
                        selectedMeme === m.id
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                          : 'bg-[#0b0e14] border-[#202636] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <div className="text-xs font-semibold">{m.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ask AI Toggle (Tangia Feature) */}
            <div className="p-3.5 bg-[#171c2b] rounded-xl border border-[#202636] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00d182]" /> Pergunte à IA na Stream
                </div>
                <div className="text-[11px] text-slate-400">
                  A IA responderá à sua mensagem ao vivo com voz de personagem!
                </div>
              </div>
              <input
                type="checkbox"
                checked={askAi}
                onChange={(e) => setAskAi(e.target.checked)}
                className="w-5 h-5 accent-[#00d182] rounded cursor-pointer"
              />
            </div>

            {/* Value Selector (Chips + Input) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Valor do Pix:
              </label>

              {/* Chips Rápidos */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      amount === amt
                        ? 'bg-[#00d182] text-[#0b0e14] border-[#00d182] shadow-md'
                        : 'bg-[#171c2b] border-[#202636] text-slate-300 hover:bg-[#1d2336] hover:text-white'
                    }`}
                  >
                    R$ {amt}
                  </button>
                ))}
              </div>

              {/* Input Numérico */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  min={1}
                  step="0.50"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-base font-bold text-white focus:outline-none focus:border-[#00d182] transition"
                  placeholder="0,00"
                />
              </div>
              <p className="text-[11px] text-slate-500">O valor mínimo aceito é de R$ 1,00</p>
            </div>

            {/* Famoso Switch LivePix: "Eu pago a taxa para o criador receber o valor completo" */}
            <div className="p-3.5 bg-[#171c2b] rounded-xl border border-[#202636] flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <div className="text-xs font-semibold text-white">
                  Eu pago a taxa para o criador receber o valor completo.
                </div>
                <div className="text-[11px] text-[#00d182]">
                  {coverFee ? (
                    <>Taxa de 5% (+ R$ {(feeCents / 100).toFixed(2).replace('.', ',')}) coberta por você!</>
                  ) : (
                    <span className="text-slate-400">Taxa deduzida do repasse ao criador</span>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={coverFee}
                onChange={(e) => setCoverFee(e.target.checked)}
                className="w-5 h-5 accent-[#00d182] rounded cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl livepix-btn-primary flex items-center justify-center gap-2 text-sm tracking-wide shadow-lg disabled:opacity-50 transition"
            >
              {submitting ? (
                <>Gerando QR Code Pix...</>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Continuar para pagamento (R$ {(totalCents / 100).toFixed(2).replace('.', ',')})
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              Ao clicar em continuar, você concorda com os Termos de Uso e Política de Privacidade da plataforma TangPix.
            </p>
          </form>
        </div>
      </main>

      {/* Pix Checkout Modal */}
      {pixData && (
        <PixModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          txId={pixData.txId}
          amountCents={pixData.amountCents}
          qrCodeSvg={pixData.qrCodeSvg}
          pixCopiaECola={pixData.pixCopiaECola}
          streamerName={streamer?.displayName || 'Carlos'}
          feeCovered={coverFee}
        />
      )}
    </div>
  );
};
