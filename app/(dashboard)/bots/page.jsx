'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Plus,
  Sparkles,
  MessageSquare,
  Settings,
  BookOpen,
  QrCode,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export default function BotsListPage() {
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await fetch('/api/bots');
        const data = await res.json();
        if (data.success && data.data) {
          setBots(data.data);
        }
      } catch (err) {
        console.error('Failed to load bots:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBots();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your AI Bots</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, tune, and connect your WhatsApp AI employees.</p>
        </div>

        <Link
          href="/bots/create"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New AI Bot
        </Link>
      </div>

      {/* Bots Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading your workspace bots...</div>
      ) : bots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your first AI employee is waiting</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Build an intelligent agent in under 3 minutes to answer inquiries and process sales on WhatsApp.
          </p>
          <Link
            href="/bots/create"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Create Your First Bot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bots.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900 text-base">{b.name}</h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase">
                          {b.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{b.businessName}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-4 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{b.welcomeMessage}"
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase font-mono text-[10px]">
                    {b.primaryProvider}
                  </span>
                  <span>&bull; Tone: <strong className="capitalize text-slate-800">{b.personality}</strong></span>
                  <span>&bull; Lang: <strong className="uppercase text-slate-800">{b.language}</strong></span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  href={`/bots/${b.id}/test`}
                  className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold text-center border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Test Bot
                </Link>

                <Link
                  href={`/bots/${b.id}/customize`}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize
                </Link>

                <Link
                  href={`/bots/${b.id}/knowledge`}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Knowledge
                </Link>

                <Link
                  href={`/bots/${b.id}/whatsapp`}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  WhatsApp
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}