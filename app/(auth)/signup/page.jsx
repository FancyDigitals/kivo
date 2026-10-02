'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowRight, Check, Mail } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          fullName,
          businessName,
          email,
          password,
        }),
      });

      const result = await res.json();

      if (result.success && result.requiresVerification) {
        setVerificationSent(true);
        return;
      }

      if (result.success) {
        router.push('/login');
        return;
      }

      setErrorMsg(
        result.error || 'Failed to create account.'
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <main className="min-h-screen bg-[#050914] text-white">

        <header className="px-6 sm:px-10 py-7">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logos/white-logo.png"
              alt="Kivo"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </header>

        <section className="min-h-[calc(100vh-88px)] flex items-center justify-center px-5 py-12">

          <div className="w-full max-w-[460px]">

            <div className="rounded-[24px] border border-white/[0.08] bg-[#0A111E] p-7 sm:p-10 text-center">

              <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#08D9FF]/10 border border-[#08D9FF]/10">
                <Mail className="h-7 w-7 text-[#08D9FF]" />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                Check your email
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                We sent a verification link to
              </p>

              <p className="mt-1 text-sm font-medium text-white break-all">
                {email}
              </p>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Open the email and click{' '}
                <span className="text-slate-200 font-medium">
                  Verify my email
                </span>{' '}
                to activate your Kivo account.
              </p>

              <div className="mt-7 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left">
                <p className="text-xs leading-5 text-slate-500">
                  Didn't receive it? Check your spam or junk folder.
                  The verification link is valid for 24 hours.
                </p>
              </div>

              <Link
                href="/login"
                className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#08D9FF] text-sm font-semibold text-[#031018] transition hover:bg-[#22E0FF]"
              >
                Continue to sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

            </div>

            <p className="mt-5 text-center text-[11px] text-slate-600">
              Your account is waiting for email verification.
            </p>

          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">

      <header className="px-6 sm:px-10 py-7">
        <Link href="/" className="inline-flex items-center">
          <img
            src="/logos/white-logo.png"
            alt="Kivo"
            className="h-9 w-auto object-contain"
          />
        </Link>
      </header>

      <section className="min-h-[calc(100vh-88px)] flex items-center justify-center px-5 py-12">

        <div className="w-full max-w-[1080px] grid lg:grid-cols-[1fr_430px] gap-16 lg:gap-24 items-center">

          <div className="hidden lg:block">

            <h1 className="text-[60px] xl:text-[70px] leading-[0.96] font-semibold tracking-[-0.06em]">
              Your business.
              <br />
              <span className="text-[#08D9FF]">
                Always on.
              </span>
            </h1>

            <p className="mt-7 max-w-[470px] text-[17px] leading-7 text-slate-400">
              Create your Kivo workspace and give your AI everything it needs
              to understand your business, customers and conversations.
            </p>

            <div className="mt-9 space-y-4">
              {[
                '500 free AI credits',
                'Train Kivo with your business knowledge',
                'Connect WhatsApp when you are ready',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <Check className="w-4 h-4 text-[#08D9FF] shrink-0" />
                  {item}
                </div>
              ))}
            </div>

          </div>

          <div>

            <div className="rounded-[24px] border border-white/[0.08] bg-[#0A111E] p-6 sm:p-8">

              <div className="mb-7">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Create your workspace
                </h2>

                <p className="mt-1.5 text-sm text-slate-400">
                  Get started with 500 free AI credits.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">

                <div>
                  <label className="block text-[12px] font-medium text-slate-400 mb-2">
                    Full name
                  </label>

                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#050914] text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-[#08D9FF]/60 focus:ring-4 focus:ring-[#08D9FF]/[0.07]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-slate-400 mb-2">
                    Business name
                  </label>

                  <input
                    type="text"
                    placeholder="Apex Studio"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#050914] text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-[#08D9FF]/60 focus:ring-4 focus:ring-[#08D9FF]/[0.07]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-slate-400 mb-2">
                    Email address
                  </label>

                  <input
                    type="email"
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#050914] text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-[#08D9FF]/60 focus:ring-4 focus:ring-[#08D9FF]/[0.07]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-slate-400 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#050914] text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-[#08D9FF]/60 focus:ring-4 focus:ring-[#08D9FF]/[0.07]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full h-12 mt-2 rounded-xl bg-[#08D9FF] hover:bg-[#22E0FF] disabled:opacity-50 text-[#031018] font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-[#08D9FF] hover:text-[#22E0FF] transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>

            </div>

            <p className="text-center text-[11px] text-slate-600 mt-5">
              By creating an account, you agree to use Kivo responsibly.
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}
