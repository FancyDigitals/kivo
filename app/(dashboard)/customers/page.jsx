'use client';

import { Users, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function CustomersPage() {
  const customers = [
    {
      id: 'cust_1',
      name: 'Alex Morgan',
      phone: '+234 812 345 6789',
      email: 'alex@company.com',
      totalSpent: '250000.00',
      lastInteracted: 'Today, 10:42 AM',
      tags: ['AI Lead', 'Qualified'],
    },
    {
      id: 'cust_2',
      name: 'Kemi Adebayo',
      phone: '+234 901 888 2233',
      email: 'kemi@brand.ng',
      totalSpent: '0.00',
      lastInteracted: 'Today, 11:15 AM',
      tags: ['Custom Dev', 'Needs Human'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Profiles</h1>
        <p className="text-sm text-slate-500 mt-1">Directory of contacts who interacted with Fancy Assistant on WhatsApp.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">WhatsApp Phone</th>
              <th className="p-4">Tags</th>
              <th className="p-4">Total Value</th>
              <th className="p-4">Last Interacted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">{c.name}</td>
                <td className="p-4 font-mono text-slate-600">{c.phone}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {c.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 font-semibold text-slate-900">{formatCurrency(c.totalSpent)}</td>
                <td className="p-4 text-slate-500">{c.lastInteracted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}