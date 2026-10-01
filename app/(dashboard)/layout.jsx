'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const LOGO_SRC = '/logos/logo.png'; // or '/logo.png' if that's your path

function LogoMark({ className = '', imgClassName = '' }) {
  return (
    <div
      className={`
        relative flex items-center justify-center
        rounded-xl bg-white
        ring-[3px] ring-[#0080FF]
        shadow-[0_0_0_1px_rgba(0,128,255,0.25),0_8px_20px_-6px_rgba(0,128,255,0.45)]
        ${className}
      `}
    >
      {/* soft inner glow edge */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-[#0080FF]/20"
        aria-hidden
      />
      <Image
        src={LOGO_SRC}
        alt={BRAND.name || 'Kivo'}
        width={120}
        height={36}
        className={`relative z-10 w-auto object-contain object-center ${imgClassName}`}
        priority
      />
    </div>
  );
}

function SidebarBrand({ onNavigate }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex items-center min-w-0 group"
    >
      <LogoMark
        className="h-10 px-2.5 py-1.5 transition-transform duration-200 group-hover:scale-[1.02]"
        imgClassName="h-7"
      />
    </Link>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState({
    name: 'Workspace',
    plan: 'Free Starter',
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
    window.addEventListener('workspace-updated', loadWorkspace);
    return () => window.removeEventListener('workspace-updated', loadWorkspace);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinkClass = (isActive) =>
    `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all ${
      isActive
        ? 'text-[#00B4FF] bg-slate-800/90 border-l-2 border-[#0080FF] pl-2.5'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
    }`;

  const renderNav = (mobile = false) => (
    <nav className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto ${mobile ? '' : ''}`}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={navLinkClass(isActive)}
          >
            <Icon
              className={`w-4 h-4 ${isActive ? 'text-[#00B4FF]' : 'text-slate-400'}`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = () => (
    <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#0080FF] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden relative">
          {workspace.name ? workspace.name.charAt(0).toUpperCase() : 'K'}
        </div>
        <div className="overflow-hidden min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {workspace.name}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {workspace.plan || 'Free Starter'}
          </p>
        </div>
      </div>
      <Link
        href="/login"
        title="Logout"
        className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between gap-2">
          <SidebarBrand onNavigate={() => setIsMobileMenuOpen(false)} />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderNav(true)}
        {renderFooter()}
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
        <div className="h-16 px-5 border-b border-slate-800 flex items-center">
          <SidebarBrand />
        </div>
        {renderNav(false)}
        {renderFooter()}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile top bar: small logo */}
            <Link href="/dashboard" className="md:hidden shrink-0 flex items-center">
              <Image
                src={LOGO_SRC}
                alt={BRAND.name || 'Kivo'}
                width={100}
                height={28}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>

            <div className="flex items-center gap-1.5 text-sm font-medium min-w-0 hidden sm:flex">
              <span className="text-slate-900 font-bold truncate">
                {workspace.name}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-[#00E5FF] border border-slate-800 text-xs font-bold shadow-sm transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#00E5FF] fill-[#00E5FF]" />
              <span>
                {(workspace.aiCreditsBalance ?? 0).toLocaleString()}{' '}
                <span className="hidden xs:inline">Credits</span>
              </span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0080FF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0080FF]" />
              </span>
              <span className="hidden lg:inline">AI Gateway Online</span>
            </div>

            <Link
              href="/bots/create"
              className="text-xs font-semibold bg-[#0080FF] hover:bg-[#0066DD] text-white px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Create New Bot"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Bot</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}