import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  MessageSquare,
  Users,
  BarChart3,
  Globe,
  Star,
  Brain,
  Headphones,
  ShoppingBag,
} from "lucide-react";

export const metadata = {
  title: "Kivo — Create your intelligent WhatsApp employee",
  description:
    "Build, train, deploy, and manage production-ready WhatsApp AI bots for your business in minutes without writing code.",
  keywords: [
    "WhatsApp AI Bot",
    "AI Customer Service",
    "WhatsApp Automation",
    "AI Employee",
    "No-Code Chatbot",
    "SaaS WhatsApp Bot",
  ],
  openGraph: {
    title: "Kivo — Create your intelligent WhatsApp employee",
    description:
      "Automate sales, support, bookings, and customer inquiry handling on WhatsApp with intelligent AI.",
    url: "/",
    siteName: "Kivo",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kivo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Production-ready SaaS platform to build and deploy intelligent WhatsApp AI bots.",
    url: "https://kivo.ai",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white text-slate-900 selection:bg-[#0080FF] selection:text-white">
        
        {/* ============================================ */}
        {/*                    HERO                       */}
        {/* ============================================ */}
        <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32 overflow-hidden">
          {/* Dotted grid background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(11 27 75) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Kivo ambient blue glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#0080FF]/[0.06] rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
            
            {/* Announcement Pill */}
            <div className="flex justify-center mb-8">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 pl-2 pr-3.5 py-1 rounded-full bg-slate-50 border border-slate-200 hover:border-[#0080FF]/40 text-xs text-slate-700 transition-all shadow-xs"
              >
                <span className="px-2 py-0.5 rounded-full bg-[#0080FF] text-white text-[10px] font-semibold tracking-wide uppercase">
                  Next-Gen AI
                </span>
                <span className="font-medium">Build your WhatsApp bot in 3 minutes</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 text-[#0080FF] transition-transform" />
              </Link>
            </div>

            {/* Headline */}
            <h1 className="text-center text-[40px] leading-[1.08] sm:text-6xl lg:text-[72px] lg:leading-[1.04] font-bold tracking-tight text-slate-900">
              Create your intelligent
              <br />
              <span className="relative inline-block text-[#0080FF]">
                WhatsApp employee
              </span>
              .
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-center text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Build, train, and deploy AI bots that handle customer support, sales, product catalogs, orders, and bookings 24/7 without code.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#0080FF] hover:bg-[#0066DD] text-white text-[14.5px] font-medium shadow-md shadow-[#0080FF]/20 transition-all flex items-center justify-center gap-2"
              >
                Build Your Bot Free
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto h-12 px-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[14.5px] font-medium transition-all flex items-center justify-center gap-1.5"
              >
                See How It Works
              </a>
            </div>

            {/* Social Trust Line */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <div className="flex text-[#0080FF]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </div>
              <span>Powered by OpenRouter, Gemini & Groq · Official WhatsApp Cloud API</span>
            </div>
          </div>

          {/* Interactive Interface Mockup Preview */}
          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 mt-14 sm:mt-18">
            <div className="relative rounded-2xl border border-slate-200/80 bg-slate-900 shadow-[0_20px_60px_-15px_rgba(0,128,255,0.12)] overflow-hidden">
              
              {/* Fake Window Header */}
              <div className="h-10 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">kivo-bot-dashboard — active</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#00E5FF]">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                  WhatsApp Live
                </div>
              </div>

              {/* Mock Dashboard & Chat View */}
              <div className="grid grid-cols-1 md:grid-cols-3 p-6 gap-6 bg-slate-950 text-slate-100">
                {/* Simulated Conversation Panel */}
                <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[320px]">
                  <div className="space-y-3">
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-200 text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-xs max-w-xs">
                        Hello! Do you have the Black Kaftan available in Size 42?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#0080FF] text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-xs max-w-xs shadow-sm">
                        Yes, we do! 🛍️ The Black Kaftan in Size 42 is in stock at ₦45,000. Would you like me to reserve it or process your order?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-200 text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-xs max-w-xs">
                        Awesome! How do I make payment?
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-[#00E5FF]" /> AI Response Time: 1.1s
                    </span>
                    <span className="text-slate-500 font-mono">Provider: OpenRouter (Fallback: Gemini)</span>
                  </div>
                </div>

                {/* Simulated Stats Panel */}
                <div className="space-y-4">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Conversations Today</p>
                    <p className="text-2xl font-bold text-white mt-1">1,428</p>
                    <span className="text-[11px] text-emerald-400">↑ 98.4% AI Handled</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Leads Captured</p>
                    <p className="text-2xl font-bold text-[#00E5FF] mt-1">312</p>
                    <span className="text-[11px] text-slate-400">Synced to CRM</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Human Handoff Rate</p>
                    <p className="text-xl font-bold text-white mt-1">1.6%</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*               CAPABILITIES STRIP             */}
        {/* ============================================ */}
        <section className="py-12 border-y border-slate-100 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-7">
              Built for Every Business Industry
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
              {[
                { label: "E-Commerce", icon: ShoppingBag },
                { label: "Restaurants", icon: Sparkles },
                { label: "Real Estate", icon: Globe },
                { label: "Schools & Edu", icon: Brain },
                { label: "Customer Care", icon: Headphones },
                { label: "Sales & Leads", icon: Zap },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-3 text-center group"
                >
                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-2 text-slate-700 group-hover:border-[#0080FF] group-hover:text-[#0080FF] transition-all shadow-xs">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*                HOW IT WORKS                   */}
        {/* ============================================ */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl mb-14 sm:mb-18">
              <p className="text-xs font-semibold text-[#0080FF] uppercase tracking-widest mb-2">
                Simple & Fast Onboarding
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                From setup to live WhatsApp bot
                <br />
                in 3 simple steps.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                No coding required. Anyone on your team can create and manage an AI employee.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:border-[#0080FF]/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0080FF] text-white flex items-center justify-center text-sm font-bold mb-6">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Answer A Few Questions
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Use our guided wizard to define your bot's personality, language (English, Pidgin, Yoruba, etc.), and primary objectives.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:border-[#0080FF]/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0080FF] text-white flex items-center justify-center text-sm font-bold mb-6">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Teach Your Business
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload PDFs, website URLs, FAQs, and product catalogs so your AI bot answers accurately from your private knowledge.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 hover:border-[#0080FF]/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0080FF] text-white flex items-center justify-center text-sm font-bold mb-6">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Connect WhatsApp & Go Live
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Link your WhatsApp Business Cloud API with one click. Test in our built-in simulator before going live.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*             FEATURES — DARK BENTO             */}
        {/* ============================================ */}
        <section
          id="features"
          className="py-20 sm:py-28 bg-[#0B1B4B] text-white relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl mb-14 sm:mb-18">
              <p className="text-xs font-semibold text-[#00E5FF] uppercase tracking-widest mb-2">
                Enterprise Infrastructure
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Built for reliability, speed,
                <br />
                and strict data isolation.
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                Multi-tenant security, model fallback routing, and complete customer isolation out of the box.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Main Feature - 2 Cols */}
              <div className="md:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-8 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0080FF]/20 border border-[#0080FF]/40 text-[#00E5FF] text-[11px] font-semibold uppercase tracking-wider mb-6">
                    <Zap className="w-3 h-3" /> Multi-Provider AI Gateway
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">
                    Zero Downtime AI Routing
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                    If OpenRouter slows down, Kivo instantly fallbacks to Google Gemini or Groq server-side. Your customers on WhatsApp never experience dropped messages.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">OpenRouter → Gemini → Groq</span>
                  <Link
                    href="/signup"
                    className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1 font-medium"
                  >
                    Learn more <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Bento Card 2 */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-7">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-5 text-[#00E5FF]">
                  <Users size={18} />
                </div>
                <h4 className="text-base font-bold mb-2">Human Handoff</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When conversations require human attention, Kivo immediately alerts your team and pauses AI automatically.
                </p>
              </div>

              {/* Bento Card 3 */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-7">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-5 text-[#00E5FF]">
                  <MessageSquare size={18} />
                </div>
                <h4 className="text-base font-bold mb-2">Hybrid Inbox</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage all WhatsApp customer chats from a centralized Linear-style inbox with agent assignment and notes.
                </p>
              </div>

              {/* Bento Card 4 - Full Row */}
              <div className="md:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-7">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-5 text-[#00E5FF]">
                  <BarChart3 size={18} />
                </div>
                <h4 className="text-base font-bold mb-2">Token & AI Cost Tracking</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track exact token consumption, model performance, and operational cost per workspace down to the cent.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*                    CTA                        */}
        {/* ============================================ */}
        <section className="py-20 sm:py-28 border-t border-slate-100 bg-slate-50/50 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Ready to deploy your first
              <br />
              AI WhatsApp employee?
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              Start building today. Free setup, no credit card required to begin testing.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#0080FF] hover:bg-[#0066DD] text-white text-[14.5px] font-medium shadow-md shadow-[#0080FF]/20 transition-all flex items-center justify-center gap-2"
              >
                Create Bot Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0080FF]" /> Multi-tenant isolated
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0080FF]" /> WhatsApp Cloud API
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0080FF]" /> Instant Live Simulator
              </span>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}