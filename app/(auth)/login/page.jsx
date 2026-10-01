'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/config/brand';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('admin@fancydigitals.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const result = await res.json();

      if (result.success) {
        window.dispatchEvent(new Event('workspace-updated'));
        router.push('/dashboard');
      } else {
        setErrorMsg(result.error || 'Failed to sign in.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050914] text-white">

      {/* Header */}
      <header className="px-6 sm:px-10 py-7">
        <Link href="/" className="inline-flex items-center">
          <img
            src="/logos/white-logo.png"
            alt={BRAND.name}
            className="h-9 w-auto object-contain"
          />
        </Link>
      </header>

      <section className="min-h-[calc(100vh-88px)] flex items-center justify-center px-5 py-12">

        <div className="w-full max-w-[1080px] grid lg:grid-cols-[1fr_430px] gap-16 lg:gap-24 items-center">

          {/* Left */}
          <div className="hidden lg:block">

            <h1 className="text-[60px] xl:text-[70px] leading-[0.96] font-semibold tracking-[-0.06em]">
              Your business.
              <br />
              Your{' '}
              <span className="text-[#08D9FF]">
                AI.
              </span>
              <br />
              One workspace.
            </h1>

            <p className="mt-7 max-w-[470px] text-[17px] leading-7 text-slate-400">
              Sign in to manage your AI employee, business knowledge,
              conversations, leads and automation from one place.
            </p>

          </div>

          {/* Login */}
          <div>

            {/* Mobile */}
            <div className="lg:hidden mb-9">

              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Sign in to your {BRAND.name} workspace.
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-[24px] border border-white/[0.08] bg-[#0A111E] p-6 sm:p-8">

              <div className="mb-7">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm text-slate-400">
                  Sign in to continue to your workspace.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">

                <div>
                  <label className="block text-[12px] font-medium text-slate-400 mb-2">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-[#08D9FF] hover:text-[#22E0FF] transition-colors font-medium"
                >
                  Create one free
                </Link>
              </p>

            </div>

            <p className="text-center text-[11px] text-slate-600 mt-5">
              Secure access to your {BRAND.name} workspace.
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}