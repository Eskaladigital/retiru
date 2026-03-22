// ============================================================================
// RETIRU · Root Layout — <html> + <body> únicos para toda la app
// ============================================================================

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import BackToTop from '@/components/ui/back-to-top';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { getSiteUrl } from '@/lib/site-url';

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
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <GoogleAnalytics />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
