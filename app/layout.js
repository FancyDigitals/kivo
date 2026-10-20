import './globals.css';
import { BRAND } from '@/config/brand';

export const metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  icons: {
    icon: '/logos/logo.png',
  },
  verification: {
    other: {
      "facebook-domain-verification": "ettvlpykynelrqtgwgcow8vwyund82",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-[#0080FF] selection:text-white">
        {children}
      </body>
    </html>
  );
}