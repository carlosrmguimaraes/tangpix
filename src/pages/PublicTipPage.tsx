import React, { useState, useEffect } from 'react';
import { PixModal } from '../components/PixModal';
import { Sparkles, Bot, Film, Volume2, Music, CheckCircle2, ShieldCheck, Heart, Radio, Lock } from 'lucide-react';

interface PublicTipPageProps {
  username: string;
}

export const PublicTipPage: React.FC<PublicTipPageProps> = ({ username }) => {
  const [streamer, setStreamer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [actionType, setActionType] = useState<'avatar_3d' | 'meme_webm' | 'tts' | 'sound_effect'>('avatar_3d');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('pt-BR-FranciscaNeural');
  const [donorName, setDonorName] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('10.00');
  const [message, setMessage] = useState<string>('');

  // Modal State
  const [pixModalData, setPixModalData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/streamers/${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStreamer(data.data);
          if (data.data.catalog?.avatars3d?.[0]) {
            setSelectedAsset(data.data.catalog.avatars3d[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [username]);

  const amountCents = Math.round(parseFloat(amountInput || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountCents < (streamer?.settings?.minDonationCents || 100)) {
      alert(`O valor mínimo para doação é R$ ${((streamer?.settings?.minDonationCents || 100) / 100).toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      let actionAssetUrl = '';
      if (actionType === 'meme_webm') {
        const found = streamer?.catalog?.memes?.find((m: any) => m.id === selectedAsset);
        actionAssetUrl = found?.videoUrl || '';
      }

      const res = await fetch('/api/donations/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: streamer?.id || username,
          donorName: donorName || 'Anônimo',
          amountCents,
          message,
          actionType,
          actionAssetUrl,
          voiceId: selectedVoice,
          voiceProvider: 'edge'
        })
      });

      const data = await res.json();
      if (data.success) {
        setPixModalData(data.data);
      } else {
        alert(data.error || 'Erro ao gerar cobrança Pix');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        Carregando página do streamer...
      </div>
    );
  }

  const isOnline = streamer?.isOnline;
  const pixPass = streamer?.pixPass;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header com Login do Streamer */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wider text-sm">
              Tang<span className="text-pix-cyan">Pix</span>
            </span>
          </div>

          <a
            href="/login"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition text-xs font-semibold"
          >
            <Lock className="w-3.5 h-3.5 text-pix-cyan" /> Área do Streamer (Login)
          </a>
        </div>

        {/* Header do Streamer */}
        <div className="p-6 rounded-2xl glass-panel-glow text-center relative overflow-hidden">
          {/* Status do OBS Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-[11px] font-bold border shadow-md bg-slate-900">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-brand-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={isOnline ? 'text-brand-400' : 'text-slate-400'}>
              {isOnline ? '🟢 OBS AO VIVO (ALERTA IMEDIATO)' : '🔴 OBS OFFLINE (ALERTA EM FILA)'}
            </span>
          </div>

          <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-pix-cyan to-brand-500 shadow-xl mb-3">
            <img
              src={streamer?.avatarUrl}
              alt={streamer?.displayName}
              className="w-full h-full object-cover rounded-full bg-slate-800"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-white">{streamer?.displayName}</h1>
            <CheckCircle2 className="w-5 h-5 text-pix-cyan" />
          </div>
          <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">{streamer?.bio}</p>

          {/* PixPass Meta da Comunidade */}
          {pixPass && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-sm">{pixPass.currentTier.badge}</span>
                  PixPass da Comunidade (Nível {pixPass.currentLevel} - {pixPass.currentTier.title})
                </span>
                <span className="text-pix-cyan font-mono text-[11px] font-bold">
                  {pixPass.progressPercentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-pix-cyan to-brand-500 rounded-full"
                  style={{ width: `${pixPass.progressPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Mande um Pix para ajudar a bater a meta de REP do canal e desbloquear novos avatares!
              </p>
            </div>
          )}
        </div>

        {/* Formulário Principal de Interatividade */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-panel space-y-6">
          {/* Seletor de Tipo de Alerta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Escolha a Interatividade na Tela:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => { setActionType('avatar_3d'); setAmountInput('10.00'); }}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  actionType === 'avatar_3d'
                    ? 'border-pix-cyan bg-pix-cyan/15 text-pix-cyan shadow-lg shadow-pix-cyan/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bot className="w-5 h-5" />
                <span className="text-xs font-bold">Avatar 3D</span>
                <span className="text-[10px] opacity-75">A partir R$ 10</span>
              </button>

              <button
                type="button"
                onClick={() => { setActionType('meme_webm'); setAmountInput('5.00'); }}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  actionType === 'meme_webm'
                    ? 'border-neon-pink bg-neon-pink/15 text-neon-pink shadow-lg shadow-neon-pink/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Film className="w-5 h-5" />
                <span className="text-xs font-bold">Meme Vídeo</span>
                <span className="text-[10px] opacity-75">A partir R$ 5</span>
              </button>

              <button
                type="button"
                onClick={() => { setActionType('tts'); setAmountInput('2.00'); }}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  actionType === 'tts'
                    ? 'border-brand-400 bg-brand-400/15 text-brand-400 shadow-lg shadow-brand-400/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-xs font-bold">Voz IA (TTS)</span>
                <span className="text-[10px] opacity-75">A partir R$ 2</span>
              </button>

              <button
                type="button"
                onClick={() => { setActionType('sound_effect'); setAmountInput('2.00'); }}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  actionType === 'sound_effect'
                    ? 'border-neon-amber bg-neon-amber/15 text-neon-amber shadow-lg shadow-neon-amber/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Music className="w-5 h-5" />
                <span className="text-xs font-bold">Soundboard</span>
                <span className="text-[10px] opacity-75">A partir R$ 2</span>
              </button>
            </div>
          </div>

          {/* Subcatálogo: Memes */}
          {actionType === 'meme_webm' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300">Escolha o Meme de Vídeo:</label>
              <div className="grid grid-cols-3 gap-2">
                {streamer?.catalog?.memes?.map((meme: any) => (
                  <button
                    key={meme.id}
                    type="button"
                    onClick={() => setSelectedAsset(meme.id)}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition ${
                      selectedAsset === meme.id
                        ? 'border-neon-pink bg-neon-pink/20 text-white font-bold'
                        : 'border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {meme.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seleção de Voz de IA */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Escolha a Voz da Inteligência Artificial:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Feminina)' },
                { id: 'pt-BR-AntonioNeural', name: 'Antonio (Masculina)' },
                { id: 'pt-BR-ThalitaNeural', name: 'Thalita (Jovem)' },
                { id: 'pt-BR-FabioNeural', name: 'Fabio (Gamer)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-2.5 rounded-lg border text-xs text-left transition ${
                    selectedVoice === v.id
                      ? 'border-pix-cyan bg-pix-cyan/15 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Valor da Doação Pix */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Valor do Pix (R$):
            </label>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="1.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-lg text-white focus:outline-none focus:border-pix-cyan"
                />
              </div>

              {/* Botões de Valor Rápido */}
              <div className="flex gap-1.5">
                {['2.00', '5.00', '10.00', '20.00', '50.00'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountInput(val)}
                    className="px-2.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    R$ {parseInt(val)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nome e Mensagem */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Seu Nome ou Nickname:
              </label>
              <input
                type="text"
                placeholder="Ex: ProPlayer99 (ou deixe vazio para Anônimo)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mensagem que será lida na live:
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {message.length} / 250 caracteres
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Escreva sua mensagem divertida para a live..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={250}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan resize-none"
              />
            </div>

            {/* Aviso Ask AI */}
            {streamer?.settings?.askAiEnabled && (
              <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center gap-2.5 text-xs text-neon-purple">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Ask AI Ativo:</strong> A inteligência artificial do canal vai criar uma resposta divertida para você ao vivo!
                </span>
              </div>
            )}
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-pix-cyan via-brand-500 to-pix-emerald text-black font-extrabold text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-pix-cyan/25 hover:opacity-95 transition active:scale-[0.99]"
          >
            <Sparkles className="w-5 h-5" />
            {isSubmitting ? 'Gerando Pix...' : `Pagar Pix de R$ ${(amountCents / 100).toFixed(2).replace('.', ',')} & Tocar na Live`}
          </button>
        </form>
      </div>

      {/* Modal do Pix */}
      {pixModalData && (
        <PixModal
          isOpen={!!pixModalData}
          onClose={() => setPixModalData(null)}
          txId={pixModalData.txId}
          amountCents={pixModalData.order?.amountCents || amountCents}
          qrCodeSvg={pixModalData.qrCodeSvg}
          pixCopiaECola={pixModalData.pixCopiaECola}
          streamerName={streamer?.displayName || username}
          onPaymentSuccess={() => {
            setMessage('');
          }}
        />
      )}
    </div>
  );
};
