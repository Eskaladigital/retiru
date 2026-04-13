// ============================================================================
// RETIRU · Mapeo de rutas ES ↔ EN (misma lógica que sitemap estático)
// ============================================================================

import type { Locale } from '@/i18n/config';

/** Convierte el path sin prefijo /es|/en desde ES hacia EN */
export function mapPathRestEsToEn(rest: string): string {
  const p = rest.startsWith('/') ? rest : `/${rest}`;
  return p
    .replace(/^\/buscar(\/|$)/, '/search$1')
    .replace(/^\/centros-retiru(\/|$)/, '/centers-retiru$1')
    .replace(/^\/tienda(\/|$)/, '/shop$1')
    .replace(/^\/retiros-retiru(\/|$)/, '/retreats-retiru$1')
    .replace(/^\/destinos(\/|$)/, '/destinations$1')
    .replace(/^\/para-organizadores(\/|$)/, '/for-organizers$1')
    .replace(/^\/para-asistentes(\/|$)/, '/for-attendees$1')
    .replace(/^\/ayuda(\/|$)/, '/help$1')
    .replace(/^\/sobre-nosotros(\/|$)/, '/about$1')
    .replace(/^\/contacto(\/|$)/, '/contact$1')
    .replace(/^\/centro(\/|$)/, '/center$1')
    .replace(/^\/retiro(\/|$)/, '/retreat$1')
    .replace(/^\/organizador(\/|$)/, '/organizer$1')
    .replace(/^\/registro(\/|$)/, '/register$1')
    .replace(/^\/reclamar(\/|$)/, '/claim$1');
}

export function mapPathRestEnToEs(rest: string): string {
  const p = rest.startsWith('/') ? rest : `/${rest}`;
  return p
    .replace(/^\/search(\/|$)/, '/buscar$1')
    .replace(/^\/centers-retiru(\/|$)/, '/centros-retiru$1')
    .replace(/^\/shop(\/|$)/, '/tienda$1')
    .replace(/^\/retreats-retiru(\/|$)/, '/retiros-retiru$1')
    .replace(/^\/destinations(\/|$)/, '/destinos$1')
    .replace(/^\/for-organizers(\/|$)/, '/para-organizadores$1')
    .replace(/^\/for-attendees(\/|$)/, '/para-asistentes$1')
    .replace(/^\/help(\/|$)/, '/ayuda$1')
    .replace(/^\/about(\/|$)/, '/sobre-nosotros$1')
    .replace(/^\/contact(\/|$)/, '/contacto$1')
    .replace(/^\/center(\/|$)/, '/centro$1')
    .replace(/^\/retreat(\/|$)/, '/retiro$1')
    .replace(/^\/organizer(\/|$)/, '/organizador$1')
    .replace(/^\/register(\/|$)/, '/registro$1')
    .replace(/^\/claim(\/|$)/, '/reclamar$1');
}

/**
 * Ruta equivalente en el otro idioma (sin resolver slugs de blog distintos).
 * Para /es/blog/artículo y /en/blog/artículo mantiene el mismo segmento; el artículo EN puede redirigir.
 */
export function getAlternateLocalePath(pathname: string, targetLocale: Locale): string {
  const m = pathname.match(/^\/(es|en)(\/.*)?$/);
  const current: Locale = m?.[1] === 'en' ? 'en' : 'es';
  let rest = m?.[2] ?? '/';
  if (rest === '') rest = '/';

  if (current === targetLocale) {
    return pathname || `/${targetLocale}`;
  }

  // Panel organizador: rutas espejo /es/panel ↔ /en/panel
  if (rest.startsWith('/panel')) {
    return `/${targetLocale}${rest}`;
  }

  // Cuenta (excepto panel): muchas rutas solo en ES — al pasar a EN ir a home
  if (current === 'es' && targetLocale === 'en') {
    if (/^\/(mis-|perfil|mensajes|facturas)/.test(rest)) {
      return '/en';
    }
  }

  const mapped =
    current === 'es' ? mapPathRestEsToEn(rest) : mapPathRestEnToEs(rest);

  return `/${targetLocale}${mapped}`;
}

export function isBlogArticlePath(pathname: string): boolean {
  return /^\/(es|en)\/blog\/[^/]+\/?$/.test(pathname);
}

export function isBlogIndexPath(pathname: string): boolean {
  return /^\/(es|en)\/blog\/?$/.test(pathname);
}

/** Prefijo /es/panel o /en/panel según pathname actual */
export function organizerLocaleFromPathname(pathname: string | null | undefined): Locale {
  return pathname?.startsWith('/en/') ? 'en' : 'es';
}

export function organizerPanelPrefix(locale: Locale): '/es/panel' | '/en/panel' {
  return locale === 'en' ? '/en/panel' : '/es/panel';
}

export function organizerEventsBase(locale: Locale): string {
  return `${organizerPanelPrefix(locale)}/eventos`;
}
