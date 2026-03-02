// ============================================================================
// RETIRU · i18n hook — get translations based on current locale
// ============================================================================

import es from './es';
import en from './en';
import type { Locale } from './config';
import type { TranslationKeys } from './es';

const dictionaries: Record<Locale, TranslationKeys> = { es, en };

export function getDictionary(locale: Locale): TranslationKeys {
  return dictionaries[locale] ?? dictionaries.es;
}

/**
 * Get a localized field from an object that has _es and _en variants
 * Example: getLocalized(event, 'title', 'es') → event.title_es
 */
export function getLocalized<T extends object>(
  obj: T,
  field: string,
  locale: Locale
): string {
  const record = obj as Record<string, unknown>;
  return (record[`${field}_${locale}`] as string) || (record[`${field}_es`] as string) || '';
}

/**
 * Extract locale from pathname: /es/retiro → 'es', /en/retreat → 'en'
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split('/')[1];
  return segment === 'en' ? 'en' : 'es';
}
