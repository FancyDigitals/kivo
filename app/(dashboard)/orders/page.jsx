'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, XCircle, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.data) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Inquiries</h1>
        <p className="text-sm text-slate-500 mt-1">Orders and bookings generated directly through WhatsApp conversations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-900">{o.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{o.phoneNumber}</p>
                </td>
                <td className="p-4">
                  {o.items.map((item, idx) => (
                    <p key={idx} className="text-slate-700 font-medium">
                      {item.quantity}x {item.name}
                    </p>
                  ))}
                </td>
                <td className="p-4 font-bold text-slate-900">{formatCurrency(o.total, o.currency)}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      o.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="p-4">
                  <span className="capitalize font-semibold text-slate-700">{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}