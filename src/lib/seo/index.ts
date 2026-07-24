// ============================================================================
// RETIRU · SEO Utilities — Metadata, Open Graph, JSON-LD generators
// ============================================================================

import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();
const SITE_NAME = 'Retiru';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
const TWITTER_HANDLE = '@retiru_es';

// ─── Types ──────────────────────────────────────────────────────────────────

type Locale = 'es' | 'en';

interface SEOConfig {
  title: string;
  description: string;
  locale: Locale;
  path: string;                    // e.g. '/es/buscar' or '/en/search'
  altPath?: string;                // path in the other language
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  keywords?: string[];
}

// ─── Metadata Generator ─────────────────────────────────────────────────────

export function generatePageMetadata({
  title,
  description,
  locale,
  path,
  altPath,
  ogImage,
  ogType = 'website',
  noIndex = false,
  keywords,
}: SEOConfig): Metadata {
  const url = `${SITE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const altLocale = locale === 'es' ? 'en' : 'es';
  const altUrl = altPath ? `${SITE_URL}${altPath}` : undefined;

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    alternates: {
      canonical: url,
      languages: {
        'es': locale === 'es' ? url : altUrl || `${SITE_URL}/es`,
        'en': locale === 'en' ? url : altUrl || `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType === 'product' ? 'website' : ogType,
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      alternateLocale: locale === 'es' ? 'en_US' : 'es_ES',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 },
  };
}

// ─── JSON-LD Generators ─────────────────────────────────────────────────────

export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Plataforma de retiros, centros de bienestar y productos wellness en España.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hola@retiru.es',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://instagram.com/retiru_es',
      'https://twitter.com/retiru_es',
    ],
  };
}

export function jsonLdWebSite(locale: Locale) {
  const searchUrl = locale === 'es' ? `${SITE_URL}/es/buscar?q=` : `${SITE_URL}/en/search?q=`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === 'es' ? 'es' : 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** JSON-LD Event (retiros). Sin aggregateRating: Google no lo admite como padre
 *  válido para fragmentos de reseña y marca error «tipo de objeto … no válido». */
export function jsonLdEvent({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  price,
  currency = 'EUR',
  url,
  organizer,
  availability,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  image: string;
  price: number;
  currency?: string;
  url: string;
  organizer: string;
  availability: 'InStock' | 'SoldOut' | 'LimitedAvailability';
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: location,
      address: { '@type': 'PostalAddress', addressCountry: 'ES', addressLocality: location },
    },
    image,
    url: `${SITE_URL}${url}`,
    organizer: { '@type': 'Organization', name: organizer },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: `${SITE_URL}${url}`,
      validFrom: new Date().toISOString(),
    },
  };
  return ld;
}

