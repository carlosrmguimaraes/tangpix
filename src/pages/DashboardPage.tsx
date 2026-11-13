import React, { useState, useEffect } from 'react';
import { Copy, Check, Play, SkipForward, ExternalLink, Settings, Shield, DollarSign, Users, Radio, Sparkles, Bot, Save, LogOut, Flame, HelpCircle } from 'lucide-react';

export const DashboardPage: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [pixPass, setPixPass] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings form
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('email');
  const [askAiEnabled, setAskAiEnabled] = useState(true);
  const [askAiPersona, setAskAiPersona] = useState('cyberpunk');
  const [pauseWhenOffline, setPauseWhenOffline] = useState(false);
  const [minDonation, setMinDonation] = useState('1.00');

  useEffect(() => {
    const token = localStorage.getItem('tangpix_token');
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Não autenticado');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          const u = data.data.user;
          setUser(u);
          setIsOnline(data.data.isOnline);
          setPixPass(data.data.pixPass);
          setPixKey(u.pixKey || '');
          setPixKeyType(u.pixKeyType || 'email');
          setAskAiEnabled(u.settings?.askAiEnabled ?? true);
          setAskAiPersona(u.settings?.askAiPersona || 'cyberpunk');
          setPauseWhenOffline(u.settings?.pauseWhenOffline ?? false);
          setMinDonation(((u.settings?.minDonationCents || 100) / 100).toFixed(2));
        }
      })
      .catch(() => {
        // Redireciona para login
        window.location.href = '/login';
      });
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        Carregando painel do criador...
      </div>
    );
  }

  const overlayToken = user.overlayToken;
  const overlayUrl = `${window.location.origin}/overlay/${overlayToken}`;

  const handleCopyOverlay = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTestAlert = async () => {
    setTestSent(true);
    try {
      await fetch(`/api/dashboard/${user.username}/test-alert`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSkipAlert = async () => {
    try {
      await fetch(`/api/dashboard/${user.username}/skip-alert`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('tangpix_token');

    try {
      const res = await fetch('/api/streamer/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pixKey,
          pixKeyType,
          settings: {
            minDonationCents: Math.round(parseFloat(minDonation || '1') * 100),
            askAiEnabled,
            askAiPersona,
            pauseWhenOffline
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tangpix_token');
    if (onLogout) onLogout();
    else window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-brand-500 shadow-lg shadow-brand-500/50 animate-pulse' : 'bg-red-500'}`} />
              <h1 className="text-2xl font-black text-white">Painel do Criador • TangPix</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isOnline ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {isOnline ? 'OBS CONECTADO (ONLINE)' : 'OBS DESCONECTADO (OFFLINE)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Olá, <strong>{user.displayName}</strong> (@{user.username}) — {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Página Pública
            </a>

            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* Card do PixPass (Gamificação / TangiaPass da Comunidade) */}
        {pixPass && (
          <div className="p-6 rounded-2xl glass-panel-glow border border-brand-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-500 to-pix-cyan flex items-center justify-center text-2xl shadow-lg shadow-brand-500/20">
                  {pixPass.currentTier.badge}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pix-cyan uppercase tracking-wider">PixPass Temporada 1</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-brand-400 font-extrabold border border-slate-700">
                      Nível {pixPass.currentLevel}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{pixPass.currentTier.title}</h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Taxa da Plataforma:</div>
                <div className="text-xl font-black text-brand-400">
                  {(5.0 - pixPass.currentTier.platformFeeDiscount).toFixed(1)}% <span className="text-xs text-slate-400 font-normal">(-{pixPass.currentTier.platformFeeDiscount}% desc.)</span>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{pixPass.currentRep} REP Acumulados</span>
                {pixPass.nextTier && (
                  <span>Próximo nível: {pixPass.nextTier.title} ({pixPass.repToNextLevel} REP restantes)</span>
                )}
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-pix-cyan via-brand-500 to-pix-emerald rounded-full transition-all duration-500"
                  style={{ width: `${pixPass.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Vantagens Ativas */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
              {pixPass.currentTier.perks.map((p: string, idx: number) => (
                <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                  <Check className="w-3 h-3 text-brand-400" /> {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Integração com o OBS Studio */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-pix-cyan" /> Seu Link Exclusivo para o OBS Studio
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Adicione no OBS Studio como <strong>Fonte de Navegador (Browser Source)</strong> com resolução <strong>1920x1080</strong>.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendTestAlert}
                disabled={testSent}
                className="px-4 py-2 bg-gradient-to-r from-pix-cyan to-brand-500 hover:opacity-90 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-pix-cyan/20"
              >
                <Play className="w-3.5 h-3.5" /> {testSent ? 'Enviando...' : 'Testar no OBS'}
              </button>

              <button
                onClick={handleSkipAlert}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <SkipForward className="w-3.5 h-3.5" /> Pular Alerta
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={overlayUrl}
              className="flex-1 px-4 py-2.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-xl text-slate-300 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyOverlay}
              className="px-5 py-2.5 bg-pix-cyan text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-pix-cyan/90 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar URL'}
            </button>
          </div>
        </div>

        {/* Configurações do Streamer & Ask AI */}
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl glass-panel space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-pix-cyan" /> Configurações de Recebimento & IA
            </h2>
            {saveSuccess && (
              <span className="text-xs text-brand-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Alterações salvas com sucesso!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chave Pix de Recebimento */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Sua Chave Pix para Recebimento de Doações:
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">Tipo de Chave:</label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pix-cyan"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="phone">Telefone Celular</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">Chave Pix:</label>
                <input
                  type="text"
                  placeholder="Insira sua chave Pix..."
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">Valor Mínimo do Pix (R$):</label>
                <input
                  type="number"
                  step="0.50"
                  min="1.00"
                  value={minDonation}
                  onChange={(e) => setMinDonation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan"
                />
              </div>
            </div>

            {/* Recurso "Ask AI" e Inteligência de Live */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-neon-purple" /> 2. "Ask AI" — Persona de IA na Live:
              </h3>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={askAiEnabled}
                    onChange={(e) => setAskAiEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-pix-cyan bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">
                    Ativar respostas automáticas de IA no Alerta
                  </span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Quando o espectador manda uma mensagem, a IA gera uma resposta ao vivo no estilo da persona escolhida!
                </p>

                {askAiEnabled && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-300 font-medium">Persona da IA:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cyberpunk', name: 'Robô Cyberpunk', desc: 'Gírias futuristas' },
                        { id: 'sensei', name: 'Sensei Místico', desc: 'Conselhos hilários' },
                        { id: 'epic_narrator', name: 'Narrador Épico', desc: 'Pura emoção de e-sports' },
                        { id: 'sarcastic_gamer', name: 'Gamer Zoeiro', desc: 'Zoeira amigável' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAskAiPersona(p.id)}
                          className={`p-2 rounded-lg border text-left text-xs transition ${
                            askAiPersona === p.id
                              ? 'border-pix-cyan bg-pix-cyan/15 text-white font-bold'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detecção de Offline */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pauseWhenOffline}
                    onChange={(e) => setPauseWhenOffline(e.target.checked)}
                    className="w-4 h-4 rounded text-pix-cyan bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">
                    Pausar doações se o OBS estiver offline
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Bloqueia novos alertas enquanto você não estiver com o OBS aberto, evitando doações desperdiçadas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-pix-cyan to-brand-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 hover:opacity-95 transition active:scale-95 shadow-md shadow-pix-cyan/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
