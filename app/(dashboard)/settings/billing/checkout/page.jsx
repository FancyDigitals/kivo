'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Copy,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan');
  const topup = searchParams.get('topup');

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' or 'voucher'
  const [senderRef, setSenderRef] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      try {
        const query = planId ? `?plan=${planId}` : topup ? `?topup=${topup}` : '';
        const res = await fetch(`/api/billing/checkout${query}`);
        const data = await res.json();
        if (data.success && data.summary) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, [planId, topup]);

  const handleCopyAccount = () => {
    if (summary?.bankDetails?.accountNumber) {
      navigator.clipboard.writeText(summary.bankDetails.accountNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Submit Bank Transfer Proof
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!senderRef.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/billing/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimType: summary.type,
          planId: summary.planId,
          credits: summary.credits,
          amountNgn: summary.amountNgn,
          senderNameOrRef: senderRef.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
      } else {
        setErrorMessage(data.error || 'Failed to submit payment claim.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Instant Activation Voucher
  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/billing/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: voucherCode.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        window.dispatchEvent(new Event('workspace-updated'));
      } else {
        setErrorMessage(data.error || 'Invalid or expired voucher code.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> Preparing checkout summary...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings/billing"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Checkout & Payment</h1>
          <p className="text-xs text-slate-500">Pay via Direct Bank Transfer or Activation Voucher Code.</p>
        </div>
      </div>

      {/* SUCCESS SCREEN */}
      {successMessage ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Payment Submitted!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">{successMessage}</p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/settings/billing"
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Return to Billing Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Payment Form (Bank or Voucher) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-slate-200 p-1 rounded-xl flex text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'bank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" /> Bank Transfer
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voucher')}
                className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'voucher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ticket className="w-4 h-4 text-emerald-600" /> Voucher Code
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB A: Bank Transfer Instructions & Form */}
            {activeTab === 'bank' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Transfer to Official Bank Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Make payment using mobile banking or USSD to the account below:
                  </p>
                </div>

                {/* Bank Account Card */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                    <span>{summary.bankDetails.bankName}</span>
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Account Number</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-wider">
                        {summary.bankDetails.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-bold text-white">{summary.bankDetails.accountName}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Exact Amount to Send:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(summary.amountNgn)}</span>
                  </div>
                </div>

                {/* Sender Proof Form */}
                <form onSubmit={handleBankSubmit} className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">2. Confirm Payment Transfer</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your Bank Account Name or Transfer Reference so we can verify and credit your account.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Name / Transfer Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan / GTB-TRX-88231"
                      value={senderRef}
                      onChange={(e) => setSenderRef(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !senderRef.trim()}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Payment Proof...
                      </>
                    ) : (
                      <>
                        Submit Bank Transfer Proof <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB B: Voucher Code Form */}
            {activeTab === 'voucher' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Redeem Activation Voucher Code</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    If you received an activation code from an administrator, enter it below for instant activation.
                  </p>
                </div>

                <form onSubmit={handleVoucherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Code</label>
                    <input
                      type="text"
                      placeholder="e.g. FANCY-PRO-2025"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !voucherCode.trim()}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                      </>
                    ) : (
                      <>
                        Redeem Activation Code <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Sample Codes for Testing:</p>
                  <p className="font-mono text-[11px] text-emerald-700 font-semibold">• FANCY-PRO-2025 (Upgrades to Pro Plan + 15,000 Credits)</p>
                  <p className="font-mono text-[11px] text-emerald-700 font-semibold">• KIVO-BOOST-10K (+10,000 AI Credits)</p>
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Order Summary Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Order Summary</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Package / Plan</span>
                  <span className="font-bold text-slate-900">{summary.title}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">AI Credits Included</span>
                  <span className="font-bold text-emerald-600">+{summary.credits.toLocaleString()} Credits</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Reference ID</span>
                  <span className="font-mono font-semibold text-slate-700 text-[11px]">{summary.reference}</span>
                </div>

                <div className="flex justify-between py-2 text-sm">
                  <span className="font-bold text-slate-900">Total Payable</span>
                  <span className="font-extrabold text-slate-900 text-base">{formatCurrency(summary.amountNgn)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Direct Owner Verification
              </div>
              <p className="text-slate-300 leading-relaxed">
                Bank transfers are verified directly by the Kivo administration team. Once verified, your workspace balance will update instantly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}