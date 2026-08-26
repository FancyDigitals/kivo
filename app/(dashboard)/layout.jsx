'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import {
  Bot,
  MessageSquare,
  Users,
  UserCheck,
  ShoppingBag,
  Package,
  BookOpen,
  Zap,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'My Bots', href: '/bots', icon: Bot },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Leads', href: '/leads', icon: UserCheck },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Products', href: '/products', icon: ShoppingBag },
  { label: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Billing & Credits', href: '/settings/billing', icon: Zap },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [workspace, setWorkspace] = useState({
    name: 'Fancy Digitals',
    plan: 'Pro Agency Plan',
  });

  const loadWorkspace = async () => {
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      if (data.success && data.data) {
        setWorkspace(data.data);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  useEffect(() => {
    loadWorkspace();

    // Listen for setting updates saved anywhere in the dashboard
    window.addEventListener('workspace-updated', loadWorkspace);
    return () => window.removeEventListener('workspace-updated', loadWorkspace);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
        {/* Workspace Brand / Selector */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">{BRAND.name}</span>
              <span className="block text-[10px] text-slate-400 font-medium">Workspace</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Workspace Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {workspace.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{workspace.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{workspace.plan || 'Free Starter'}</p>
            </div>
          </div>
          <Link href="/login" title="Logout" className="text-slate-400 hover:text-white shrink-0">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span className="text-slate-900 font-bold">{workspace.name}</span>
            <span>/</span>
            <span className="text-slate-500">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
  <Link
    href="/settings/billing"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-emerald-400 border border-slate-800 text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors"
  >
    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
    <span>{(workspace.aiCreditsBalance || 15000).toLocaleString()} Credits</span>
  </Link>
</div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Gateway Online
            </div>

            <Link
              href="/bots/create"
              className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Bot className="w-3.5 h-3.5" />
              New Bot
            </Link>
          </div>
        </header>

        {/* Body Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}