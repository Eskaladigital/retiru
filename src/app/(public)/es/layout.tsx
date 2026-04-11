// ============================================================================
// RETIRU · Spanish locale layout — SEO metadata + JSON-LD
// ============================================================================

import type { Metadata, Viewport } from 'next';
import { jsonLdOrganization, jsonLdWebSite, jsonLdScript } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';
const SITE_URL = getSiteUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c85a30',
};

export const metadata: Metadata = {
  title: {
    default: 'Retiru — Retiros y centros de yoga, meditación y ayurveda',
    template: '%s | Retiru',
  },
  description: 'Descubre y reserva retiros y eventos de yoga, meditación y ayurveda en España. Directorio de centros y tienda. Organizadores: sin suscripción; comisión del 20 % sobre el PVP (80 % neto para ti).',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Retiru',
  authors: [{ name: 'Retiru', url: SITE_URL }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: ['retiros españa', 'retiro yoga', 'retiro meditación', 'ayurveda españa', 'centros yoga españa', 'retiros ayurveda', 'meditación españa'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    alternateLocale: 'en_US',
    siteName: 'Retiru',
    title: 'Retiru — Retiros y centros de yoga, meditación y ayurveda',
    description: 'Descubre y reserva retiros y eventos de yoga, meditación y ayurveda en España.',
    url: `${SITE_URL}/es`,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Retiru — Yoga, meditación y ayurveda' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retiru — Retiros y centros de yoga, meditación y ayurveda',
    description: 'Descubre y reserva retiros y eventos de yoga, meditación y ayurveda en España.',
    site: '@retiru_es',
    creator: '@retiru_es',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdOrganization()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdWebSite('es')) }}
      />
      {children}
    </>
  );
}
