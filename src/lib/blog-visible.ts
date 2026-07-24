/** ISO: artículos visibles en web si published_at ≤ ahora (no futuros). */
export function blogVisibleBeforeIso(now: Date = new Date()): string {
  return now.toISOString();
}

/** Comprueba si un artículo debe mostrarse al público (fecha ya llegada). */
export function isBlogArticlePubliclyVisible(
  publishedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return false;
  return t <= now.getTime();
}

/**
 * Filtros Supabase para lecturas públicas del blog.
 * Usar en listados, fichas, sitemap y APIs públicas.
 *
 * Tipado laxo a propósito: el genérico recursivo sobre PostgrestFilterBuilder
 * dispara "Type instantiation is excessively deep" en el build de Next/Vercel.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPublicBlogFilters<Q = any>(query: Q, now: Date = new Date()): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = query as any;
  return q
    .eq('is_published', true)
    .not('published_at', 'is', null)
    .lte('published_at', blogVisibleBeforeIso(now)) as Q;
}

/** Red de seguridad tras fetch (p. ej. caché o filas sin filtrar). */
export function filterPublicBlogArticles<T extends { published_at: string | null }>(
  articles: T[] | null | undefined,
  now: Date = new Date(),
): T[] {
  if (!articles?.length) return [];
  return articles.filter((a) => isBlogArticlePubliclyVisible(a.published_at, now));
}
