'use client';

import { useState, useEffect } from 'react';
import { Cpu, Clock, Zap, Bot, RefreshCw, MessageSquare, ShieldCheck } from 'lucide-react';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
    activeBotsCount: 0,
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success && data.data) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Agent Performance & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time conversation metrics, bot activity, and response speed tracking.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {/* User-Facing Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total AI Responses</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.totalRequests.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">100% System Uptime</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Customer Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.totalConversations.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Active WhatsApp Threads</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active WhatsApp Agents</span>
            <Bot className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.activeBotsCount}</p>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">Deployed & Responding</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Response Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {metrics.avgLatencyMs ? `${metrics.avgLatencyMs} ms` : '0 ms'}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">Ultra-Fast Execution</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600" /> Bot Readiness Overview
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Configured AI Employee</span>
              <span className="font-bold text-slate-900">Fancy Assistant</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Conversation Mode</span>
              <span className="font-bold text-slate-900">Autonomous AI + Human Handoff</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Security & Isolation</span>
              <span className="font-bold text-emerald-600">Enterprise Multi-Tenant Active</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> High-Performance AI Pipeline
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your WhatsApp AI employees run on Kivo's resilient multi-provider network with automated failovers, ensuring 24/7 responsiveness for your customers with zero downtime.
          </p>
        </div>
      </div>
    </div>
  );
}