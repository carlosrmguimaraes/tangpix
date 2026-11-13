import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { email, password, displayName, username }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('tangpix_token', data.data.token);
        if (onLoginSuccess) onLoginSuccess();
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (err: any) {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = () => {
    setEmail('carlosr.m.guimaraes@gmail.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header Livepix Style */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Portal Oficial do Streamer
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Tang<span className="text-[#00d182]">Pix</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Crie sua conta e comece a receber Pix com alertas interativos hoje mesmo:'
              : 'Olá! Digite seu e-mail e senha para entrar:'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131722] rounded-2xl border border-[#202636] p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Guimarães"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182] transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome de Usuário (@username)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: carlos"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182] transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-[#202636] rounded-xl text-xs text-white focus:outline-none focus:border-[#00d182] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl livepix-btn-primary flex items-center justify-center gap-2 text-xs font-bold transition shadow-lg disabled:opacity-50"
            >
              {loading ? (
                'Autenticando...'
              ) : (
                <>
                  <span>{isRegister ? 'Criar Minha Conta' : 'Entrar no Painel'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credentials Helper */}
          <div className="pt-2 border-t border-[#202636] flex flex-col gap-2">
            <button
              type="button"
              onClick={fillQuickCredentials}
              className="w-full py-2 px-3 rounded-xl bg-[#171c2b] hover:bg-[#202636] text-[11px] font-semibold text-[#00d182] border border-[#232b3d] flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Preencher Credenciais Rápidas (Carlos)
            </button>

            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-white transition text-center mt-1"
            >
              {isRegister
                ? 'Já possui uma conta? Faça login aqui.'
                : 'Não tem conta? Cadastre-se gratuitamente.'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          TangPix Engine • Plataforma integrada de monetização Pix e gamificação interativa.
        </p>
      </div>
    </div>
  );
};
