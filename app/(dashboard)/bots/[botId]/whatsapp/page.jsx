'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  Loader2,
  RefreshCw,
  LogOut,
  Bot,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

export default function BotWhatsAppSetupPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState('disconnected');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [assignedNumber, setAssignedNumber] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatusAndQr = async () => {
    try {
      const res = await fetch(
        `/api/whatsapp/status?botId=${encodeURIComponent(botId)}`,
        {
          cache: 'no-store',
        }
      );

      const contentType =
        res.headers.get('content-type') || '';

      if (!res.ok || !contentType.includes('application/json')) {
        console.warn(
          'WhatsApp status response was not JSON:',
          res.status
        );
        return;
      }

      const data = await res.json();

      if (!data.success) {
        return;
      }

      /*
       * Normalize the status returned by the WhatsApp backend.
       *
       * Your backend may return:
       * connected
       * open
       * ready
       * authenticated
       * online
       * active
       * logged_in
       * connecting
       * scanning
       * qr
       */
      const rawStatus = String(
        data.status ||
          data.connectionStatus ||
          data.whatsappStatus ||
          ''
      )
        .toLowerCase()
        .trim();

      const connectedStates = [
        'connected',
        'open',
        'ready',
        'authenticated',
        'online',
        'active',
        'logged_in',
        'logged-in',
      ];

      const scanningStates = [
        'connecting',
        'scanning',
        'qr',
        'qr_pending',
        'qr-pending',
      ];

      let normalizedStatus = 'disconnected';

      if (connectedStates.includes(rawStatus)) {
        normalizedStatus = 'connected';
      } else if (scanningStates.includes(rawStatus)) {
        normalizedStatus = 'scanning';
      }

      setConnectionStatus(normalizedStatus);

      const number =
        data.whatsappNumber ||
        data.phoneNumber ||
        data.assignedNumber ||
        '';

      if (number) {
        setAssignedNumber(number);
      }

      /*
       * Never allow an old QR code to remain visible after
       * the WhatsApp connection has become active.
       */
      if (normalizedStatus === 'connected') {
        setQrDataUrl(null);
      } else if (data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      }
    } catch (error) {
      console.error(
        'Error fetching WhatsApp status:',
        error?.message || error
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      if (mounted) {
        await fetchStatusAndQr();
      }
    };

    loadStatus();

    const interval = setInterval(() => {
      if (mounted) {
        fetchStatusAndQr();
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [botId]);

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect this WhatsApp line?'
    );

    if (!confirmed) {
      return;
    }

    setIsDisconnecting(true);

    try {
      const res = await fetch(
        `/api/whatsapp/status?botId=${encodeURIComponent(botId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        throw new Error(
          `Disconnect request failed with status ${res.status}`
        );
      }

      setConnectionStatus('disconnected');
      setQrDataUrl(null);
      setAssignedNumber('');

      await fetchStatusAndQr();
    } catch (error) {
      console.error(
        'Disconnect error:',
        error?.message || error
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0080FF]/10">
              <Loader2 className="h-6 w-6 animate-spin text-[#0080FF]" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Checking WhatsApp connection
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Loading your live connection status...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isConnected =
    connectionStatus === 'connected';

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={`/bots/${botId}`}
            aria-label="Back to bot"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                WhatsApp
              </h1>

              {isConnected && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              {isConnected
                ? 'Your WhatsApp line is connected and active.'
                : 'Connect a WhatsApp line to your AI bot.'}
            </p>
          </div>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}

            {isDisconnecting
              ? 'Disconnecting...'
              : 'Disconnect Line'}
          </button>
        )}
      </div>

      {/* CONNECTED STATE */}
      {isConnected && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* STATUS HEADER */}
          <div className="border-b border-slate-100 p-4 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      WhatsApp Connected
                    </h2>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <p className="mt-1 truncate font-mono text-[11px] sm:text-xs text-slate-500">
                    {assignedNumber || 'WhatsApp line connected'}
                  </p>
                </div>
              </div>

              <Link
                href={`/bots/${botId}/test`}
                className="inline-flex h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Bot className="h-4 w-4 text-[#0080FF]" />
                Test Simulator
              </Link>
            </div>
          </div>

          {/* CONNECTION DETAILS */}
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Wifi className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    Connection Active
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Your WhatsApp session is online and ready to process incoming messages.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    AI Automation Active
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Customer messages can now be processed automatically by your AI bot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE MESSAGE */}
          <div className="mx-4 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mx-6 sm:mb-6">
            <p className="text-xs font-bold text-slate-900">
              Your bot is ready to respond.
            </p>

            <p className="mt-1 text-[11px] sm:text-xs leading-5 text-slate-500">
              Messages sent to{' '}
              <strong className="font-mono text-slate-700">
                {assignedNumber || 'your connected WhatsApp number'}
              </strong>{' '}
              can be automatically processed and answered by your AI bot.
            </p>
          </div>
        </div>
      )}

      {/* SCANNING / DISCONNECTED STATE */}
      {!isConnected && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* QR HEADER */}
          <div className="border-b border-slate-100 px-4 py-5 text-center sm:px-6 sm:py-7">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0080FF]/10 text-[#0080FF]">
              <Smartphone className="h-5 w-5" />
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Connect WhatsApp
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-5 text-slate-500">
              Open WhatsApp on your phone and scan the QR code below to connect this bot.
            </p>
          </div>

          {/* QR */}
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col items-center">

              <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="WhatsApp pairing QR code"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0080FF]" />

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Waiting for QR code
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Generating a live WhatsApp pairing code...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] sm:text-xs text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-[#0080FF]" />

                <span>
                  QR code refreshes automatically
                </span>
              </div>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6">
            <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-4 sm:p-5">

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0080FF]/10 text-[#0080FF]">
                  <Smartphone className="h-4 w-4" />
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  How to connect
                </p>
              </div>

              <ol className="mt-4 space-y-3 text-[11px] sm:text-xs leading-5 text-slate-600">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    1
                  </span>

                  <span>
                    Open <strong>WhatsApp</strong> on your phone.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    2
                  </span>

                  <span>
                    Open <strong>Settings</strong> on iPhone or{' '}
                    <strong>Menu ⋮</strong> on Android.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    3
                  </span>

                  <span>
                    Select <strong>Linked Devices</strong>, then{' '}
                    <strong>Link a Device</strong>.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    4
                  </span>

                  <span>
                    Scan the QR code displayed above.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}