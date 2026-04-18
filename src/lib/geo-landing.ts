// Helper para resolver nodos geográficos de `destinations`
// (país / comunidad autónoma / provincia) y agregar hijos + descendientes.
//
// Devuelve ya calculados los slugs hoja (destinos) para que la landing
// pueda hacer una sola query "IN (...)" sobre retreats.destination_id.

import { createServerSupabase } from '@/lib/supabase/server';

export type GeoKind = 'country' | 'region' | 'province' | 'destination';

export type GeoNode = {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  kind: GeoKind;
  country: string | null;
  region: string | null;
  intro_es: string | null;
  intro_en: string | null;
  cover_image_url: string | null;
  faq: Array<{ question: string; answer: string }>;
  /** Nodos hijos directos (country → regions, region → provinces|destinations, province → destinations) */
  children: Array<{ slug: string; name_es: string; name_en: string; kind: GeoKind }>;
  /** Slugs de destinos hoja descendientes (para filtrar retreats por destination_id) */
  descendantDestinationSlugs: string[];
  /** Migas de pan desde país hasta el nodo actual */
  breadcrumb: Array<{ slug: string; name: string; current?: boolean }>;
  /** Texto usado en centers.country cuando hay que filtrar por país (ej. 'España') */
  centersCountryText: string | null;
};

// Mapeo ISO (destinations.country) → texto usado en centers.country
const COUNTRY_ISO_TO_TEXT: Record<string, string> = {
  ES: 'España',
  MA: 'Marruecos',
  PT: 'Portugal',
  FR: 'Francia',
  IT: 'Italia',
};

/**
 * Resuelve un slug a su nodo geográfico con hijos y descendientes.
 * Devuelve null si el slug no existe o si kind === 'destination'
 * (ese caso ya lo cubre la ruta /es/retiros-retiru/[slug]).
 */
export async function resolveGeoLanding(slug: string): Promise<GeoNode | null> {
  const supabase = await createServerSupabase();

  const { data: row, error } = await supabase
    .from('destinations')
    .select('id, slug, name_es, name_en, kind, country, region, parent_slug, intro_es, intro_en, cover_image_url, faq')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !row) return null;
  if (row.kind === 'destination') return null;

  // Hijos directos
  const { data: childrenRows } = await supabase
    .from('destinations')
    .select('slug, name_es, name_en, kind, sort_order')
    .eq('parent_slug', slug)
    .eq('is_active', true)
    .order('kind')
    .order('name_es');

  const children = (childrenRows || []).map((c) => ({
    slug: c.slug,
    name_es: c.name_es,
    name_en: c.name_en,
    kind: c.kind as GeoKind,
  }));

  // Descendientes hoja (BFS)
  const descendantDestinationSlugs = await collectDestinationDescendants(slug);

  // Breadcrumb (sube por parent_slug)
  const breadcrumb = await buildBreadcrumb(row.slug, row.name_es, row.parent_slug);

  return {
    id: row.id,
    slug: row.slug,
    name_es: row.name_es,
    name_en: row.name_en,
    kind: row.kind as GeoKind,
    country: row.country,
    region: row.region,
    intro_es: row.intro_es,
    intro_en: row.intro_en,
    cover_image_url: row.cover_image_url,
    faq: Array.isArray(row.faq) ? row.faq : [],
    children,
    descendantDestinationSlugs,
    breadcrumb,
    centersCountryText: row.country ? (COUNTRY_ISO_TO_TEXT[row.country] || null) : null,
  };
}

async function collectDestinationDescendants(rootSlug: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const out: string[] = [];
  let frontier = [rootSlug];
  // Profundidad máxima razonable: país → CCAA → provincia → destino (4)
  for (let depth = 0; depth < 5 && frontier.length > 0; depth++) {
    const { data } = await supabase
      .from('destinations')
      .select('slug, kind')
      .in('parent_slug', frontier)
      .eq('is_active', true);
    const next: string[] = [];
    for (const r of data || []) {
      if (r.kind === 'destination') out.push(r.slug);
      else next.push(r.slug);
    }
    frontier = next;
  }
  return out;
}

async function buildBreadcrumb(
  slug: string,
  name: string,
  parentSlug: string | null,
): Promise<Array<{ slug: string; name: string; current?: boolean }>> {
  const supabase = await createServerSupabase();
  const crumbs: Array<{ slug: string; name: string; current?: boolean }> = [
    { slug, name, current: true },
  ];
  let parent = parentSlug;
  for (let i = 0; i < 4 && parent; i++) {
    const { data } = await supabase
      .from('destinations')
      .select('slug, name_es, parent_slug')
      .eq('slug', parent)
      .maybeSingle();
    if (!data) break;
    crumbs.unshift({ slug: data.slug, name: data.name_es });
    parent = (data as any).parent_slug;
  }
  return crumbs;
}
