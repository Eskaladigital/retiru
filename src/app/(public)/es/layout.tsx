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
    default: 'Retiru — Retiros, Centros y Bienestar en España',
    template: '%s | Retiru',
  },
  description: 'Descubre y reserva los mejores retiros de yoga, meditación, naturaleza y wellness en España. Directorio de centros de bienestar y tienda wellness. Sin comisiones para organizadores.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Retiru',
  authors: [{ name: 'Retiru', url: SITE_URL }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: ['retiros españa', 'retiro yoga', 'retiro meditación', 'escapadas bienestar', 'centros yoga españa', 'wellness españa', 'retiros naturaleza', 'mindfulness', 'spa españa'],
  alternates: {
    canonical: `${SITE_URL}/es`,
    languages: {
      'es': `${SITE_URL}/es`,
      'en': `${SITE_URL}/en`,
      'x-default': `${SITE_URL}/es`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    alternateLocale: 'en_US',
    siteName: 'Retiru',
    title: 'Retiru — Retiros, Centros y Bienestar en España',
    description: 'Descubre y reserva los mejores retiros de yoga, meditación, naturaleza y wellness en España.',
    url: `${SITE_URL}/es`,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Retiru — Retiros y Bienestar en España' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retiru — Retiros, Centros y Bienestar en España',
    description: 'Descubre y reserva los mejores retiros de yoga, meditación, naturaleza y wellness en España.',
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
