'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  Loader2,
  QrCode,
  RefreshCw,
  LogOut,
  Bot,
  AlertCircle,
} from 'lucide-react';

export default function BotWhatsAppSetupPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'scanning' | 'connected'
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [assignedNumber, setAssignedNumber] = useState('');
  const [botName, setBotName] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Poll for QR Code & Connection Status every 3 seconds
  const fetchStatusAndQr = async () => {
  try {
    const res = await fetch(
      `/api/whatsapp/status?botId=${encodeURIComponent(botId)}`
    );
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) {
      console.warn('WhatsApp status not JSON', res.status);
      return;
    }
    const data = await res.json();
    if (data.success) {
      setConnectionStatus(data.status);
      if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
      if (data.whatsappNumber) setAssignedNumber(data.whatsappNumber);
    }
  } catch (err) {
    console.error('Error fetching WhatsApp status:', err.message);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchStatusAndQr();
    const interval = setInterval(fetchStatusAndQr, 3000); // Auto-refresh status
    return () => clearInterval(interval);
  }, [botId]);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp line?')) return;
    setIsDisconnecting(true);
    try {
      await fetch(`/api/whatsapp/status?botId=${encodeURIComponent(botId)}`, {
  method: 'DELETE',
});
      setConnectionStatus('disconnected');
      setQrDataUrl(null);
      setAssignedNumber('');
      fetchStatusAndQr();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#0080FF]" />
        Loading live WhatsApp QR scanner...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/bots/${botId}`}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Connect WhatsApp Line</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan the QR code with WhatsApp on your phone to link your bot instantly.
            </p>
          </div>
        </div>

        {connectionStatus === 'connected' && (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Disconnect Line
          </button>
        )}
      </div>

      {/* STATE 1: CONNECTED */}
      {connectionStatus === 'connected' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-950">WhatsApp Connected & Active</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-0.5 font-mono">
                  Linked Number: {assignedNumber || 'Connected'}
                </p>
              </div>
            </div>

            <Link
              href={`/bots/${botId}/test`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Bot className="w-4 h-4 text-[#0080FF]" />
              Test Simulator
            </Link>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">Your bot is responding to customer messages!</p>
            Any customer message sent to <strong>{assignedNumber}</strong> on WhatsApp will be automatically processed and answered by AI in real-time.
          </div>
        </div>
      )}

      {/* STATE 2: SCANNING / DISCONNECTED (SHOW REAL LIVE QR CODE) */}
      {connectionStatus !== 'connected' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
          
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Scan QR Code with WhatsApp</h2>
            <p className="text-xs text-slate-500">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device. Point your camera at this screen.
            </p>
          </div>

          {/* REAL LIVE QR CODE DISPLAY */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-64 h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-center relative">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Real WhatsApp Web Pairing QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0080FF]" />
                  <span className="text-xs font-medium">Generating Live WhatsApp QR...</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0080FF]" />
              <span>QR code refreshes automatically every few seconds</span>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#0080FF]" /> How to connect on your phone:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
              <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
              <li>Tap <strong>Settings</strong> (iPhone) or <strong>Menu ⋮</strong> (Android).</li>
              <li>Tap <strong>Linked Devices</strong>, then tap <strong>Link a Device</strong>.</li>
              <li>Scan the QR code shown above.</li>
            </ol>
          </div>

        </div>
      )}
    </div>
  );
}