import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/config/brand';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* ---------- NAVIGATION ---------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          
          {/* Logo (Standalone & Highly Visible) */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logos/logo.png"
              alt={BRAND.name}
              width={160}
              height={40}
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-150 group-hover:opacity-90"
              priority
            />
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-9 text-[13.5px] font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#use-cases" className="hover:text-slate-900 transition-colors">Customers</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="text-[13.5px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors hidden sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-[13.5px] font-medium bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="flex-1">{children}</main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            
            {/* Brand column */}
            <div className="col-span-2">
              <Link href="/" className="inline-block mb-4 group">
                <Image
                  src="/logo.png"
                  alt={BRAND.name}
                  width={150}
                  height={38}
                  className="h-8 w-auto object-contain transition-transform duration-150 group-hover:opacity-90"
                />
              </Link>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                The infrastructure for businesses that want to talk to every customer, instantly.
              </p>
            </div>

            <div>
              <h5 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.08em] mb-4">Product</h5>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.08em] mb-4">Company</h5>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Customers</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[11px] font-semibold text-slate-900 uppercase tracking-[0.08em] mb-4">Legal</h5>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">DPA</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}