// ============================================================================
// RETIRU · Root Layout — <html> + <body> únicos para toda la app
// ============================================================================

import './globals.css';
import BackToTop from '@/components/ui/back-to-top';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
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
