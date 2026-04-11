// ============================================================================
// RETIRU · English locale layout — SEO metadata + JSON-LD
// ============================================================================

import type { Metadata, Viewport } from 'next';
import { jsonLdOrganization, jsonLdWebSite } from '@/lib/seo';

import { getSiteUrl } from '@/lib/site-url';
const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c85a30',
};

export const metadata: Metadata = {
  title: {
    default: 'Retiru — Yoga, meditation & ayurveda retreats and centers',
    template: '%s | Retiru',
  },
  description: 'Discover and book yoga, meditation and ayurveda retreats and events in Spain. Center directory and shop. Organizers: no subscription; 20% platform fee on the PVP (80% net to you).',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Retiru',
  authors: [{ name: 'Retiru', url: SITE_URL }],
  keywords: ['retreats spain', 'yoga retreat', 'meditation retreat', 'ayurveda spain', 'yoga centers spain', 'meditation spain', 'ayurveda retreat'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_ES',
    siteName: 'Retiru',
    title: 'Retiru — Yoga, meditation & ayurveda retreats and centers',
    description: 'Discover and book yoga, meditation and ayurveda retreats and events in Spain.',
    url: `${SITE_URL}/en`,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Retiru — Yoga, meditation & ayurveda' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retiru — Yoga, meditation & ayurveda retreats and centers',
    description: 'Discover and book yoga, meditation and ayurveda retreats and events in Spain.',
    site: '@retiru_es',
    creator: '@retiru_es',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
  manifest: '/site.webmanifest',
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite('en')) }}
      />
      {children}
    </>
  );
}
