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
 */
export function applyPublicBlogFilters<
  Q extends {
    eq: (column: string, value: unknown) => Q;
    not: (column: string, operator: string, value: unknown) => Q;
    lte: (column: string, value: string) => Q;
  },
>(query: Q, now: Date = new Date()): Q {
  return query
    .eq('is_published', true)
    .not('published_at', 'is', null)
    .lte('published_at', blogVisibleBeforeIso(now));
}

/** Red de seguridad tras fetch (p. ej. caché o filas sin filtrar). */
export function filterPublicBlogArticles<T extends { published_at: string | null }>(
  articles: T[] | null | undefined,
  now: Date = new Date(),
): T[] {
  if (!articles?.length) return [];
  return articles.filter((a) => isBlogArticlePubliclyVisible(a.published_at, now));
}
