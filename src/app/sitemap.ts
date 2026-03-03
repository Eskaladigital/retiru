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

  // ── Dynamic entries from Supabase ─────────────────────────────────────
  const supabase = createStaticSupabase();
  const dynamicEntries: MetadataRoute.Sitemap = [];

  // 1) Centros individuales (/es/centro/[slug])
  const { data: centerSlugs } = await supabase.from('centers').select('slug').eq('status', 'active');
  (centerSlugs || []).forEach((c) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/centro/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { es: `${SITE_URL}/es/centro/${c.slug}`, en: `${SITE_URL}/en/center/${c.slug}` } },
    });
  });

  // 2) Centros por provincia (/es/centros-retiru/[slug]) — solo provincias con >= 1 centro activo
  const provinces = await getCenterProvinces();
  provinces.forEach((p) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/centros-retiru/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: { es: `${SITE_URL}/es/centros-retiru/${p.slug}`, en: `${SITE_URL}/en/centers-retiru/${p.slug}` } },
    });
  });

  // 3) Retiros individuales (/es/retiro/[slug])
  const { data: retreatSlugs } = await supabase.from('retreats').select('slug').eq('status', 'published').gte('end_date', today);
  (retreatSlugs || []).forEach((r) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/retiro/${r.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: { es: `${SITE_URL}/es/retiro/${r.slug}`, en: `${SITE_URL}/en/retreat/${r.slug}` } },
    });
  });

  // 4) Retiros por destino (/es/retiros-retiru/[slug]) — solo destinos con >= 1 retiro publicado
  const destinationsWithRetreats = await getDestinationsWithRetreats();
  destinationsWithRetreats.forEach((d) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/retiros-retiru/${d.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: { es: `${SITE_URL}/es/retiros-retiru/${d.slug}`, en: `${SITE_URL}/en/retreats-retiru/${d.slug}` } },
    });
  });

  // 5) Blog
  const { data: blogSlugs } = await supabase.from('blog_articles').select('slug').eq('is_published', true);
  (blogSlugs || []).forEach((b) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/blog/${b.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: { languages: { es: `${SITE_URL}/es/blog/${b.slug}`, en: `${SITE_URL}/en/blog/${b.slug}` } },
    });
  });

  // 6) Destinos
  const { data: destSlugs } = await supabase.from('destinations').select('slug').eq('is_active', true);
  (destSlugs || []).forEach((d) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/destinos/${d.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: { languages: { es: `${SITE_URL}/es/destinos/${d.slug}`, en: `${SITE_URL}/en/destinations/${d.slug}` } },
    });
  });

  // 7) Organizadores verificados
  const { data: orgSlugs } = await supabase.from('organizer_profiles').select('slug').eq('status', 'verified');
  (orgSlugs || []).forEach((o) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/organizador/${o.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: { es: `${SITE_URL}/es/organizador/${o.slug}`, en: `${SITE_URL}/en/organizer/${o.slug}` } },
    });
  });

  // 8) Productos de la tienda
  const { data: prodSlugs } = await supabase.from('products').select('slug').eq('status', 'active');
  (prodSlugs || []).forEach((p) => {
    dynamicEntries.push({
      url: `${SITE_URL}/es/tienda/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: { languages: { es: `${SITE_URL}/es/tienda/${p.slug}`, en: `${SITE_URL}/en/shop/${p.slug}` } },
    });
  });

  return [...staticEntries, ...dynamicEntries];
}
