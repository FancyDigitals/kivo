'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin');
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprove = async (claimId) => {
    setApprovingId(claimId);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_claim', claimId }),
      });
      const result = await res.json();
      if (result.success) {
        loadAdminData();
      } else {
        alert(result.error || 'Failed to approve claim');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading || !data) {
    return <div className="p-8 text-slate-400 text-sm">Loading SuperAdmin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
            <ShieldAlert className="w-4 h-4" /> Kivo System Platform Admin
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">SuperAdmin Management & Payments</h1>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
          AI Gateway & Database: ONLINE
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Total Workspaces</p>
          <p className="text-3xl font-bold text-white mt-2">{data.totalWorkspaces}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Active Deployed Bots</p>
          <p className="text-3xl font-bold text-white mt-2">{data.activeBots}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">Pending Payment Claims</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{data.pendingClaims.length}</p>
        </div>
      </div>

      {/* Pending Payment Claims Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" /> Pending Bank Transfer Payment Claims
        </h2>

        {data.pendingClaims.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
            No pending bank transfer payment claims under review.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.pendingClaims.map((claim) => (
              <div key={claim.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{claim.workspaceName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 uppercase">
                      {claim.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Transfer Ref / Sender: <strong className="text-white font-mono">{claim.senderNameOrRef}</strong> &bull; Amount: <strong className="text-emerald-400">{formatCurrency(claim.amountNgn)}</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleApprove(claim.id)}
                  disabled={approvingId === claim.id}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  {approvingId === claim.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Approve & Credit Workspace
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}