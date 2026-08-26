import Link from 'next/link';
import { BRAND } from '@/config/brand';
import {
  Bot,
  Zap,
  Shield,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Users,
  ShoppingBag,
  Clock,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Code Autonomous WhatsApp Agents
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Create your intelligent <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
              WhatsApp Employee.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Build, train, and deploy an AI bot that answers inquiries, sells products, takes orders, and qualifies leads on WhatsApp 24/7. No coding required.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              Build Your Bot Free
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 shadow-sm transition-all"
            >
              Explore Live Demo
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Official WhatsApp Cloud API</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-Provider AI Fallback</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strict Data Isolation</span>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section id="how-it-works" className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Simple 3-Step Setup</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Live on WhatsApp in under 3 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tell us about your business</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Answer a few quick questions. Choose tone, supported languages, and primary tasks (Sales, Support, Orders).
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Upload knowledge & products</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Add FAQs, pricing, operating hours, policies, or catalog items. Test your bot immediately in the simulator.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Connect WhatsApp & Go Live</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Link your Meta WhatsApp Business number. Your bot starts closing sales and answering customers instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise AI Engine</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
              Built for high-volume, reliable operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Cpu className="w-6 h-6 text-emerald-400 mb-4" />
              <h4 className="font-semibold text-base">Multi-Provider AI Gateway</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Automatic fallback across Claude, Gemini, and Groq ensures your WhatsApp bot is never down due to provider outages.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Users className="w-6 h-6 text-emerald-400 mb-4" />
              <h4 className="font-semibold text-base">Instant Human Handoff</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                When complex situations arise or a customer asks for a person, your bot gracefully hands over the chat to your inbox team.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Shield className="w-6 h-6 text-emerald-400 mb-4" />
              <h4 className="font-semibold text-base">Strict Multi-Tenant Isolation</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Every business’s bots, messages, customer details, and knowledge bases are encrypted and completely isolated.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}