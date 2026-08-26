import './globals.css';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}