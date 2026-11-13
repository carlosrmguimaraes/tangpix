import React, { useState } from 'react';
import { Copy, Check, Play, SkipForward, ExternalLink, Settings, Shield, DollarSign, Users, Radio } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const streamerUsername = 'carlos';
  const overlayToken = 'token_carlos_sec2026';

  const overlayUrl = `${window.location.origin}/overlay/${overlayToken}`;

  const handleCopyOverlay = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTestAlert = async () => {
    setTestSent(true);
    try {
      await fetch(`/api/dashboard/${streamerUsername}/test-alert`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSkipAlert = async () => {
    try {
      await fetch(`/api/dashboard/${streamerUsername}/skip-alert`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-500 animate-pulse" />
              <h1 className="text-2xl font-black text-white">Painel do Criador • TangPix</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live ativa para <strong>@{streamerUsername}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/${streamerUsername}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver Minha Página Pública
            </a>
          </div>
        </div>

        {/* Cards de Métricas Financeiras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Arrecadado Hoje (Pix)</span>
              <DollarSign className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-3xl font-black text-white">R$ 380,00</div>
            <p className="text-[11px] text-brand-400 font-medium">+15 alertas nas últimas 2 horas</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Alertas 3D</span>
              <Radio className="w-4 h-4 text-pix-cyan" />
            </div>
            <div className="text-3xl font-black text-white">24</div>
            <p className="text-[11px] text-slate-400">Tempo de tela acumulado: 4m 12s</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Custo de IA / TTS</span>
              <Shield className="w-4 h-4 text-neon-purple" />
            </div>
            <div className="text-3xl font-black text-emerald-400">R$ 0,00</div>
            <p className="text-[11px] text-slate-400">Motor Edge Neural TTS Ativo (100% Grátis)</p>
          </div>
        </div>

        {/* Bloco de Integração com o OBS Studio */}
        <div className="p-6 rounded-2xl glass-panel-glow space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-pix-cyan" /> Link do Browser Source para o OBS Studio
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Adicione este link como fonte de navegador no OBS Studio (Resolução recomendada: 1920x1080).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendTestAlert}
                disabled={testSent}
                className="px-4 py-2 bg-gradient-to-r from-pix-cyan to-brand-500 hover:opacity-90 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5" /> {testSent ? 'Enviando...' : 'Testar no OBS'}
              </button>

              <button
                onClick={handleSkipAlert}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <SkipForward className="w-3.5 h-3.5" /> Pular Atual
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

        {/* Fila de Doações Recentes */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <h2 className="text-lg font-bold text-white">Doações Recentes</h2>
          <div className="divide-y divide-slate-800/80">
            {[
              { donor: 'GamerBR_99', amount: 'R$ 20,00', type: 'Avatar 3D', msg: 'Joga muito! Esse alerta 3D é sensacional!' },
              { donor: 'LootMaster', amount: 'R$ 10,00', type: 'Meme Vídeo', msg: 'Toma esse Pix pra salvar a live!' },
              { donor: 'Anônimo', amount: 'R$ 5,00', type: 'TTS IA', msg: 'Mandando um salve com a voz da Francisca.' },
            ].map((d, i) => (
              <div key={i} className="py-3.5 flex justify-between items-center text-sm">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {d.donor}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-pix-cyan border border-slate-700">
                      {d.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">"{d.msg}"</p>
                </div>
                <div className="font-extrabold text-brand-400">{d.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
