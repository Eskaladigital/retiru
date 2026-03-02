// /sitemap.xml — Dynamic sitemap generator
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retiru.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages — ES
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

  // Static pages — EN
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

  // TODO: Dynamically generate from Supabase:
  // - /es/retiro/[slug]  &  /en/retreat/[slug]
  // - /es/centros-retiru/[slug]  &  /en/centers-retiru/[slug]
  // - /es/tienda/[slug]   &  /en/shop/[slug]
  // - /es/retiros-retiru/[slug]  &  /en/retreats-retiru/[slug]
  // - /es/destinos/[slug]  &  /en/destinations/[slug]
  // - /es/organizador/[slug]  &  /en/organizer/[slug]
  // - /es/blog/[slug]  &  /en/blog/[slug]

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

  return staticEntries;
}
