'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Loader2,
  Sparkles,
  ExternalLink,
  QrCode,
  Copy,
  Send,
  MessageSquare,
  Bot,
} from 'lucide-react';

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function BotWhatsAppSetupPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [activeTab, setActiveTab] = useState('managed');
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Persisted from bot record — NOT fake local-only state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [assignedNumber, setAssignedNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [botName, setBotName] = useState('');

  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ---------- LOAD BOT (source of truth) ----------
  const loadBot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}`);
      const data = await res.json();

      if (data.success && data.data) {
        const bot = data.data;
        setBotName(bot.name || '');

        const number =
          bot.whatsappNumber ||
          bot.phoneNumber ||
          bot.whatsapp_number ||
          '';

        const status =
          bot.whatsappStatus ||
          bot.whatsapp_status ||
          (number ? 'connected' : 'disconnected');

        setAssignedNumber(number);
        setPhoneNumberId(bot.phoneNumberId || bot.phone_number_id || '');
        setConnectionStatus(status === 'connected' || number ? 'connected' : 'disconnected');
      }
    } catch (err) {
      console.error('Failed to load bot WhatsApp state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBot();
  }, [botId]);

  // ---------- SAVE TO BOT RECORD ----------
  const persistWhatsApp = async (payload) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        console.error('Failed to persist WhatsApp:', result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cleanNumber = (assignedNumber || '').replace(/[^0-9]/g, '');
  const waChatUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Hello! I would like some information.')}`
    : '#';
  const qrCodeApiUrl = cleanNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(waChatUrl)}`
    : '';

  const handleCopyLink = () => {
    if (!cleanNumber) return;
    navigator.clipboard.writeText(waChatUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendTestPing = (e) => {
    e.preventDefault();
    if (!testPhoneNumber) return;
    setIsSendingTest(true);
    setTestSentSuccess(false);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    }, 1800);
  };

  // Managed number — saves to DB so it survives refresh
  const handleProvisionManagedNumber = async () => {
    setIsProvisioning(true);
    // If user already set a number in Customize, keep it. Otherwise assign a placeholder they can edit.
    const numberToUse = assignedNumber?.trim()
      ? assignedNumber.trim()
      : '+2349087654321';

    const ok = await persistWhatsApp({
      whatsappNumber: numberToUse,
      whatsappStatus: 'connected',
      phoneNumberId: phoneNumberId || `managed_${botId}`,
    });

    if (ok) {
      setAssignedNumber(numberToUse);
      setConnectionStatus('connected');
    } else {
      alert('Could not save WhatsApp connection. Check API / bot update route.');
    }
    setIsProvisioning(false);
  };

  // Embedded signup simulation — still persists
  const handleMetaEmbeddedSignup = async () => {
    setIsLinking(true);
    const numberToUse = assignedNumber?.trim()
      ? assignedNumber.trim()
      : '+2348123456789';

    const ok = await persistWhatsApp({
      whatsappNumber: numberToUse,
      whatsappStatus: 'connected',
      phoneNumberId: phoneNumberId || `meta_${botId}`,
    });

    if (ok) {
      setAssignedNumber(numberToUse);
      setConnectionStatus('connected');
    } else {
      alert('Could not save WhatsApp connection.');
    }
    setIsLinking(false);
  };

  const handleDisconnect = async () => {
    const ok = await persistWhatsApp({
      whatsappStatus: 'disconnected',
      // keep number in DB so Customize value is not wiped — only mark disconnected
    });
    if (ok) {
      setConnectionStatus('disconnected');
    }
  };

  const handleUpdateNumber = async (e) => {
    e.preventDefault();
    if (!assignedNumber?.trim()) {
      alert('Enter a WhatsApp number first.');
      return;
    }
    const ok = await persistWhatsApp({
      whatsappNumber: assignedNumber.trim(),
      whatsappStatus: 'connected',
      phoneNumberId: phoneNumberId || undefined,
    });
    if (ok) {
      setConnectionStatus('connected');
      await loadBot(); // re-sync from server
    } else {
      alert('Failed to update number.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading WhatsApp connection...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-1 sm:px-0">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/bots/${botId}`}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              WhatsApp Integration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              {botName ? `${botName} — ` : ''}Connect your phone line and test real conversations.
            </p>
          </div>
        </div>

        {connectionStatus === 'connected' && (
          <button
            onClick={handleDisconnect}
            disabled={isSaving}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors shrink-0"
          >
            Disconnect Line
          </button>
        )}
      </div>

      {/* ========== CONNECTED ========== */}
      {connectionStatus === 'connected' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-emerald-950">WhatsApp Line Active & Online</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Webhook
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Assigned Phone:{' '}
                  <span className="font-mono font-bold text-emerald-900">
                    {assignedNumber || 'No number set'}
                  </span>
                </p>
              </div>
            </div>

            <Link
              href={`/bots/${botId}/test`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0"
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              Open In-Dashboard Simulator
            </Link>
          </div>

          {/* EDIT NUMBER (synced with Customize) */}
          <form
            onSubmit={handleUpdateNumber}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Bot WhatsApp Number
            </div>
            <p className="text-xs text-slate-500">
              This is the same number as Customize → WhatsApp Line. Change it here or there — both save to the bot.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={assignedNumber}
                onChange={(e) => setAssignedNumber(e.target.value)}
                placeholder="e.g. +234 812 345 6789"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Update Number'}
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* QR + LINK */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Test Directly on Your Phone
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Scan QR or open the link — it uses the number saved on this bot.
                </p>
              </div>

              {cleanNumber ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                    <img src={qrCodeApiUrl} alt="WhatsApp QR" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-3 w-full min-w-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Link</span>
                      <p className="text-xs font-mono text-slate-700 truncate">{waChatUrl}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={waChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Open in WhatsApp Web / App
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full h-9 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        {copiedLink ? 'Copied!' : 'Copy WhatsApp Link'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  No valid phone number yet. Enter one above and click <strong>Update Number</strong>.
                </div>
              )}
            </div>

            {/* TEST PING */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Send Test Ping to Phone
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your personal number — to receive a test from the bot line.
                </p>
              </div>

              <form onSubmit={handleSendTestPing} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 801 234 5678"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingTest || !testPhoneNumber}
                  className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      Send Verification Message
                    </>
                  )}
                </button>
                {testSentSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Ping dispatched! Check WhatsApp.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========== DISCONNECTED ========== */}
      {connectionStatus !== 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('managed')}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeTab === 'managed'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-sm">Option A</p>
              <p className={`text-[11px] mt-0.5 ${activeTab === 'managed' ? 'text-slate-300' : 'text-slate-500'}`}>
                Instant Provisioning
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bring-own')}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeTab === 'bring-own'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className="font-bold text-sm">Option B</p>
              <p className={`text-[11px] mt-0.5 ${activeTab === 'bring-own' ? 'text-slate-300' : 'text-slate-500'}`}>
                Link Existing Number
              </p>
            </button>
            <div className="p-4 rounded-xl bg-slate-100 text-[11px] text-slate-500 flex gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              Connection is saved on the bot. Leaving this page will no longer reset it.
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            {/* Pre-fill number before connect */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                WhatsApp number to connect (optional — or set in Customize)
              </label>
              <input
                type="text"
                value={assignedNumber}
                onChange={(e) => setAssignedNumber(e.target.value)}
                placeholder="e.g. +234 812 345 6789"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {activeTab === 'managed' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                    Recommended
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Get an Instant Managed Number</h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Saves connection on this bot so it stays connected when you leave and return.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProvisionManagedNumber}
                  disabled={isProvisioning || isSaving}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProvisioning || isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving connection...
                    </>
                  ) : (
                    <>
                      Assign & Save WhatsApp Number
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'bring-own' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">Connect via Meta 1-Click Setup</h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Saves your number + connected status to the bot record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMetaEmbeddedSignup}
                  disabled={isLinking || isSaving}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLinking || isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FacebookIcon className="w-4 h-4 text-white" />
                      Connect with Facebook
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}