export function jsonLdProduct({
  name,
  description,
  image,
  price,
  comparePrice,
  currency = 'EUR',
  url,
  sku,
  availability,
  rating,
  reviewCount,
  brand = SITE_NAME,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  comparePrice?: number | null;
  currency?: string;
  url: string;
  sku?: string | null;
  availability: 'InStock' | 'OutOfStock';
  rating?: number;
  reviewCount?: number;
  brand?: string;
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url: `${SITE_URL}${url}`,
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: `${SITE_URL}${url}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  if (sku) ld.sku = sku;
  if (rating && reviewCount) {
    ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating, reviewCount, bestRating: 5 };
  }
  return ld;
}

const CENTER_TYPE_SCHEMA: Record<string, { type: string; category?: string; additionalType?: string }> = {
  yoga: { type: 'YogaStudio' },
  meditation: {
    type: 'HealthAndBeautyBusiness',
    category: 'Meditation Center',
    additionalType: 'https://www.wikidata.org/wiki/Q10920',
  },
  ayurveda: {
    type: 'HealthAndBeautyBusiness',
    category: 'Ayurveda Center',
    additionalType: 'https://www.wikidata.org/wiki/Q131372',
  },
};

function pickPriceRangeSymbols(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^€{1,4}$/.test(trimmed)) return trimmed;
  if (/^\${1,4}$/.test(trimmed)) return trimmed;
  return trimmed.length <= 60 ? trimmed : undefined;
}

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function jsonLdLocalBusiness({
  name,
  description,
  address,
  city,
  province,
  postalCode,
  phone,
  email,
  url,
  image,
  images,
  rating,
  reviewCount,
  priceRange,
  centerType,
  type,
  website,
  sameAs,
  latitude,
  longitude,
  areaServed,
  openingHoursPeriods,
  reviews,
}: {
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  url: string;
  image?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string | null;
  centerType?: string | null;
  type?: string;
  website?: string | null;
  sameAs?: (string | null | undefined)[];
  latitude?: number | null;
  longitude?: number | null;
  areaServed?: string | null;
  /** Periodos de Google Places (day: 0=domingo … 6=sábado) → openingHoursSpecification */
  openingHoursPeriods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }> | null;
  /** Reseñas reales (máx. 5) → schema Review */
  reviews?: Array<{ author: string; rating: number; text: string; publish_time?: string }> | null;
}) {
  const schemaMeta = centerType ? CENTER_TYPE_SCHEMA[centerType] : undefined;
  const resolvedType = type ?? schemaMeta?.type ?? 'HealthAndBeautyBusiness';

  const imageList = (images?.length ? images : image ? [image] : []).filter(Boolean);
  const canonical = `${SITE_URL}${url}`;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': resolvedType,
    '@id': `${canonical}#business`,
    name,
    description,
    url: canonical,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: city,
      addressRegion: province,
      postalCode: postalCode || undefined,
      addressCountry: 'ES',
    },
  };

  if (imageList.length > 0) ld.image = imageList;
  if (schemaMeta?.category) ld.category = schemaMeta.category;
  if (schemaMeta?.additionalType) ld.additionalType = schemaMeta.additionalType;
  if (phone) ld.telephone = phone;
  if (email) ld.email = email;
  if (website) ld.hasMap = website;
  const cleanedPrice = pickPriceRangeSymbols(priceRange);
  if (cleanedPrice) ld.priceRange = cleanedPrice;
  if (areaServed) ld.areaServed = areaServed;

  if (typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    ld.geo = {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    };
  }

  const sameAsClean = [website, ...(sameAs ?? [])]
    .filter((s): s is string => typeof s === 'string' && /^https?:\/\//i.test(s))
    .filter((v, i, arr) => arr.indexOf(v) === i);
  if (sameAsClean.length > 0) ld.sameAs = sameAsClean;

  if (rating && reviewCount) {
    ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating, reviewCount, bestRating: 5 };
  }

  const validPeriods = (openingHoursPeriods || []).filter(
    (p) => p && p.open && p.close && p.open.day >= 0 && p.open.day <= 6,
  );
  if (validPeriods.length > 0) {
    ld.openingHoursSpecification = validPeriods.map((p) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[p.open.day]}`,
      opens: toHHMM(p.open.hour, p.open.minute),
      closes: toHHMM(p.close!.hour, p.close!.minute),
    }));
  }

  const validReviews = (reviews || []).filter((r) => r && r.text && r.rating >= 1).slice(0, 5);
  if (validReviews.length > 0) {
    ld.review = validReviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text.slice(0, 500),
      ...(r.publish_time ? { datePublished: r.publish_time.slice(0, 10) } : {}),
    }));
  }

  return ld;
}

export function jsonLdItemList(items: { name: string; url: string; image?: string; position?: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: item.position ?? i + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
      ...(item.image && { image: item.image }),
    })),
  };
}

export function jsonLdBreadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function jsonLdArticle({
  headline,
  description,
  datePublished,
  dateModified,
  author = 'Equipo Retiru',
  image,
  url,
  locale = 'es',
}: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string | null;
  author?: string;
  image?: string | null;
  url: string;
  locale?: Locale;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${url}` },
    inLanguage: locale === 'es' ? 'es' : 'en',
    ...(image && { image }),
  };
}

export function jsonLdFAQ(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

// ─── JSON-LD Script Component Helper ────────────────────────────────────────

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
