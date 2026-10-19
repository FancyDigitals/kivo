'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Bot,
  ArrowLeft,
  MessageSquare,
  Sliders,
  BookOpen,
  QrCode,
  BarChart3,
  Zap,
  Settings,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function BotPage() {
  const params = useParams();
  const botId = params?.botId;

  const [bot, setBot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!botId) return;

    async function loadBot() {
      try {
        setIsLoading(true);
        setError('');

        const res = await fetch('/api/bots', {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error || 'Failed to load bots.'
          );
        }

        const foundBot = data.data?.find(
          (item) => item.id === botId
        );

        if (!foundBot) {
          throw new Error('Bot not found.');
        }

        setBot(foundBot);
      } catch (err) {
        console.error('Failed to load bot:', err);
        setError(
          err?.message || 'Failed to load this bot.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadBot();
  }, [botId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading bot...
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h1 className="text-lg font-bold text-slate-900">
            Unable to load bot
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || 'This bot could not be found.'}
          </p>

          <Link
            href="/bots"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to bots
          </Link>
        </div>
      </div>
    );
  }

  const actions = [
    {
      title: 'Test Bot',
      description: 'Chat with your AI employee and test responses.',
      href: `/bots/${bot.id}/test`,
      icon: MessageSquare,
      primary: true,
    },
    {
      title: 'Customize',
      description: 'Configure personality, behavior and AI settings.',
      href: `/bots/${bot.id}/customize`,
      icon: Sliders,
    },
    {
      title: 'Knowledge',
      description: 'Manage the information your AI employee knows.',
      href: `/bots/${bot.id}/knowledge`,
      icon: BookOpen,
    },
    {
      title: 'WhatsApp',
      description: 'Connect and manage your WhatsApp AI employee.',
      href: `/bots/${bot.id}/whatsapp`,
      icon: QrCode,
      dark: true,
    },
    {
      title: 'Analytics',
      description: 'Review conversations and bot performance.',
      href: `/bots/${bot.id}/analytics`,
      icon: BarChart3,
    },
    {
      title: 'Automations',
      description: 'Create automated workflows for your bot.',
      href: `/bots/${bot.id}/automations`,
      icon: Zap,
    },
    {
      title: 'Settings',
      description: 'Manage configuration and bot preferences.',
      href: `/bots/${bot.id}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Back */}
      <Link
        href="/bots"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to bots
      </Link>

      {/* Hero */}
      <section className="rounded-3xl bg-slate-900 text-white overflow-hidden">
        <div className="p-7 sm:p-9">

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-7">

            <div className="flex items-start gap-4">

              <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0">
                <Bot className="w-8 h-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {bot.name}
                  </h1>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wide">
                    {bot.status || 'Active'}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-slate-400">
                  {bot.businessName}
                </p>

                {bot.description && (
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                    {bot.description}
                  </p>
                )}
              </div>

            </div>

            <Link
              href={`/bots/${bot.id}/test`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold transition shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              Test Bot
            </Link>

          </div>

          {/* Bot metadata */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-5">

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {bot.primaryProvider || 'Not configured'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Model
              </p>
              <p className="mt-1 text-sm font-semibold text-white break-all">
                {bot.primaryModel || 'Not configured'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Personality
              </p>
              <p className="mt-1 text-sm font-semibold text-white capitalize">
                {bot.personality || 'Professional'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Language
              </p>
              <p className="mt-1 text-sm font-semibold text-white uppercase">
                {bot.language || 'EN'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Welcome message */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Bot Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage everything related to this AI employee.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Welcome Message
          </p>

          <p className="mt-3 text-sm leading-7 text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-4">
            {bot.welcomeMessage || 'No welcome message configured.'}
          </p>

        </div>
      </section>

      {/* Management */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Manage Your Bot
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure, test and connect your AI employee.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">

                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      action.primary
                        ? 'bg-emerald-50 text-emerald-600'
                        : action.dark
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />

                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-900">
                  {action.title}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  {action.description}
                </p>
              </Link>
            );
          })}

        </div>
      </section>

    </div>
  );
}
