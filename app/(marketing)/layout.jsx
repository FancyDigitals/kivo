import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { Bot, ArrowRight, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Deploy your intelligent WhatsApp AI employee in under 3 minutes.</span>
        <Link href="/signup" className="text-emerald-400 hover:underline font-semibold ml-1 inline-flex items-center gap-1">
          Get Started Free <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">{BRAND.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#use-cases" className="hover:text-slate-900 transition-colors">Use Cases</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-emerald-400 font-bold">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-900">{BRAND.name}</span>
            <span>&copy; {new Date().getFullYear()} — Multi-tenant AI Agent Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Security</a>
            <a href="#" className="hover:text-slate-900">Official WhatsApp Cloud API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}