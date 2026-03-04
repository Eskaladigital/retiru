// ============================================================================
// RETIRU · Utility functions
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

/** Calculate platform fee (20%) */
export function calculatePlatformFee(totalPrice: number): number {
  return Math.round(totalPrice * 0.2 * 100) / 100;
}

/** Calculate organizer amount (80%) */
export function calculateOrganizerAmount(totalPrice: number): number {
  return Math.round(totalPrice * 0.8 * 100) / 100;
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

/** Quita markdown para mostrar un resumen limpio en cards (sin ###, **, etc.) */
export function stripMarkdownForPreview(text: string | null | undefined): string {
  if (!text?.trim()) return '';
  return text
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

// ─── Tipos de centro (fuente única de verdad para todo el front) ─────────────
// Usar en CentrosSearch, CentrosClient, badges, filtros, etc.

export const CENTER_TYPE_LABELS_ES: Record<string, string> = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  meditation: 'Meditación',
  ayurveda: 'Ayurveda',
  spa: 'Spa',
  wellness: 'Wellness',
  yoga_meditation: 'Yoga + Meditación',
  wellness_spa: 'Wellness + Spa',
  multidisciplinary: 'Multidisciplinar',
};

export const CENTER_TYPE_LABELS_EN: Record<string, string> = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  meditation: 'Meditation',
  ayurveda: 'Ayurveda',
  spa: 'Spa',
  wellness: 'Wellness',
  yoga_meditation: 'Yoga + Meditation',
  wellness_spa: 'Wellness + Spa',
  multidisciplinary: 'Multidisciplinary',
};

/** Tipos válidos para filtros (excluye retiro y otros no deseados) */
export const VALID_CENTER_TYPE_SLUGS = [
  'yoga', 'pilates', 'meditation', 'ayurveda', 'spa', 'wellness',
  'yoga_meditation', 'wellness_spa', 'multidisciplinary',
] as const;

/** Opciones para el buscador/filtro de centros (ES) — orden alfabético */
export const CENTER_FILTER_OPTIONS_ES = [
  { slug: '', label: 'Todos los tipos' },
  { slug: 'ayurveda', label: 'Ayurveda' },
  { slug: 'meditation', label: 'Meditación' },
  { slug: 'multidisciplinary', label: 'Multidisciplinar' },
  { slug: 'pilates', label: 'Pilates' },
  { slug: 'spa', label: 'Spa' },
  { slug: 'wellness', label: 'Wellness' },
  { slug: 'wellness_spa', label: 'Wellness + Spa' },
  { slug: 'yoga', label: 'Yoga' },
  { slug: 'yoga_meditation', label: 'Yoga + Meditación' },
];

/** Opciones para el buscador/filtro de centros (EN) — orden alfabético */
export const CENTER_FILTER_OPTIONS_EN = [
  { slug: '', label: 'All types' },
  { slug: 'ayurveda', label: 'Ayurveda' },
  { slug: 'meditation', label: 'Meditation' },
  { slug: 'multidisciplinary', label: 'Multidisciplinary' },
  { slug: 'pilates', label: 'Pilates' },
  { slug: 'spa', label: 'Spa' },
  { slug: 'wellness', label: 'Wellness' },
  { slug: 'wellness_spa', label: 'Wellness + Spa' },
  { slug: 'yoga', label: 'Yoga' },
  { slug: 'yoga_meditation', label: 'Yoga + Meditation' },
];

/** Devuelve la etiqueta formateada para un tipo de centro */
export function getCenterTypeLabel(type: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  if (!type) return '';
  const labels = locale === 'es' ? CENTER_TYPE_LABELS_ES : CENTER_TYPE_LABELS_EN;
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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
