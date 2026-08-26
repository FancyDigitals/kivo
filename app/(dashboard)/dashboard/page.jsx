'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  MessageSquare,
  Users,
  UserCheck,
  Plus,
  TrendingUp,
  Cpu,
  Sparkles,
  Sliders,
  BookOpen,
  QrCode,
  ArrowRight,
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
        // Fetch bots for the logged-in session's workspace
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time status of your active WhatsApp AI bots and customer inquiries.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bots/create"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create AI Bot
          </Link>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active AI Agents</span>
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{bots.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 font-semibold">{bots.filter(b => b.status === 'active').length} Deployed</span> on WhatsApp
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Customer Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.totalConversations}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Active WhatsApp Threads</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Leads Qualified</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{leadsCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Automated Lead Pipeline</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
    <span>Avg Response Latency</span>
    <Cpu className="w-4 h-4 text-purple-500" />
  </div>
  <p className="text-2xl font-bold text-slate-900 mt-3">
    {metrics.totalRequests > 0 && metrics.avgLatencyMs > 0
      ? `${(metrics.avgLatencyMs / 1000).toFixed(1)}s`
      : '—'}
  </p>
  <p className="text-xs text-slate-400 mt-1 font-medium">
    {metrics.totalRequests > 0 ? 'Multi-Provider AI Gateway' : 'No test queries sent yet'}
  </p>
</div>
      </div>

      {/* Dynamic Bots List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900">Your AI Bots</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage, test, and tune your WhatsApp employees.</p>
          </div>
          {bots.length > 0 && (
            <Link href="/bots" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All &rarr;
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading workspace bots...</div>
        ) : bots.length === 0 ? (
          /* Empty State when a workspace has 0 bots */
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your first AI employee is waiting</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Deploy an autonomous agent in under 3 minutes to answer customer questions and capture leads on WhatsApp.
              </p>
            </div>
            <Link
              href="/bots/create"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" /> Create Your First Bot
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bots.map((b) => (
              <div
                key={b.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-lg">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase">
                        {b.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {b.businessName} &bull; Tone: <span className="capitalize font-semibold text-slate-700">{b.personality}</span> &bull; Lang: <span className="uppercase font-semibold text-slate-700">{b.language}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/bots/${b.id}/test`}
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    Test in Simulator
                  </Link>
                  <Link
                    href={`/bots/${b.id}/customize`}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Customize
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}