// /sitemap.xml — Dynamic sitemap generator (siempre URLs de producción)
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { createStaticSupabase } from '@/lib/supabase/server';
import { getCenterProvinces, getDestinationsWithRetreats } from '@/lib/data';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = getSiteUrl();
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // ── Static pages ──────────────────────────────────────────────────────
  const esPages = [
    { path: '/es', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/es/buscar', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/es/centros-retiru', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/es/tienda', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/es/retiros-retiru', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/es/destinos', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/es/para-organizadores', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/es/ayuda', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/es/sobre-nosotros', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/es/contacto', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/es/blog', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/es/condiciones', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/es/legal/terminos', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/es/legal/privacidad', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/es/legal/cookies', priority: 0.2, changeFrequency: 'yearly' as const },
  ];

  const enPages = [
    { path: '/en', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/en/search', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/en/centers-retiru', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/en/shop', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/en/retreats-retiru', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/en/destinations', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/en/for-organizers', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/en/help', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/en/about', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/en/contact', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/en/blog', priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  const staticEntries = [...esPages, ...enPages].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        es: `${SITE_URL}${path.replace('/en', '/es').replace('/search', '/buscar').replace('/centers-retiru', '/centros-retiru').replace('/shop', '/tienda').replace('/retreats-retiru', '/retiros-retiru').replace('/destinations', '/destinos').replace('/for-organizers', '/para-organizadores').replace('/help', '/ayuda').replace('/about', '/sobre-nosotros').replace('/contact', '/contacto')}`,
        en: `${SITE_URL}${path.replace('/es', '/en').replace('/buscar', '/search').replace('/centros-retiru', '/centers-retiru').replace('/tienda', '/shop').replace('/retiros-retiru', '/retreats-retiru').replace('/destinos', '/destinations').replace('/para-organizadores', '/for-organizers').replace('/ayuda', '/help').replace('/sobre-nosotros', '/about').replace('/contacto', '/contact')}`,
      },
    },
  }));

  // ── Dynamic entries from Supabase (ES + EN por cada slug) ──────────────
  const supabase = createStaticSupabase();
  const dynamicEntries: MetadataRoute.Sitemap = [];

  function pushBilingual(esPath: string, enPath: string, freq: MetadataRoute.Sitemap[0]['changeFrequency'], prio: number) {
    const alt = { languages: { es: `${SITE_URL}${esPath}`, en: `${SITE_URL}${enPath}` } };
    dynamicEntries.push(
      { url: `${SITE_URL}${esPath}`, lastModified: now, changeFrequency: freq, priority: prio, alternates: alt },
      { url: `${SITE_URL}${enPath}`, lastModified: now, changeFrequency: freq, priority: prio, alternates: alt },
    );
  }

  // 1) Centros individuales
  const { data: centerSlugs } = await supabase.from('centers').select('slug').eq('status', 'active');
  (centerSlugs || []).forEach((c) => pushBilingual(`/es/centro/${c.slug}`, `/en/center/${c.slug}`, 'weekly', 0.7));

  // 2) Centros por provincia — solo provincias con >= 1 centro
  const provinces = await getCenterProvinces();
  provinces.forEach((p) => pushBilingual(`/es/centros-retiru/${p.slug}`, `/en/centers-retiru/${p.slug}`, 'weekly', 0.8));

  // 3) Retiros individuales
  const { data: retreatSlugs } = await supabase.from('retreats').select('slug').eq('status', 'published').gte('end_date', today);
  (retreatSlugs || []).forEach((r) => pushBilingual(`/es/retiro/${r.slug}`, `/en/retreat/${r.slug}`, 'weekly', 0.8));

  // 4) Retiros por destino — solo destinos con >= 1 retiro
  const destinationsWithRetreats = await getDestinationsWithRetreats();
  destinationsWithRetreats.forEach((d) => pushBilingual(`/es/retiros-retiru/${d.slug}`, `/en/retreats-retiru/${d.slug}`, 'weekly', 0.8));

  // 5) Blog
  const { data: blogSlugs } = await supabase.from('blog_articles').select('slug').eq('is_published', true);
  (blogSlugs || []).forEach((b) => pushBilingual(`/es/blog/${b.slug}`, `/en/blog/${b.slug}`, 'monthly', 0.6));

  // 6) Destinos
  const { data: destSlugs } = await supabase.from('destinations').select('slug').eq('is_active', true);
  (destSlugs || []).forEach((d) => pushBilingual(`/es/destinos/${d.slug}`, `/en/destinations/${d.slug}`, 'monthly', 0.7));

  // 7) Organizadores verificados
  const { data: orgSlugs } = await supabase.from('organizer_profiles').select('slug').eq('status', 'verified');
  (orgSlugs || []).forEach((o) => pushBilingual(`/es/organizador/${o.slug}`, `/en/organizer/${o.slug}`, 'monthly', 0.5));

  // 8) Productos de la tienda
  const { data: prodSlugs } = await supabase.from('products').select('slug').eq('status', 'active');
  (prodSlugs || []).forEach((p) => pushBilingual(`/es/tienda/${p.slug}`, `/en/shop/${p.slug}`, 'weekly', 0.6));

  return [...staticEntries, ...dynamicEntries];
}
