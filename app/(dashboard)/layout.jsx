'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu,
  X,
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
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile navigation drawer whenever path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      
      {/* ---------- MOBILE DRAWER SIDEBAR OVERLAY ---------- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ---------- MOBILE SIDEBAR DRAWER ---------- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'text-emerald-400 bg-slate-800/90 border-l-2 border-emerald-500 pl-2.5' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Workspace Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {workspace.name ? workspace.name.charAt(0) : 'W'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{workspace.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{workspace.plan || 'Free Starter'}</p>
            </div>
          </div>
          <Link href="/login" title="Logout" className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg shrink-0">
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* ---------- DESKTOP FIXED SIDEBAR ---------- */}
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
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'text-emerald-400 bg-slate-800/80 border-l-2 border-emerald-500 pl-2' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Workspace Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {workspace.name ? workspace.name.charAt(0) : 'W'}
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

      {/* ---------- MAIN AREA ---------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ---------- RESPONSIVE TOP BAR ---------- */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4">
          
          {/* Left Block: Mobile Menu trigger + Workspace name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none md:hidden shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            
            <div className="flex items-center gap-1.5 text-sm font-medium min-w-0">
              <span className="text-slate-900 font-bold truncate">{workspace.name}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-slate-500 hidden sm:inline">Dashboard</span>
            </div>
          </div>

          {/* Right Block: Dynamic Metadata & Navigation triggers */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Dynamic AI Credits Button */}
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-bold shadow-sm transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>{(workspace.aiCreditsBalance || 15000).toLocaleString()} <span className="hidden xs:inline">Credits</span></span>
            </Link>

            {/* AI Status Indicator - collapses text label dynamically on mobile */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden lg:inline">AI Gateway Online</span>
            </div>

            {/* New Bot Button - remains compact as icon-only on mobile devices */}
            <Link
              href="/bots/create"
              className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Create New Bot"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Bot</span>
            </Link>
          </div>
        </header>

        {/* ---------- VIEWPORT CONTAINER ---------- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}