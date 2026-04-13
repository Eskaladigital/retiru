// ============================================================================
// RETIRU · Root Layout — <html> + <body> únicos para toda la app
// ============================================================================

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import BackToTop from '@/components/ui/back-to-top';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { getSiteUrl } from '@/lib/site-url';

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/favicon.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = h.get('x-retiru-locale') === 'en' ? 'en' : 'es';

  return (
    <html lang={lang} className={`${dmSerif.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background antialiased">
        <GoogleAnalytics />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
