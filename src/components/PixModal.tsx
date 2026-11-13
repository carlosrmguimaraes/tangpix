import React, { useState } from 'react';
import { Check, Copy, QrCode, Sparkles, X, AlertCircle } from 'lucide-react';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  txId: string;
  amountCents: number;
  qrCodeSvg?: string;
  pixCopiaECola: string;
  streamerName: string;
  onPaymentSuccess?: () => void;
}

export const PixModal: React.FC<PixModalProps> = ({
  isOpen,
  onClose,
  txId,
  amountCents,
  qrCodeSvg,
  pixCopiaECola,
  streamerName,
  onPaymentSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [paid, setPaid] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/donations/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId })
      });
      const data = await res.json();
      if (data.success) {
        setPaid(true);
        if (onPaymentSuccess) onPaymentSuccess();
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel-glow text-slate-100 border border-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute p-2 text-slate-400 hover:text-white top-4 right-4 rounded-full hover:bg-slate-800/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {paid ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center border border-brand-500/30 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-brand-400">Pix Confirmado! 🎉</h3>
            <p className="text-slate-300">
              Seu alerta interativo já está tocando ao vivo na live de <strong>{streamerName}</strong>!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-pix-cyan/10 text-pix-cyan border border-pix-cyan/20">
                <QrCode className="w-3.5 h-3.5" /> Pagamento Instantâneo via Pix
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                R$ {(amountCents / 100).toFixed(2).replace('.', ',')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Escaneie o QR Code ou use a chave Copia e Cola</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner">
              {qrCodeSvg ? (
                <div
                  className="w-48 h-48 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-900 font-bold">
                  Gerando QR Code...
                </div>
              )}
            </div>

            {/* Copia e Cola */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Código Pix Copia e Cola</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixCopiaECola}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900/90 border border-slate-700 rounded-lg text-slate-300 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-xs font-semibold text-black bg-pix-cyan hover:bg-pix-cyan/90 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-pix-cyan/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Botão de Teste / Demonstração Instantânea */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {isSimulating ? 'Confirmando no Banco...' : '⚡ Simular Pagamento Instantâneo (Modo Teste)'}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Em produção com Efí/Asaas o webhook confirma sozinho em &lt; 1s.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
