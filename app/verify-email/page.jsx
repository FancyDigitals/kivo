'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('This verification link is invalid.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            token,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage(
            result.alreadyVerified
              ? 'Your email is already verified.'
              : 'Your email has been verified successfully.'
          );
        } else {
          setStatus('error');
          setMessage(
            result.error || 'Unable to verify your email.'
          );
        }
      } catch (error) {
        console.error(error);

        setStatus('error');
        setMessage(
          'Something went wrong. Please try again.'
        );
      }
    };

    verifyEmail();
  }, [email, token]);

  return (
    <main className="min-h-screen bg-[#050914] text-white flex items-center justify-center px-5">
      <div className="w-full max-w-[460px]">

        <div className="rounded-[24px] border border-white/[0.08] bg-[#0A111E] p-8 sm:p-10 text-center">

          {status === 'loading' && (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#08D9FF]/10">
                <Loader2 className="h-7 w-7 text-[#08D9FF] animate-spin" />
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                Verifying your email
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                Email verified
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {message}
              </p>

              <Link
                href="/login"
                className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#08D9FF] text-sm font-semibold text-[#031018] transition hover:bg-[#22E0FF]"
              >
                Continue to sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                Verification failed
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {message}
              </p>

              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-sm font-medium transition hover:bg-white/[0.06]"
              >
                Request a new verification email
              </Link>
            </>
          )}

        </div>

        <p className="mt-5 text-center text-[11px] text-slate-600">
          Secure verification for your Kivo workspace.
        </p>

      </div>
    </main>
  );
}