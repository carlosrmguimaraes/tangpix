import React, { useState } from 'react';
import { Check, Copy, QrCode, X, ArrowLeft, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  txId: string;
  amountCents: number;
  qrCodeSvg?: string;
  pixCopiaECola: string;
  streamerName: string;
  feeCovered?: boolean;
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
  feeCovered = false,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl bg-[#131722] text-slate-100 border border-[#202636] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute p-2 text-slate-400 hover:text-white top-4 right-4 rounded-full hover:bg-[#1a202e] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {paid ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#00d182]/20 text-[#00d182] rounded-full flex items-center justify-center border border-[#00d182]/40 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#00d182]">Pagamento Aprovado! 🎉</h3>
            <p className="text-slate-300 text-sm">
              Seu incentivo já foi registrado e está sendo reproduzido ao vivo na live de <strong>{streamerName}</strong>!
            </p>
            <div className="p-3 bg-[#171c2b] rounded-xl border border-[#202636] text-xs text-slate-400">
              Recibo autenticado via Banco Central do Brasil • TangPix
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Livepix Style */}
            <div className="text-center pb-2 border-b border-[#202636]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-[#00d182]/10 text-[#00d182] border border-[#00d182]/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Pix Instantâneo Seguro
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                R$ {(amountCents / 100).toFixed(2).replace('.', ',')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Apoio direto para <span className="text-white font-medium">{streamerName}</span>
                {feeCovered && <span className="text-[#00d182] ml-1 font-semibold">(taxa coberta por você)</span>}
              </p>
            </div>

            {/* Aviso Livepix */}
            <p className="text-xs text-center text-slate-400">
              Este código Pix é de uso único e tem validade de 24 horas.
            </p>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-lg mx-auto w-fit">
              {qrCodeSvg ? (
                <div
                  className="w-48 h-48 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-900 font-medium text-xs">
                  <QrCode className="w-12 h-12 mb-2 text-slate-700" />
                  Carregando QR Code...
                </div>
              )}
            </div>

            {/* Pix Copia e Cola */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Pix Copia e Cola
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixCopiaECola}
                  className="flex-1 px-3 py-2 text-xs bg-[#0b0e14] border border-[#202636] rounded-xl text-slate-300 font-mono focus:outline-none focus:border-[#00d182] truncate select-all"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                    copied
                      ? 'bg-[#00d182] text-[#0b0e14]'
                      : 'bg-[#1e2535] hover:bg-[#252e42] text-white border border-[#2d374d]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar código
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Livepix */}
            <div className="flex items-center justify-between text-xs text-slate-400 bg-[#0b0e14] p-3 rounded-xl border border-[#1a202c]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d182] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d182]"></span>
                </span>
                <span>Aguardando pagamento...</span>
              </div>
              <span className="text-[11px] text-slate-500">Recibo em tela</span>
            </div>

            {/* Ações: Voltar + Botão de Teste */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2 py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>

              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#00d182]/10 text-[#00d182] hover:bg-[#00d182]/20 border border-[#00d182]/30 flex items-center gap-1.5 transition"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Simular Pagamento Teste
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
