'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Check,
  Building2,
  Ticket,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function BillingPage() {
  const [billing, setBilling] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.success && data.data) {
        setBilling(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || !billing) {
    return <div className="p-8 text-slate-400 text-sm">Loading subscription billing...</div>;
  }

  const usedCredits = Math.max(0, billing.monthlyCreditsLimit - billing.creditsBalance);
  const usagePercentage = Math.min(100, Math.round((usedCredits / billing.monthlyCreditsLimit) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & AI Credits</h1>
          <p className="text-sm text-slate-500 mt-1">Manage AI credit balance, top up tokens, or upgrade workspace plan.</p>
        </div>
      </div>

      {/* Credit Balance Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="space-y-1">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            Current Tier: {billing.plan.name}
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            {billing.creditsBalance.toLocaleString()} <span className="text-sm font-normal text-slate-400">Credits Left</span>
          </h2>
          <p className="text-xs text-slate-400">Monthly limit: {billing.monthlyCreditsLimit.toLocaleString()} Credits</p>
        </div>

        {/* Usage Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Credit Usage</span>
            <span className="text-emerald-400">{usagePercentage}% Used</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Top-up Button */}
        <div className="flex flex-col gap-2">
          <Link
            href="/settings/billing/checkout?topup=5000"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 text-center"
          >
            <Zap className="w-4 h-4 fill-slate-950" /> Add +5,000 Credits (₦10,000)
          </Link>
        </div>
      </div>

      {/* Subscription Plans Matrix */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Subscription Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {billing.allPlans.map((plan) => {
            const isCurrent = billing.plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm relative ${
                  isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                      {plan.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.description}</p>

                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {plan.priceNgn === 0 ? 'Free' : formatCurrency(plan.priceNgn)}
                    </span>
                    {plan.priceNgn > 0 && <span className="text-xs text-slate-500 font-medium"> / month</span>}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <Link
                      href={`/settings/billing/checkout?plan=${plan.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      Upgrade to {plan.name} <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}