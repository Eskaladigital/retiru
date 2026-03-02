// ============================================================================
// RETIRU · English locale layout — SEO optimized
// ============================================================================

import type { Metadata, Viewport } from 'next';
import '../../globals.css';
import { jsonLdOrganization, jsonLdWebSite, jsonLdScript } from '@/lib/seo';
import BackToTop from '@/components/ui/back-to-top';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retiru.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c85a30',
};

export const metadata: Metadata = {
  title: {
    default: 'Retiru — Retreats, Centers & Wellness in Spain',
    template: '%s | Retiru',
  },
  description: 'Discover and book the best yoga, meditation, nature and wellness retreats in Spain. Wellness center directory and shop. Free for organizers.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Retiru',
  authors: [{ name: 'Retiru', url: SITE_URL }],
  keywords: ['retreats spain', 'yoga retreat', 'meditation retreat', 'wellness getaway', 'yoga centers spain', 'wellness spain', 'nature retreats', 'mindfulness', 'spa spain'],
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      'es': `${SITE_URL}/es`,
      'en': `${SITE_URL}/en`,
      'x-default': `${SITE_URL}/es`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_ES',
    siteName: 'Retiru',
    title: 'Retiru — Retreats, Centers & Wellness in Spain',
    description: 'Discover and book the best yoga, meditation, nature and wellness retreats in Spain.',
    url: `${SITE_URL}/en`,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Retiru — Retreats & Wellness in Spain' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retiru — Retreats, Centers & Wellness in Spain',
    description: 'Discover and book the best yoga, meditation, nature and wellness retreats in Spain.',
    site: '@retiru_es',
    creator: '@retiru_es',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.ico' },
  manifest: '/site.webmanifest',
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite('en')) }} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
