// ============================================================================
// RETIRU · Utility functions
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Category, Retreat } from '@/types';

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price in EUR */
export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format date in locale format */
export function formatDate(date: string, locale: 'es' | 'en' = 'es'): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format short date */
export function formatShortDate(date: string, locale: 'es' | 'en' = 'es'): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

/** Format date range */
export function formatDateRange(start: string, end: string, locale: 'es' | 'en' = 'es'): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = locale === 'es' ? 'es-ES' : 'en-GB';

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} - ${new Intl.DateTimeFormat(fmt, { day: 'numeric', month: 'long', year: 'numeric' }).format(e)}`;
  }

  return `${formatShortDate(start, locale)} - ${formatShortDate(end, locale)} ${e.getFullYear()}`;
}

/** Calculate platform fee based on commission percent (default 20%) */
export function calculatePlatformFee(totalPrice: number, commissionPercent: number = 20): number {
  return Math.round(totalPrice * (commissionPercent / 100) * 100) / 100;
}

/** Calculate organizer amount based on commission percent (default 20%) */
export function calculateOrganizerAmount(totalPrice: number, commissionPercent: number = 20): number {
  return Math.round(totalPrice * (1 - commissionPercent / 100) * 100) / 100;
}

/**
 * Tiered commission: 0% for 1st retreat with paid bookings,
 * 10% for 2nd, 20% for 3rd onward.
 */
export function getCommissionTier(paidRetreatsCount: number): number {
  if (paidRetreatsCount === 0) return 0;
  if (paidRetreatsCount === 1) return 10;
  return 20;
}

/** Generate slug from text */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate text */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '…';
}

const GENERIC_DESC_SUFFIX = 'Descripción generada automáticamente. Puedes completarla desde el panel de administración.';

/** Detecta si la descripción es la genérica del import */
export function isGenericDescription(desc: string | null | undefined): boolean {
  return !!desc?.includes(GENERIC_DESC_SUFFIX);
}

/** Quita markdown y HTML para mostrar un resumen limpio en cards */
export function stripMarkdownForPreview(text: string | null | undefined): string {
  if (!text?.trim()) return '';
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Extrae el "nombre de pila" de un nombre completo aplicando la heurística
 * española: los dos últimos tokens se consideran apellidos cuando hay 3 o
 * más palabras (p. ej. "María del Carmen Pérez Doña" → "María del Carmen",
 * "Juan Pérez Doña" → "Juan"). Con 1-2 palabras, devuelve la primera palabra.
 *
 * Se usa en los chats con el organizador de un retiro para mostrar el mínimo
 * de datos del organizador antes del pago. Los datos completos del organizador
 * solo se facilitan al usuario tras haber pagado la reserva.
 */
export function getOrganizerFirstName(name: string | null | undefined): string {
  const clean = (name ?? '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const tokens = clean.split(' ');
  if (tokens.length >= 3) return tokens.slice(0, -2).join(' ');
  return tokens[0] ?? clean;
}

// ─── Tipos de centro (fuente única de verdad para todo el front) ─────────────
// Usar en CentrosSearch, CentrosClient, badges, filtros, etc.

export const CENTER_TYPE_LABELS_ES: Record<string, string> = {
  yoga: 'Yoga',
  meditation: 'Meditación',
  ayurveda: 'Ayurveda',
};

export const CENTER_TYPE_LABELS_EN: Record<string, string> = {
  yoga: 'Yoga',
  meditation: 'Meditation',
  ayurveda: 'Ayurveda',
};

/** Tipos válidos para filtros del directorio (fase 1: tres disciplinas) */
export const VALID_CENTER_TYPE_SLUGS = ['yoga', 'meditation', 'ayurveda'] as const;

/** Categorías de retiro mostradas en home y filtros del listado público (fase inicial) */
export const PUBLIC_RETREAT_CATEGORY_SLUGS = ['yoga', 'meditacion', 'ayurveda'] as const;

/** ID estable solo para fallback UI si la fila `ayurveda` aún no existe en BD (migración 015). */
const AYURVEDA_FALLBACK_CATEGORY_ID = 'a0000000-0000-4000-8000-000000000001';

/**
 * Categorías de retiro públicas (yoga, meditación, ayurveda) en orden fijo para home y filtros.
 * Si falta `ayurveda` en Supabase, se devuelve un objeto sintético hasta aplicar la migración 015.
 */
export function filterPublicRetreatCategories(categories: Category[]): Category[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return PUBLIC_RETREAT_CATEGORY_SLUGS.map((slug) => {
    const existing = bySlug.get(slug);
    if (existing) return existing;
    if (slug === 'ayurveda') {
      return {
        id: AYURVEDA_FALLBACK_CATEGORY_ID,
        name_es: 'Ayurveda',
        name_en: 'Ayurveda',
        slug: 'ayurveda',
        description_es: null,
        description_en: null,
        intro_es: null,
        intro_en: null,
        meta_title_es: null,
        meta_title_en: null,
        meta_description_es: null,
        meta_description_en: null,
        icon: '🪷',
        cover_image_url: null,
        faq: [],
        sort_order: 11,
        is_active: true,
      };
    }
    throw new Error(`filterPublicRetreatCategories: falta categoría de retiro con slug "${slug}"`);
  });
}

/** Tipos de centro en buscadores y filtros del directorio público (fase inicial) */
export const PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS = ['yoga', 'meditation', 'ayurveda'] as const;

export function centerFilterOptionsPublic(locale: 'es' | 'en'): { slug: string; label: string }[] {
  const all = locale === 'es' ? CENTER_FILTER_OPTIONS_ES : CENTER_FILTER_OPTIONS_EN;
  const first = all[0];
  const rest = PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS.map((slug) => all.find((o) => o.slug === slug)).filter(
    (o): o is { slug: string; label: string } => o != null,
  );
  return [first, ...rest];
}

/** Opciones para el buscador/filtro de centros (ES) */
export const CENTER_FILTER_OPTIONS_ES = [
  { slug: '', label: 'Todos los tipos' },
  { slug: 'ayurveda', label: 'Ayurveda' },
  { slug: 'meditation', label: 'Meditación' },
  { slug: 'yoga', label: 'Yoga' },
];

/** Opciones para el buscador/filtro de centros (EN) */
export const CENTER_FILTER_OPTIONS_EN = [
  { slug: '', label: 'All types' },
  { slug: 'ayurveda', label: 'Ayurveda' },
  { slug: 'meditation', label: 'Meditation' },
  { slug: 'yoga', label: 'Yoga' },
];

/** Devuelve la etiqueta formateada para un tipo de centro */
export function getCenterTypeLabel(type: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  if (!type) return '';
  const labels = locale === 'es' ? CENTER_TYPE_LABELS_ES : CENTER_TYPE_LABELS_EN;
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Mapas de slugs para landings SEO programáticas ──────────────────────

/** category.slug → segmento EN para la URL (e.g. 'meditacion' → 'meditation') */
export const CATEGORY_SLUG_EN: Record<string, string> = {
  yoga: 'yoga',
  meditacion: 'meditation',
  ayurveda: 'ayurveda',
  detox: 'detox',
  naturaleza: 'nature',
  gastronomia: 'gastronomy',
  wellness: 'wellness',
  aventura: 'adventure',
  silencio: 'silent',
  'arte-creatividad': 'art-creativity',
  'desarrollo-personal': 'personal-growth',
};

/** Inverso: segmento EN → category.slug */
export const CATEGORY_SLUG_FROM_EN: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_EN).map(([es, en]) => [en, es]),
);

/** center.type (BD) → segmento URL ES (e.g. 'meditation' → 'meditacion') */
export const CENTER_TYPE_URL_ES: Record<string, string> = {
  yoga: 'yoga',
  meditation: 'meditacion',
  ayurveda: 'ayurveda',
};

/** Inverso: segmento URL ES → center.type (BD) */
export const CENTER_TYPE_FROM_URL_ES: Record<string, string> = Object.fromEntries(
  Object.entries(CENTER_TYPE_URL_ES).map(([type, urlEs]) => [urlEs, type]),
);

/** Booking status colors */
export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_confirmation: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    sla_expired: 'bg-orange-100 text-orange-800',
    completed: 'bg-sage-100 text-sage-800',
    cancelled_by_attendee: 'bg-gray-100 text-gray-800',
    cancelled_by_organizer: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    no_show: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/** Media y número de reseñas del organizador (para cards de listado, no del retiro concreto). */
export function getOrganizerReviewStats(r: Pick<Retreat, 'organizer'>): {
  avg_rating: number;
  review_count: number;
} {
  const o = r.organizer;
  return {
    avg_rating: typeof o?.avg_rating === 'number' ? o.avg_rating : 0,
    review_count: typeof o?.review_count === 'number' ? o.review_count : 0,
  };
}

/** Cards de listado: no mostrar 0.0 (0); solo si el organizador tiene valoración útil. */
export function organizerHasRatingToShow(r: Pick<Retreat, 'organizer'>): boolean {
  const { avg_rating, review_count } = getOrganizerReviewStats(r);
  return review_count > 0 || avg_rating > 0;
}

/** Valor en BD (URL o slug de página) → enlace absoluto para Facebook */
export function facebookProfileHref(raw: string | null | undefined): string | null {
  const t = (raw || '').trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  const u = t.replace(/^\/+/, '');
  if (/^(www\.|m\.)?facebook\.com/i.test(u) || /^fb\.com/i.test(u)) return `https://${u}`;
  return `https://www.facebook.com/${u}`;
}
