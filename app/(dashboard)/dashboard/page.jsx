'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  MessageSquare,
  UserCheck,
  Plus,
  Cpu,
  Sparkles,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [bots, setBots] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
    activeBotsCount: 0,
    totalConversations: 0,
  });
  const [leadsCount, setLeadsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [botsRes, analyticsRes, leadsRes] = await Promise.all([
          fetch('/api/bots'),
          fetch('/api/analytics'),
          fetch('/api/leads'),
        ]);

        const botsData = await botsRes.json();
        const analyticsData = await analyticsRes.json();
        const leadsData = await leadsRes.json();

        if (botsData.success && botsData.data) {
          setBots(botsData.data);
        }
        if (analyticsData.success && analyticsData.data) {
          setMetrics(analyticsData.data);
        }
        if (leadsData.success && leadsData.data) {
          setLeadsCount(leadsData.data.length);
        }
      } catch (err) {
        console.error('Failed to load dashboard overview data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 px-1 sm:px-0">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workspace Overview
          </h1>
          <p className="text-[13px] sm:text-sm text-slate-500 mt-1 leading-snug">
            Real-time status of your active WhatsApp AI bots and customer inquiries.
          </p>
        </div>

        <Link
          href="/bots/create"
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold px-4 py-3 sm:py-2.5 rounded-xl shadow-sm transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create AI Bot
        </Link>
      </div>

      {/* ---------- METRIC CARDS ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Active AI Agents */}
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-2 text-slate-500 text-[11px] sm:text-xs font-medium">
            <span className="leading-tight">Active AI Agents</span>
            <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3">
            {bots.length}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium leading-tight">
            <span className="text-emerald-600 font-semibold">
              {bots.filter((b) => b.status === 'active').length} Deployed
            </span>{' '}
            on WhatsApp
          </p>
        </div>

        {/* Customer Conversations */}
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-2 text-slate-500 text-[11px] sm:text-xs font-medium">
            <span className="leading-tight">Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3">
            {metrics.totalConversations}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium leading-tight">
            Active WhatsApp Threads
          </p>
        </div>

        {/* Leads */}
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-2 text-slate-500 text-[11px] sm:text-xs font-medium">
            <span className="leading-tight">Leads Qualified</span>
            <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3">
            {leadsCount}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium leading-tight">
            Automated Pipeline
          </p>
        </div>

        {/* Latency */}
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-2 text-slate-500 text-[11px] sm:text-xs font-medium">
            <span className="leading-tight">Avg Latency</span>
            <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3">
            {metrics.totalRequests > 0 && metrics.avgLatencyMs > 0
              ? `${(metrics.avgLatencyMs / 1000).toFixed(1)}s`
              : '—'}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium leading-tight">
            {metrics.totalRequests > 0 ? 'AI Gateway' : 'No queries yet'}
          </p>
        </div>
      </div>

      {/* ---------- BOTS LIST ---------- */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Section header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              Your AI Bots
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-tight">
              Manage, test, and tune your WhatsApp employees.
            </p>
          </div>
          {bots.length > 0 && (
            <Link
              href="/bots"
              className="text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0 whitespace-nowrap"
            >
              View All &rarr;
            </Link>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-sm">
            Loading workspace bots...
          </div>
        ) : bots.length === 0 ? (
          /* Empty State */
          <div className="p-6 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Your first AI employee is waiting
              </h3>
              <p className="text-[13px] sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-snug">
                Deploy an autonomous agent in under 3 minutes to answer customer
                questions and capture leads on WhatsApp.
              </p>
            </div>
            <Link
              href="/bots/create"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold px-5 py-3 sm:py-2.5 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" /> Create Your First Bot
            </Link>
          </div>
        ) : (
          /* Bot List */
          <div className="divide-y divide-slate-100">
            {bots.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Bot Info */}
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {b.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase shrink-0">
                          {b.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                        <span className="truncate">{b.businessName}</span>
                        <span className="hidden sm:inline">
                          {' '}
                          &bull; Tone:{' '}
                          <span className="capitalize font-semibold text-slate-700">
                            {b.personality}
                          </span>{' '}
                          &bull; Lang:{' '}
                          <span className="uppercase font-semibold text-slate-700">
                            {b.language}
                          </span>
                        </span>
                      </p>
                      {/* Mobile-only meta chips */}
                      <div className="flex sm:hidden items-center gap-1.5 mt-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                          {b.personality}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                          {b.language}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Link
                      href={`/bots/${b.id}/test`}
                      className="flex-1 sm:flex-none text-center px-3.5 py-2.5 sm:py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors whitespace-nowrap"
                    >
                      Test
                    </Link>
                    <Link
                      href={`/bots/${b.id}/customize`}
                      className="flex-1 sm:flex-none text-center px-3.5 py-2.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Customize
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}