import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Play,
  SkipForward,
  RotateCcw,
  Trash2,
  ExternalLink,
  Settings,
  Shield,
  DollarSign,
  Users,
  Radio,
  Sparkles,
  Bot,
  Save,
  LogOut,
  Flame,
  HelpCircle,
  Eye,
  EyeOff,
  Bell,
  Wallet,
  Gift,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Target,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [pixPass, setPixPass] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'wallet' | 'incentives' | 'widgets' | 'pixpass' | 'settings'>('overview');

  // Settings form
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('email');
  const [askAiEnabled, setAskAiEnabled] = useState(true);
  const [askAiPersona, setAskAiPersona] = useState('cyberpunk');
  const [pauseWhenOffline, setPauseWhenOffline] = useState(false);
  const [minDonation, setMinDonation] = useState('1.00');

  // Withdrawal modal / state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

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
        window.location.href = '/login';
      });
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0e14] text-slate-400">
        <div className="w-8 h-8 border-2 border-[#00d182] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Carregando painel do criador Livepix...</p>
      </div>
    );
  }

  const overlayToken = user.overlayToken;
  const overlayUrl = `${window.location.origin}/overlay/${overlayToken}`;
  const publicTipUrl = `${window.location.origin}/${user.username}`;

  const handleCopyOverlay = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPublic = () => {
    navigator.clipboard.writeText(publicTipUrl);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2500);
  };

  const handleSendTestAlert = async () => {
    setTestSent(true);
    try {
      await fetch('/api/donations/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerUsername: user.username,
          donorName: 'Livepix Tester',
          amountCents: 1500,
          message: 'Parabéns pela live! TangPix com UI do Livepix e avatares da Tangia funcionando 100%!',
          ttsVoice: 'default',
          askAi: askAiEnabled
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('tangpix_token');
      const res = await fetch('/api/streamer/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pixKey,
          pixKeyType,
          settings: {
            minDonationCents: Math.round(parseFloat(minDonation) * 100),
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

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {/* Top Bar Livepix Style */}
      <header className="border-b border-[#202636] bg-[#0e121a] px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-tight text-white">
            Tang<span className="text-[#00d182]">Pix</span>
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/20 hidden sm:inline-block">
            Painel do Criador
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* OBS Live Status Badge */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/30">
                <span className="w-2 h-2 rounded-full bg-[#00d182] animate-pulse"></span>
                OBS Conectado
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                OBS Desconectado
              </span>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('tangpix_token');
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171c2b] hover:bg-[#202636] text-xs text-slate-300 hover:text-white border border-[#232b3d] transition"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" /> Sair
          </button>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Left Sidebar (Livepix Structure) */}
        <aside className="w-full md:w-64 border-r border-[#202636] bg-[#0e121a]/60 p-4 flex flex-col gap-5">
          {/* Streamer Profile Box */}
          <div className="flex items-center gap-3 p-3 bg-[#131722] rounded-xl border border-[#202636]">
            <img
              src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos'}
              alt={user.displayName}
              className="w-10 h-10 rounded-full border border-[#00d182] p-0.5 bg-[#171c2b]"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.displayName}</div>
              <div className="text-[11px] text-slate-400 truncate">@{user.username}</div>
            </div>
          </div>

          {/* Saldo Disponível (Livepix Feature) */}
          <div className="p-3.5 bg-[#131722] rounded-xl border border-[#202636] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Saldo disponível</span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-white transition"
              >
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-xl font-black text-white">
              {hideBalance ? 'R$ •••••' : 'R$ 1.284,50'}
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full py-1.5 rounded-lg text-xs font-bold bg-[#00d182] text-[#0b0e14] hover:bg-[#00b872] transition"
            >
              Sacar Dinheiro
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Visão geral
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'alerts'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Bell className="w-4 h-4" /> Alertas & Filas
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'wallet'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Wallet className="w-4 h-4" /> Carteira & Saques
            </button>

            <button
              onClick={() => setActiveTab('incentives')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'incentives'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Gift className="w-4 h-4" /> Incentivos (TTS & 3D)
            </button>

            <button
              onClick={() => setActiveTab('widgets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'widgets'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Radio className="w-4 h-4" /> Widgets (OBS Studio)
            </button>

            <button
              onClick={() => setActiveTab('pixpass')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pixpass'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" /> PixPass (Nível {pixPass?.level || 1})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#171c2b]'
              }`}
            >
              <Settings className="w-4 h-4" /> Configurações
            </button>
          </nav>

          {/* Link Perfil Público Card */}
          <div className="mt-auto p-3.5 bg-[#131722] rounded-xl border border-[#202636] space-y-2">
            <div className="text-[11px] font-semibold text-slate-300">Página de Doação:</div>
            <div className="text-xs text-[#00d182] font-mono truncate">{publicTipUrl}</div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopyPublic}
                className="flex-1 py-1.5 rounded-lg bg-[#171c2b] hover:bg-[#202636] text-white text-[11px] font-semibold flex items-center justify-center gap-1 border border-[#232b3d] transition"
              >
                {copiedPublic ? <Check className="w-3 h-3 text-[#00d182]" /> : <Copy className="w-3 h-3" />}
                {copiedPublic ? 'Copiado!' : 'Copiar'}
              </button>
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-[#171c2b] hover:bg-[#202636] text-slate-300 hover:text-white border border-[#232b3d] transition"
                title="Abrir página pública"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6">
          {/* TAB: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Visão Geral</h2>
                <p className="text-xs text-slate-400">Resumo de desempenho e arrecadação do seu canal.</p>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-[#131722] rounded-2xl border border-[#202636]">
                  <div className="text-xs text-slate-400 font-medium">Arrecadação Total</div>
                  <div className="text-2xl font-black text-white mt-1">R$ 1.284,50</div>
                  <div className="text-[11px] text-[#00d182] font-semibold mt-1">↑ +18% este mês</div>
                </div>

                <div className="p-4 bg-[#131722] rounded-2xl border border-[#202636]">
                  <div className="text-xs text-slate-400 font-medium">Doações Recebidas</div>
                  <div className="text-2xl font-black text-white mt-1">142</div>
                  <div className="text-[11px] text-slate-400 mt-1">Ticket médio: R$ 9,04</div>
                </div>

                <div className="p-4 bg-[#131722] rounded-2xl border border-[#202636]">
                  <div className="text-xs text-slate-400 font-medium">Taxa da Plataforma</div>
                  <div className="text-2xl font-black text-[#00d182] mt-1">
                    {5 - (pixPass?.feeDiscountPercentage || 0)}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Desconto PixPass ativo</div>
                </div>

                <div className="p-4 bg-[#131722] rounded-2xl border border-[#202636]">
                  <div className="text-xs text-slate-400 font-medium">Status do OBS</div>
                  <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                    {isOnline ? (
                      <span className="text-[#00d182] flex items-center gap-1.5 text-base">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00d182] animate-pulse"></span> Conectado
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5 text-base">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Desconectado
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Widget 1080p ativo</div>
                </div>
              </div>

              {/* Quick Actions & Overlay Link */}
              <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#00d182]" /> Link do Widget de Alertas (OBS Studio)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cole como Browser Source (1920x1080) com fundo transparente.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendTestAlert}
                      disabled={testSent}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#00d182]/10 text-[#00d182] hover:bg-[#00d182]/20 border border-[#00d182]/30 flex items-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5" /> {testSent ? 'Disparando...' : 'Testar Alerta no OBS'}
                    </button>
                    <button
                      onClick={handleCopyOverlay}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#00d182] text-[#0b0e14] hover:bg-[#00b872] flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar URL'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#0b0e14] rounded-xl border border-[#202636] text-xs font-mono text-slate-300 truncate select-all">
                  {overlayUrl}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERTAS & FILAS (Livepix Controls) */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Alertas</h2>
                <p className="text-xs text-slate-400">Cuide da reprodução e mantenha as filas da transmissão em ordem.</p>
              </div>

              {/* Fila de Alertas Livepix Card */}
              <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Fila de alertas</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/20">
                      0 itens na fila
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#171c2b] hover:bg-[#202636] text-slate-300 border border-[#202636] transition">
                      Pausar
                    </button>
                    <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#171c2b] hover:bg-[#202636] text-slate-300 border border-[#202636] transition">
                      Pular
                    </button>
                    <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#171c2b] hover:bg-[#202636] text-slate-300 border border-[#202636] transition">
                      Reexibir
                    </button>
                    <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#171c2b] hover:bg-rose-500/20 text-rose-400 border border-[#202636] transition">
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="p-8 text-center text-xs text-slate-500 bg-[#0b0e14] rounded-xl border border-[#1e2536]">
                  Nenhum alerta pendente na fila no momento. As novas doações Pix aparecerão aqui em tempo real.
                </div>
              </div>

              {/* Teste Rápido */}
              <div className="p-4 bg-[#131722] rounded-2xl border border-[#202636] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Enviar Alerta de Teste</div>
                  <div className="text-[11px] text-slate-400">Verifique a animação e o som no seu OBS Studio.</div>
                </div>
                <button
                  onClick={handleSendTestAlert}
                  disabled={testSent}
                  className="px-4 py-2 text-xs font-bold rounded-xl livepix-btn-primary flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Disparar Teste
                </button>
              </div>
            </div>
          )}

          {/* TAB: CARTEIRA (Livepix Withdrawal & Limits) */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Carteira</h2>
                <p className="text-xs text-slate-400">Consulte seus saldos, extratos e transfira para sua conta via Pix.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                  <div className="text-xs text-slate-400">Saldo Disponível para Saque</div>
                  <div className="text-3xl font-black text-white">R$ 1.284,50</div>
                  <p className="text-[11px] text-slate-400">
                    Chave Pix cadastrada: <span className="text-[#00d182] font-mono">{pixKey || user.email}</span>
                  </p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="w-full py-2.5 rounded-xl livepix-btn-primary text-xs font-bold transition"
                  >
                    Solicitar Saque via Pix
                  </button>
                </div>

                <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                  <div className="text-xs text-slate-400">Limites da Conta</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#202636]">
                      <span className="text-slate-400">Limite Diário de Saque</span>
                      <span className="text-white font-semibold">R$ 5.000,00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#202636]">
                      <span className="text-slate-400">Limite Mensal</span>
                      <span className="text-white font-semibold">R$ 50.000,00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Prazo de Compensação</span>
                      <span className="text-[#00d182] font-semibold">Instantâneo (Pix)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extrato Recente */}
              <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                <h3 className="text-sm font-bold text-white">Extrato de Movimentações Recentes</h3>
                <div className="divide-y divide-[#202636] text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Doação Pix - DevTester</div>
                      <div className="text-[11px] text-slate-500">Hoje às 14:46 • Mensagem TTS</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#00d182]">+ R$ 15,00</div>
                      <div className="text-[10px] text-slate-500">Taxa coberta pelo doador</div>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Doação Pix - MarcosGamer</div>
                      <div className="text-[11px] text-slate-500">Hoje às 13:20 • Avatar 3D Tangia</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#00d182]">+ R$ 50,00</div>
                      <div className="text-[10px] text-slate-500">Taxa coberta pelo doador</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WIDGETS (Livepix OBS Widgets Library) */}
          {activeTab === 'widgets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Widgets</h2>
                <p className="text-xs text-slate-400">Personalize, teste e conecte seus widgets no OBS Studio.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Widget Alertas */}
                <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/20">
                      Alertas
                    </span>
                    <Radio className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Alertas do Canal</h3>
                  <p className="text-xs text-slate-400">
                    Notificações de Pix na tela com voz TTS, avatares 3D e memes flutuantes.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={handleCopyOverlay}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#171c2b] hover:bg-[#202636] text-white border border-[#232b3d] transition"
                    >
                      Copiar Link
                    </button>
                    <button
                      onClick={handleSendTestAlert}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00d182]/15 text-[#00d182] hover:bg-[#00d182]/25 border border-[#00d182]/30 transition"
                    >
                      Testar
                    </button>
                  </div>
                </div>

                {/* Widget Meta (Goal Bar) */}
                <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Meta
                    </span>
                    <Target className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Meta da Live</h3>
                  <p className="text-xs text-slate-400">
                    Barra de progresso visual exibindo o progresso da meta para a stream.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>R$ 1.284,50</span>
                      <span>R$ 5.000,00</span>
                    </div>
                    <div className="w-full bg-[#0b0e14] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00d182] h-full rounded-full" style={{ width: '25.6%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Widget QR Code */}
                <div className="p-5 bg-[#131722] rounded-2xl border border-[#202636] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
                      QR Code
                    </span>
                    <QrCode className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">QR Code Fixo em Tela</h3>
                  <p className="text-xs text-slate-400">
                    Exiba o QR Code dinâmico do seu canal diretamente no HUD da transmissão.
                  </p>
                  <button className="w-full py-1.5 rounded-lg text-xs font-semibold bg-[#171c2b] hover:bg-[#202636] text-white border border-[#232b3d] transition">
                    Configurar QR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INCENTIVOS & CONFIGURAÇÕES */}
          {(activeTab === 'incentives' || activeTab === 'settings') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Incentivos & Configurações</h2>
                <p className="text-xs text-slate-400">
                  Defina os valores mínimos aceitos, personas de IA e sua chave Pix de recebimento.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 bg-[#131722] rounded-2xl border border-[#202636] space-y-5">
                {/* Chave Pix */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Chave Pix para Recebimento de Saques:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182]"
                    >
                      <option value="email">E-mail</option>
                      <option value="cpf">CPF</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Sua chave Pix..."
                      className="sm:col-span-2 px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182]"
                    />
                  </div>
                </div>

                {/* Valor Mínimo */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    Valor Mínimo de Doação (R$):
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    value={minDonation}
                    onChange={(e) => setMinDonation(e.target.value)}
                    className="w-full sm:w-48 px-3.5 py-2 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182]"
                  />
                </div>

                {/* Pergunte à IA Persona */}
                <div className="p-4 bg-[#171c2b] rounded-xl border border-[#202636] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00d182]" /> Pergunte à IA nos Alertas
                      </div>
                      <div className="text-[11px] text-slate-400">
                        A IA responde com voz de persona aos comentários enviados na stream.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={askAiEnabled}
                      onChange={(e) => setAskAiEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#00d182] rounded cursor-pointer"
                    />
                  </div>

                  {askAiEnabled && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Persona da IA:
                      </label>
                      <select
                        value={askAiPersona}
                        onChange={(e) => setAskAiPersona(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0b0e14] border border-[#202636] rounded-lg text-xs text-white focus:outline-none focus:border-[#00d182]"
                      >
                        <option value="cyberpunk">Cyberpunk IA (Futurista & High-tech)</option>
                        <option value="sensei">Sensei Místico (Sábio de Artes Marciais)</option>
                        <option value="epic_narrator">Narrador Épico (Trailer de Cinema)</option>
                        <option value="sarcastic_gamer">Gamer Sarcástico (Zoações de Ranked)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Offline Detection Policy */}
                <div className="p-4 bg-[#171c2b] rounded-xl border border-[#202636] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Travar doações se o OBS estiver offline</div>
                    <div className="text-[11px] text-slate-400">
                      Evita que espectadores mandem alertas quando sua live não estiver transmitindo.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pauseWhenOffline}
                    onChange={(e) => setPauseWhenOffline(e.target.checked)}
                    className="w-5 h-5 accent-[#00d182] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl livepix-btn-primary text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  {saveSuccess && (
                    <span className="text-xs text-[#00d182] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB: PIXPASS (Gamification) */}
          {activeTab === 'pixpass' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">PixPass</h2>
                <p className="text-xs text-slate-400">Passe de batalha e gamificação do criador TangPix.</p>
              </div>

              <div className="p-6 bg-[#131722] rounded-2xl border border-[#202636] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#00d182]/20 border border-[#00d182]/40 flex items-center justify-center text-xl">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Nível {pixPass?.level || 1} • {pixPass?.title || 'Iniciante'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {pixPass?.rep || 0} REP acumulados através de doações da comunidade.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#00d182]/15 text-[#00d182] border border-[#00d182]/30">
                    Desconto de {pixPass?.feeDiscountPercentage || 0}% na taxa
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progresso para o Nível {(pixPass?.level || 1) + 1}</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-[#0b0e14] h-3 rounded-full overflow-hidden p-0.5 border border-[#202636]">
                    <div className="bg-[#00d182] h-full rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Saque Pix */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-[#131722] rounded-2xl border border-[#202636] shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Sacar via Pix</h3>
            <p className="text-xs text-slate-400">
              O valor será transferido instantaneamente para sua chave Pix: <br />
              <strong className="text-[#00d182]">{pixKey || user.email}</strong>
            </p>

            {withdrawSuccess ? (
              <div className="p-4 bg-[#00d182]/10 border border-[#00d182]/30 rounded-xl text-center text-xs text-[#00d182] font-semibold">
                ✓ Saque solicitado com sucesso! O valor já foi creditado na sua conta.
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Valor do Saque (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="1284.50"
                    required
                    placeholder="0,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#00d182]"
                  />
                  <span className="text-[10px] text-slate-500">Saldo disponível: R$ 1.284,50</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#171c2b] text-slate-300 hover:text-white border border-[#202636]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold rounded-xl livepix-btn-primary"
                  >
                    Confirmar Saque
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
