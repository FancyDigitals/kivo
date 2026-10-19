'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Plus,
  Sparkles,
  MessageSquare,
  BookOpen,
  QrCode,
  Sliders,
  ArrowRight,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

export default function BotsListPage() {
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBot, setDeleteBot] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await fetch('/api/bots', {
          cache: 'no-store',
        });

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

  const handleDelete = async () => {
    if (!deleteBot || isDeleting) return;

    setIsDeleting(true);

    try {
      const res = await fetch('/api/bots', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deleteBot.id,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.error || 'Failed to delete bot.'
        );
      }

      setBots((prev) =>
        prev.filter((bot) => bot.id !== deleteBot.id)
      );

      setDeleteBot(null);
    } catch (err) {
      console.error('Failed to delete bot:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete bot. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Your AI Bots
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-5">
              Manage, tune, and connect your WhatsApp AI employees.
            </p>
          </div>

          <Link
            href="/bots/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New AI Bot
          </Link>

        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 sm:p-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5" />
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Loading your workspace bots...
            </p>
          </div>

        ) : bots.length === 0 ? (

          /* Empty State */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-7 sm:p-12 text-center">

            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto">
              <Bot className="w-7 h-7" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Your first AI employee is waiting
            </h3>

            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-6">
              Build an intelligent agent to answer inquiries and process sales on WhatsApp.
            </p>

            <Link
              href="/bots/create"
              className="mt-6 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Create Your First Bot
            </Link>

          </div>

        ) : (

          /* Bots */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {bots.map((b) => (

              <div
                key={b.id}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden"
              >

                {/* Entire card link */}
                <Link
                  href={`/bots/${b.id}`}
                  aria-label={`Open ${b.name}`}
                  className="absolute inset-0 z-0"
                />

                <div className="relative z-10 p-4 sm:p-6 pointer-events-none">

                  {/* Bot Header */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h2 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-[190px] sm:max-w-none">
                            {b.name}
                          </h2>

                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold border border-emerald-200 uppercase">
                            {b.status || 'Active'}
                          </span>

                        </div>

                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px] sm:max-w-none">
                          {b.businessName}
                        </p>

                      </div>

                    </div>

                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />

                  </div>

                  {/* Welcome Message */}
                  <p className="text-xs text-slate-600 mt-4 line-clamp-3 leading-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{b.welcomeMessage || 'No welcome message configured.'}"
                  </p>

                  {/* Metadata */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">

                    {b.primaryProvider && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase font-mono text-[9px] sm:text-[10px]">
                        {b.primaryProvider}
                      </span>
                    )}

                    {b.personality && (
                      <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                        Tone:{' '}
                        <strong className="capitalize text-slate-800">
                          {b.personality}
                        </strong>
                      </span>
                    )}

                    {b.language && (
                      <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                        Lang:{' '}
                        <strong className="uppercase text-slate-800">
                          {b.language}
                        </strong>
                      </span>
                    )}

                  </div>

                  {/* Actions */}
                  <div
                    className="relative pointer-events-auto mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2"
                  >

                    <Link
                      href={`/bots/${b.id}/test`}
                      className="min-h-10 px-2 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-[11px] sm:text-xs font-semibold text-center border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Test</span>
                    </Link>

                    <Link
                      href={`/bots/${b.id}/customize`}
                      className="min-h-10 px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[11px] sm:text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 shrink-0" />
                      <span>Customize</span>
                    </Link>

                    <Link
                      href={`/bots/${b.id}/knowledge`}
                      className="min-h-10 px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[11px] sm:text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Knowledge</span>
                    </Link>

                    <Link
                      href={`/bots/${b.id}/whatsapp`}
                      className="min-h-10 px-2 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white text-[11px] sm:text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDeleteBot(b)}
                      className="min-h-10 px-2 py-2 rounded-lg bg-slate-50 hover:bg-red-50 active:bg-red-100 text-slate-500 hover:text-red-600 text-[11px] sm:text-xs font-semibold text-center border border-slate-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete</span>
                    </button>

                  </div>

                </div>
              </div>

            ))}

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteBot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeleteBot(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-bot-title"
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6"
          >

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>

                <h2
                  id="delete-bot-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  Delete this bot?
                </h2>

                <p className="mt-1.5 text-sm text-slate-500 leading-6">
                  You're about to permanently delete{' '}
                  <strong className="text-slate-800">
                    {deleteBot.name}
                  </strong>
                  . This action cannot be undone.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setDeleteBot(null)}
                disabled={isDeleting}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

              <button
                type="button"
                onClick={() => setDeleteBot(null)}
                disabled={isDeleting}
                className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Bot
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}