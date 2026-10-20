'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Unplug,
  AlertCircle,
} from 'lucide-react';

const META_APP_ID = '1082561691011151';
const META_CONFIG_ID = '1118229300820018';

const GRAPH_VERSION = 'v26.0';
const STATUS_ENDPOINT = '/api/whatsapp/cloud/status';
const CONNECT_ENDPOINT = '/api/whatsapp/cloud/connect';

export default function WhatsAppConnectionPage({ params }) {
  const resolvedParams = use(params);
  const botId = resolvedParams?.botId;

  const [status, setStatus] = useState('loading');
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [verifiedName, setVerifiedName] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const signupRef = useRef({
    code: null,
    wabaId: null,
    phoneNumberId: null,
    completed: false,
  });

  const busyRef = useRef(false);

  const loadStatus = useCallback(async () => {
    if (!botId) return;

    try {
      const response = await fetch(
        `${STATUS_ENDPOINT}?botId=${encodeURIComponent(botId)}`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load WhatsApp status.');
      }

      setStatus(data.status || 'disconnected');
      setPhoneNumber(data.phoneNumber || null);
      setVerifiedName(data.verifiedName || null);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Unable to load WhatsApp status.');
    }
  }, [botId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Load the official Facebook SDK.
  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });

      setSdkReady(true);
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onerror = () => {
        setError('The Meta SDK could not load. Check your internet connection and Meta app configuration.');
      };

      document.body.appendChild(script);
    }
  }, []);

  const finishSignup = useCallback(async () => {
    const signup = signupRef.current;

    if (
      busyRef.current ||
      !signup.code ||
      !signup.wabaId ||
      !signup.phoneNumberId ||
      !signup.completed
    ) {
      return;
    }

    busyRef.current = true;
    setConnecting(true);
    setError('');
    setNotice('Verifying your WhatsApp Business account…');

    try {
      const response = await fetch(CONNECT_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId,
          code: signup.code,
          wabaId: signup.wabaId,
          phoneNumberId: signup.phoneNumberId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'WhatsApp connection failed.');
      }

      setStatus('connected');
      setPhoneNumber(data.phoneNumber || null);
      setVerifiedName(data.verifiedName || null);
      setNotice('WhatsApp Business connected successfully.');

      signupRef.current = {
        code: null,
        wabaId: null,
        phoneNumberId: null,
        completed: false,
      };
    } catch (err) {
      setError(err.message || 'Unable to complete WhatsApp signup.');
      setNotice('');
    } finally {
      busyRef.current = false;
      setConnecting(false);
    }
  }, [botId]);

  // Meta returns WABA and phone IDs through window.postMessage.
  useEffect(() => {
    function handleMetaMessage(event) {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      let payload = event.data;

      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (!payload || typeof payload !== 'object') return;

      const eventName =
        payload.type ||
        payload.event ||
        payload.data?.type;

      if (eventName !== 'WA_EMBEDDED_SIGNUP') return;

      const data = payload.data || {};

      if (data.event === 'CANCEL') {
        signupRef.current.completed = false;
        setError('WhatsApp signup was cancelled.');
        setNotice('');
        return;
      }

      if (data.event === 'ERROR') {
        signupRef.current.completed = false;
        setError(data.error_message || 'Meta reported an Embedded Signup error.');
        setNotice('');
        return;
      }

      if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
        signupRef.current.wabaId =
          data.waba_id || data.wabaId || null;

        signupRef.current.phoneNumberId =
          data.phone_number_id ||
          data.phoneNumberId ||
          null;

        signupRef.current.completed = true;

        finishSignup();
      }
    }

    window.addEventListener('message', handleMetaMessage);

    return () => {
      window.removeEventListener('message', handleMetaMessage);
    };
  }, [finishSignup]);

  const connectWhatsApp = () => {
    setError('');
    setNotice('');

    if (!botId) {
      setError('Bot ID is missing.');
      return;
    }

    if (!window.FB || !sdkReady) {
      setError('Meta SDK is still loading. Try again shortly.');
      return;
    }

    signupRef.current = {
      code: null,
      wabaId: null,
      phoneNumberId: null,
      completed: false,
    };

    setConnecting(true);
    setNotice('Opening Meta Embedded Signup…');

    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code;

        if (!code) {
          setConnecting(false);
          setNotice('');

          if (response?.status === 'unknown') {
            setError('Signup was cancelled or authorization was not completed.');
          } else {
            setError('Meta did not return an authorization code. Check the Facebook Login for Business configuration.');
          }

          return;
        }

        signupRef.current.code = code;
        setNotice('Waiting for Meta to confirm your WhatsApp Business account…');

        // The FINISH event may arrive before or after the login callback.
        finishSignup();
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          version: 3,
        },
      }
    );
  };

  const disconnectWhatsApp = async () => {
    if (!window.confirm('Disconnect this WhatsApp number from this bot?')) {
      return;
    }

    setConnecting(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `${CONNECT_ENDPOINT}?botId=${encodeURIComponent(botId)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to disconnect WhatsApp.');
      }

      setStatus('disconnected');
      setPhoneNumber(null);
      setVerifiedName(null);
      setNotice('WhatsApp has been disconnected from this bot.');
    } catch (err) {
      setError(err.message || 'Disconnection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const isConnected = status === 'connected';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/bots/${botId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to bot
      </Link>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 p-5 sm:p-8 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <MessageCircle size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                WhatsApp Business
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                Connect a WhatsApp Business number through Meta&apos;s official
                Cloud API so this bot can receive and send messages.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Connection status
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : status === 'loading' || connecting
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {connecting
                  ? 'Connecting'
                  : status === 'loading'
                    ? 'Loading'
                    : isConnected
                      ? 'Connected'
                      : 'Disconnected'}
              </span>
            </div>

            {isConnected ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Phone
                    className="mt-1 text-green-600"
                    size={19}
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {phoneNumber || 'WhatsApp Business number'}
                    </p>
                    {verifiedName && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {verifiedName}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Connected using Meta Cloud API
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnectWhatsApp}
                  disabled={connecting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  {connecting ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Unplug size={16} />
                  )}
                  Disconnect number
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Sign in through Meta and select the WhatsApp Business
                  account and phone number you want to connect to this bot.
                </p>

                <button
                  type="button"
                  onClick={connectWhatsApp}
                  disabled={!sdkReady || connecting || status === 'loading'}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {connecting ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                  {connecting
                    ? 'Connecting…'
                    : sdkReady
                      ? 'Connect WhatsApp Business'
                      : 'Loading Meta…'}
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 shrink-0" size={17} />
                <span>{error}</span>
              </div>
            )}

            {notice && !error && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {isConnected ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                ) : (
                  <LoaderCircle className="mt-0.5 shrink-0 animate-spin" size={17} />
                )}
                <span>{notice}</span>
              </div>
            )}

            <button
              type="button"
              onClick={loadStatus}
              disabled={connecting}
              className="mt-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 disabled:opacity-50 dark:hover:text-white"
            >
              <RefreshCw size={14} />
              Refresh status
            </button>
          </div>

          <aside className="rounded-xl bg-gray-50 p-5 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={20}
                className="text-green-600"
              />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Official Cloud API
              </h2>
            </div>

            <ul className="mt-5 space-y-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
              <li>
                <strong className="text-gray-800 dark:text-gray-200">
                  Secure connection
                </strong>
                <br />
                Meta authorizes the selected WhatsApp Business assets.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">
                  Dedicated bot
                </strong>
                <br />
                Messages are routed using the connected phone number and its
                assigned bot.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">
                  No QR scanning
                </strong>
                <br />
                This connection uses Meta&apos;s official Cloud API rather than
                a WhatsApp Web session.
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
