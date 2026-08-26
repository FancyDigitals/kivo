'use client';

import { UserCheck, Sparkles, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function LeadsPage() {
  const leads = [
    {
      id: 'lead_1',
      title: 'WhatsApp AI Agent Enterprise Setup',
      customer: 'Alex Morgan',
      value: '250000.00',
      status: 'Qualified',
      confidence: 88,
    },
    {
      id: 'lead_2',
      title: 'Custom Mobile Application',
      customer: 'Kemi Adebayo',
      value: '750000.00',
      status: 'Contacted',
      confidence: 72,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Lead Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">High-intent inquiries qualified automatically by Fancy Assistant.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {leads.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase">
                {l.status}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {l.confidence}% AI Qualification
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-base">{l.title}</h3>
            <p className="text-xs text-slate-500">Lead Contact: <strong>{l.customer}</strong></p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">{formatCurrency(l.value)}</span>
              <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}