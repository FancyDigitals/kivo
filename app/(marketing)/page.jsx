import Link from 'next/link';
import { BRAND } from '@/config/brand';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Bot,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      
      {/* ============================================ */}
      {/*                    HERO                       */}
      {/* ============================================ */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
        
        {/* Subtle dotted background */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Very soft emerald glow — brand color used as ambient light, not decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
          
          {/* Announcement pill — quiet, with subtle emerald hint */}
          <div className="flex justify-center mb-10">
            <Link 
              href="#" 
              className="group inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-600 transition-colors shadow-sm"
            >
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold">
                New
              </span>
              <span>Introducing broadcast campaigns</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Headline — editorial, tight, with strategic emerald accent */}
          <h1 className="text-center text-[42px] leading-[1.05] sm:text-6xl lg:text-[76px] lg:leading-[1.02] font-semibold tracking-[-0.035em] text-slate-950">
            Your business,<br />
            replying <span className="relative inline-block">
              <span className="relative z-10">instantly</span>
              <span className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-3 sm:h-4 lg:h-5 bg-emerald-400/40 -z-0 -skew-x-6"></span>
            </span>.
          </h1>

          {/* Subhead */}
          <p className="mt-7 text-center text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-[1.55] tracking-[-0.005em]">
            Build a WhatsApp assistant that answers questions, takes orders, and books appointments — around the clock, in every language your customers speak.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto h-12 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[14.5px] font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              Start building
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="#how-it-works"
              className="w-full sm:w-auto h-12 px-6 rounded-lg text-slate-700 hover:bg-slate-100 text-[14.5px] font-medium transition-all flex items-center justify-center gap-1.5"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Free to start. No credit card required.
          </p>
        </div>

        {/* Product Preview Frame */}
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 mt-16 sm:mt-24">
          <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden aspect-[16/10]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-400">Product preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/*                LOGO STRIP                     */}
      {/* ============================================ */}
      <section className="py-16 border-y border-slate-100 bg-slate-50/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-10">
            Trusted by teams at
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {['Vertex', 'Northwind', 'Kivo', 'Halcyon', 'Meridian', 'Aster'].map((brand) => (
              <div key={brand} className="text-center text-lg font-semibold text-slate-400 tracking-tight hover:text-slate-600 transition-colors">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/*                HOW IT WORKS                   */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          
          <div className="max-w-2xl mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-950 leading-[1.05]">
              From idea to live<br />in minutes.
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Three steps. That's it. No developers, no complicated setup, no waiting.
            </p>
          </div>

          {/* Steps — divider grid with emerald accent on final step */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            
            <div className="bg-white p-8 sm:p-10 group hover:bg-slate-50/50 transition-colors">
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-[11px] font-semibold text-slate-400 tracking-[0.1em] uppercase">Step</span>
                <span className="text-2xl font-semibold text-slate-300 tracking-tight">01</span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950 mb-3">
                Describe your business
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Answer a few questions about what you sell, how you help, and how you want to sound.
              </p>
            </div>

            <div className="bg-white p-8 sm:p-10 group hover:bg-slate-50/50 transition-colors">
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-[11px] font-semibold text-slate-400 tracking-[0.1em] uppercase">Step</span>
                <span className="text-2xl font-semibold text-slate-300 tracking-tight">02</span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950 mb-3">
                Add your knowledge
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Upload FAQs, product catalogs, pricing, and policies. Test everything in a live simulator.
              </p>
            </div>

            {/* Final step gets brand emphasis */}
            <div className="bg-white p-8 sm:p-10 group hover:bg-emerald-50/30 transition-colors relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 lg:hidden" />
              <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-emerald-500 hidden lg:block" />
              
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-[11px] font-semibold text-emerald-600 tracking-[0.1em] uppercase">Step</span>
                <span className="text-2xl font-semibold text-emerald-500 tracking-tight">03</span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950 mb-3">
                Connect WhatsApp
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Link your Business number. Your assistant starts handling every incoming message immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/*             FEATURES — DARK BENTO             */}
      {/* ============================================ */}
      <section id="features" className="py-24 sm:py-32 bg-slate-950 text-white relative overflow-hidden">
        
        {/* Ambient emerald glow */}
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          
          <div className="max-w-2xl mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
              Built to handle<br />real business.
            </h2>
            <p className="mt-5 text-lg text-slate-400 leading-relaxed">
              Every feature exists to protect your operations, your customers, and your uptime.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Hero feature card — 2x2 */}
            <div className="md:col-span-2 md:row-span-2 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800/80 p-8 sm:p-10 min-h-[320px] flex flex-col justify-between relative overflow-hidden group">
              
              {/* Decorative emerald grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgb(52 211 153) 1px, transparent 1px), linear-gradient(90deg, rgb(52 211 153) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                }}
              />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 leading-tight">
                  Never miss<br />a message.
                </h3>
                <p className="text-slate-400 leading-relaxed max-w-lg">
                  Automatic failover across multiple providers ensures your assistant always responds — even when a single service goes down.
                </p>
              </div>

              <div className="relative flex items-center gap-3 pt-8 mt-8 border-t border-slate-800">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <div className="w-8 h-8 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  <div className="w-8 h-8 rounded-full bg-emerald-300 border-2 border-slate-900" />
                </div>
                <span className="text-xs text-slate-500">99.98% uptime last 30 days</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 sm:p-8 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
                <div className="w-4 h-4 rounded-sm bg-emerald-400" />
              </div>
              <h4 className="text-lg font-semibold tracking-tight mb-2">
                Human handoff
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Complex or sensitive conversations gracefully transfer to your team's inbox.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 sm:p-8 hover:border-slate-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
                <div className="w-4 h-4 rounded-sm border-2 border-emerald-400" />
              </div>
              <h4 className="text-lg font-semibold tracking-tight mb-2">
                Complete isolation
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every workspace runs in its own encrypted context. Your data stays yours.
              </p>
            </div>

            {/* Stats row — full width */}
            <div className="md:col-span-3 rounded-2xl bg-slate-900 border border-slate-800/80 p-8 sm:p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-slate-800">
                <div className="md:pr-8">
                  <div className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2 text-emerald-400">3.2s</div>
                  <p className="text-sm text-slate-400 leading-relaxed">Average response time across all customer messages</p>
                </div>
                <div className="md:px-8">
                  <div className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2 text-emerald-400">94%</div>
                  <p className="text-sm text-slate-400 leading-relaxed">Of conversations resolved without human intervention</p>
                </div>
                <div className="md:pl-8">
                  <div className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2 text-emerald-400">24/7</div>
                  <p className="text-sm text-slate-400 leading-relaxed">Continuous coverage — nights, weekends, holidays</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/*                  USE CASES                    */}
      {/* ============================================ */}
      <section id="use-cases" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          
          <div className="max-w-2xl mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-950 leading-[1.05]">
              Made for how<br />you work.
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Whether you sell clothes, book appointments, or run a school — {BRAND.name} adapts to your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Retail & Fashion', desc: 'Product inquiries, sizing, orders, delivery updates.' },
              { title: 'Restaurants', desc: 'Menu questions, reservations, catering orders.' },
              { title: 'Real Estate', desc: 'Listing details, viewings, buyer qualification.' },
              { title: 'Healthcare', desc: 'Appointment booking, general inquiries, reminders.' },
              { title: 'Education', desc: 'Admissions, fees, class schedules, parent updates.' },
              { title: 'Professional Services', desc: 'Consultations, quotes, client onboarding.' },
            ].map((item) => (
              <div 
                key={item.title} 
                className="group p-6 rounded-xl border border-slate-200 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 bg-white transition-all"
              >
                <h4 className="font-semibold text-slate-950 tracking-tight mb-1.5">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-6 flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-emerald-600 transition-colors">
                  Learn more
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/*                    CTA                        */}
      {/* ============================================ */}
      <section className="py-24 sm:py-32 border-t border-slate-100 relative overflow-hidden">
        
        {/* Ambient emerald glow at bottom */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-950 leading-[1.05]">
            Start replying to<br />every customer.
          </h2>
          <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Set up your first assistant in minutes. No credit card, no commitment.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto h-12 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[14.5px] font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="w-full sm:w-auto h-12 px-6 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 text-[14.5px] font-medium transition-all flex items-center justify-center"
            >
              Talk to sales
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              5-minute setup
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}