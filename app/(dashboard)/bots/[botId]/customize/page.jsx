'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Bot,
  ArrowLeft,
  Save,
  Sliders,
  Sparkles,
  Cpu,
  Shield,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { AI_MODELS } from '@/config/providers';

export default function CustomizeBotPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Fancy Assistant',
    businessName: 'Fancy Digitals',
    industry: 'business',
    personality: 'professional',
    language: 'en',
    whatsappNumber: '+2348000000000',
    phoneNumberId: '',
    primaryProvider: 'groq',
    primaryModel: 'llama-3.1-8b-instant',
    fallbackProvider: 'gemini',
    fallbackModel: 'gemini-2.0-flash',
    temperature: '0.3',
    welcomeMessage: 'Welcome to Fancy Digitals! 🚀 How can I assist you with our AI automation, web development, or custom software services today?',
    fallbackMessage: "I'll connect you with a senior tech consultant at Fancy Digitals right away.",
    objectives: ['Assist clients with digital agency inquiries', 'Schedule discovery calls'],
    rules: ['Be articulate, tech-savvy, and highly professional'],
    restrictions: ['Do not quote binding prices without a formal scope document'],
    handoffKeywords: ['human', 'agent', 'support', 'manager', 'speak to consultant'],
  });

  const [newObjective, setNewObjective] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newRestriction, setNewRestriction] = useState('');

  useEffect(() => {
    async function loadBot() {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setFormData((prev) => ({ 
            ...prev, 
            ...data.data,
            // Fallback to existing phone number if available
            whatsappNumber: data.data.whatsappNumber || data.data.phoneNumber || prev.whatsappNumber
          }));
        }
      } catch (err) {
        console.error('Failed to load bot:', err);
      }
    }
    loadBot();
  }, [botId]);

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(result.error || 'Failed to update bot');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating bot settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field, value, setter) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
    setter('');
  };

  const removeItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Helper for direct WhatsApp test link
  const cleanPhone = (formData.whatsappNumber || '').replace(/[^0-9]/g, '');
  const testChatUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello! Testing the bot.')}`
    : '#';

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-1 sm:px-0">
      
      {/* ---------- TOP BAR ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/bots"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              Customize — {formData.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune AI behavior, phone numbers, conversation rules, and provider choices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Changes Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* ---------- RESPONSIVE TABS ---------- */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'general'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Personality & Messages
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'whatsapp'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          WhatsApp Line & Number
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Gateway & Models
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Rules & Safety Directives
        </button>
      </div>

      {/* ========================================================= */}
      {/*         TAB 1: GENERAL PERSONALITY & MESSAGES             */}
      {/* ========================================================= */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bot Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Personality Tone</label>
              <select
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {BRAND.personalities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {BRAND.languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Welcome Message</label>
            <textarea
              rows={3}
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Human Handoff Fallback Message</label>
            <textarea
              rows={2}
              value={formData.fallbackMessage}
              onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*         TAB 2: WHATSAPP LINE & PHONE NUMBER               */}
      {/* ========================================================= */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Connected WhatsApp Line
            </h2>
            <p className="text-xs text-slate-500">
              Specify the exact WhatsApp phone number your customers use to contact this bot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                WhatsApp Phone Number (with Country Code)
              </label>
              <input
                type="text"
                placeholder="e.g. +234 812 345 6789"
                value={formData.whatsappNumber || ''}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Include country code without special characters (e.g. +234, +1, +44).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Meta Phone Number ID (Optional / Auto-Managed)
              </label>
              <input
                type="text"
                placeholder="e.g. 109283746592812"
                value={formData.phoneNumberId || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Managed automatically when using 1-Click Embedded signup.
              </p>
            </div>
          </div>

          {/* Test Link Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800">Direct WhatsApp Chat URL:</span>
              <p className="text-xs font-mono text-emerald-700 truncate mt-0.5">
                {cleanPhone ? `https://wa.me/${cleanPhone}` : 'Please enter a phone number above'}
              </p>
            </div>

            {cleanPhone ? (
              <a
                href={testChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Test Chat on WhatsApp
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href={`/bots/${botId}/whatsapp`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Open Full QR Code & Setup Page &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*         TAB 3: AI GATEWAY & MODELS                        */}
      {/* ========================================================= */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1">
            <p className="font-bold text-emerald-400">Multi-Provider AI Gateway Active</p>
            <p className="text-slate-300">
              The engine automatically tries your Primary Provider first. If rate-limited or unavailable, it seamlessly fails over to your Fallback Provider.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Primary Provider</h3>
              <select
                value={formData.primaryProvider}
                onChange={(e) => setFormData({ ...formData, primaryProvider: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
              >
                <option value="groq">Groq (Ultra-Fast Llama)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter (Multi-Model)</option>
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Fallback Provider</h3>
              <select
                value={formData.fallbackProvider}
                onChange={(e) => setFormData({ ...formData, fallbackProvider: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temperature (Creativity: {formData.temperature})
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>0.0 (Precise & Factual)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/*         TAB 4: RULES & DIRECTIVES                         */}
      {/* ========================================================= */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          {/* Objectives */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">Bot Objectives</h3>
            <div className="space-y-2 mb-3">
              {(formData.objectives || []).map((obj, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span>{obj}</span>
                  <button onClick={() => removeItem('objectives', i)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new objective..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => addItem('objectives', newObjective, setNewObjective)}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Rules */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">Conversation Guidelines</h3>
            <div className="space-y-2 mb-3">
              {(formData.rules || []).map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span>{rule}</span>
                  <button onClick={() => removeItem('rules', i)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add conversation rule..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => addItem('rules', newRule, setNewRule)}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}