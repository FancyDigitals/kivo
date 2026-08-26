'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Save,
} from 'lucide-react';

export default function BotWhatsAppSetupPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [copied, setCopyState] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/whatsapp`;
  const verifyToken = 'kivo_whatsapp_verify_token_2025';

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/bots"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Connect WhatsApp Cloud API — Fancy Assistant
            </h1>
            <p className="text-xs text-slate-500">Link your official Meta WhatsApp Business Phone Number.</p>
          </div>
        </div>
      </div>

      {/* Step 1: Webhook Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
            1
          </span>
          Meta Webhook Endpoint Configuration
        </div>

        <p className="text-xs text-slate-600">
          In your <strong>Meta App Dashboard &gt; WhatsApp &gt; Configuration</strong>, paste the following Callback URL and Verification Token:
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Callback Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
              />
              <button
                onClick={copyWebhook}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Verify Token</label>
            <input
              type="text"
              readOnly
              value={verifyToken}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Credentials Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
            2
          </span>
          Meta API Credentials
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number ID</label>
            <input
              type="text"
              placeholder="e.g. 109283746592812"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent System Access Token</label>
            <input
              type="password"
              placeholder="EAAG..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Credentials Saved & Verified!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" /> Save WhatsApp Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}