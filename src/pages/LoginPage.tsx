import React, { useState } from 'react';
import { Sparkles, Lock, Mail, User, ShieldCheck, ArrowRight, Bot } from 'lucide-react';

export const LoginPage: React.FC<{ onLoginSuccess: (user: any) => void }> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('carlosr.m.guimaraes@gmail.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, username, displayName }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('tangpix_token', data.data.token);
        onLoginSuccess(data.data.user);
      } else {
        setError(data.error || 'Falha ao autenticar.');
      }
    } catch (err: any) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pix-cyan to-brand-500 shadow-xl shadow-pix-cyan/20">
            <Bot className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Tang<span className="text-pix-cyan">Pix</span>
          </h1>
          <p className="text-xs text-slate-400">
            A plataforma de monetização Pix e alertas gamificados 3D para streamers.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="p-8 rounded-2xl glass-panel-glow border border-slate-800 shadow-2xl space-y-6">
          {/* Alternador Login / Cadastro */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                !isRegister ? 'bg-pix-cyan text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                isRegister ? 'bg-pix-cyan text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nome do Canal / Usuário:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ex: seunome"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nome de Exibição:
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Carlos Gamer"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                E-mail do Streamer:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Senha de Acesso:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pix-cyan"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pix-cyan to-brand-500 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition active:scale-95 shadow-lg shadow-pix-cyan/20"
            >
              {loading ? 'Entrando...' : isRegister ? 'Criar Minha Conta & Começar' : 'Acessar Meu Painel'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Login Helper */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('carlosr.m.guimaraes@gmail.com');
                setPassword('password123');
              }}
              className="text-[11px] text-pix-cyan hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Preencher credenciais padrão (carlosr.m.guimaraes@gmail.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
