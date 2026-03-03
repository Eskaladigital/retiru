// ============================================================================
// RETIRU · URL base para producción (sitemap, robots, canonical, hreflang)
// Siempre usa www.retiru.com para evitar localhost en Google Search Console
// ============================================================================

export const PRODUCTION_URL = 'https://www.retiru.com';

/**
 * URL base del sitio. Siempre devuelve https://www.retiru.com para sitemap, canonical, hreflang.
 * Evita localhost en Google Search Console.
 */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && env.startsWith('https://') && !env.includes('localhost')) return env;
  return PRODUCTION_URL;
}
