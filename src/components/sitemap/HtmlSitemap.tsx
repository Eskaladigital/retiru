// HTML sitemap compartido (ES/EN). Página interna no linkada desde el footer,
// con noindex para no competir con /sitemap.xml en buscadores.
import Link from 'next/link';
import { createStaticSupabase } from '@/lib/supabase/server';
import {
  getCenterProvinces,
  getDestinationsWithRetreats,
  getCategoriesWithRetreats,
  getCategoryDestinationPairs,
  getCenterTypeProvincePairs,
  getCenterTypeProvinceCityTriples,
  getStyleProvincePairs,
} from '@/lib/data';
import { CATEGORY_SLUG_EN, getCenterTypeLabel } from '@/lib/utils';

type Locale = 'es' | 'en';

interface Strings {
  title: string;
  subtitle: string;
  groups: {
    staticPages: string;
    centerTypes: string;
    centerTypeProvince: string;
    centerTypeProvinceCity: string;
    centerTypeStyle: string;
    centerTypeStyleProvince: string;
    centerProvinces: string;
    centers: string;
    retreatCategories: string;
    retreatCategoryDestination: string;
    retreatDestinations: string;
    retreats: string;
    blog: string;
    destinations: string;
    organizers: string;
    shop: string;
  };
  note: string;
}

const STRINGS_ES: Strings = {
  title: 'Mapa del sitio',
  subtitle: 'Índice completo de páginas indexables de Retiru. Esta página es interna (no se muestra en el footer) y tiene noindex para no competir con sitemap.xml.',
  groups: {
    staticPages: 'Páginas estáticas',
    centerTypes: 'Centros por tipo',
    centerTypeProvince: 'Centros por tipo y provincia',
    centerTypeProvinceCity: 'Centros por tipo, provincia y ciudad/barrio',
    centerTypeStyle: 'Centros por tipo y estilo (nacional)',
    centerTypeStyleProvince: 'Centros por tipo, estilo y provincia',
    centerProvinces: 'Hub provincial multi-disciplina',
    centers: 'Fichas de centros',
    retreatCategories: 'Retiros por categoría',
    retreatCategoryDestination: 'Retiros por categoría + destino',
    retreatDestinations: 'Retiros por destino',
    retreats: 'Fichas de retiros',
    blog: 'Blog',
    destinations: 'Destinos',
    organizers: 'Organizadores verificados',
    shop: 'Tienda',
  },
  note: 'Fuente canónica: /sitemap.xml (XML dinámico). Esta vista HTML se regenera cada hora.',
};

const STRINGS_EN: Strings = {
  title: 'Sitemap',
  subtitle: 'Full index of indexable Retiru pages. Internal page (not linked in footer) with noindex so it does not compete with /sitemap.xml.',
  groups: {
    staticPages: 'Static pages',
    centerTypes: 'Centers by type',
    centerTypeProvince: 'Centers by type and province',
    centerTypeProvinceCity: 'Centers by type, province and city/district',
    centerTypeStyle: 'Centers by type and style (national)',
    centerTypeStyleProvince: 'Centers by type, style and province',
    centerProvinces: 'Multi-discipline province hub',
    centers: 'Center pages',
    retreatCategories: 'Retreats by category',
    retreatCategoryDestination: 'Retreats by category + destination',
    retreatDestinations: 'Retreats by destination',
    retreats: 'Retreat pages',
    blog: 'Blog',
    destinations: 'Destinations',
    organizers: 'Verified organizers',
    shop: 'Shop',
  },
  note: 'Canonical source: /sitemap.xml (dynamic XML). This HTML view is regenerated every hour.',
};

const STATIC_PAGES_ES: { path: string; label: string }[] = [
  { path: '/es', label: 'Inicio' },
  { path: '/es/buscar', label: 'Buscar' },
  { path: '/es/centros-retiru', label: 'Centros' },
  { path: '/es/retiros-retiru', label: 'Retiros' },
  { path: '/es/destinos', label: 'Destinos' },
  { path: '/es/tienda', label: 'Tienda' },
  { path: '/es/blog', label: 'Blog' },
  { path: '/es/para-asistentes', label: 'Para asistentes' },
  { path: '/es/para-organizadores', label: 'Para organizadores' },
  { path: '/es/ayuda', label: 'Ayuda' },
  { path: '/es/sobre-nosotros', label: 'Sobre nosotros' },
  { path: '/es/contacto', label: 'Contacto' },
  { path: '/es/condiciones', label: 'Condiciones' },
  { path: '/es/legal/terminos', label: 'Términos' },
  { path: '/es/legal/privacidad', label: 'Privacidad' },
  { path: '/es/legal/cookies', label: 'Cookies' },
];

const STATIC_PAGES_EN: { path: string; label: string }[] = [
  { path: '/en', label: 'Home' },
  { path: '/en/search', label: 'Search' },
  { path: '/en/centers-retiru', label: 'Centers' },
  { path: '/en/retreats-retiru', label: 'Retreats' },
  { path: '/en/destinations', label: 'Destinations' },
  { path: '/en/shop', label: 'Shop' },
  { path: '/en/blog', label: 'Blog' },
  { path: '/en/for-attendees', label: 'For attendees' },
  { path: '/en/for-organizers', label: 'For organizers' },
  { path: '/en/help', label: 'Help' },
  { path: '/en/about', label: 'About' },
  { path: '/en/contact', label: 'Contact' },
  { path: '/en/condiciones', label: 'Conditions' },
  { path: '/en/legal/terminos', label: 'Terms' },
  { path: '/en/legal/privacidad', label: 'Privacy' },
  { path: '/en/legal/cookies', label: 'Cookies' },
];

const TYPE_ES_MAP: Record<string, string> = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };

export const revalidate = 3600;

export default async function HtmlSitemap({ locale }: { locale: Locale }) {
  const t = locale === 'es' ? STRINGS_ES : STRINGS_EN;
  const staticPages = locale === 'es' ? STATIC_PAGES_ES : STATIC_PAGES_EN;
  const prefix = locale === 'es' ? '/es' : '/en';
  const supabase = createStaticSupabase();

  const [
    { data: centers },
    { data: retreats },
    { data: blog },
    { data: dests },
    { data: orgs },
    { data: prods },
    centerProvinces,
    typeProvPairs,
    destWithRetreats,
    categoriesWithRetreats,
    catDestPairs,
  ] = await Promise.all([
    supabase.from('centers').select('slug, name, province').eq('status', 'active').order('name'),
    supabase
      .from('retreats')
      .select('slug, title_es, title_en')
      .eq('status', 'published')
      .gte('end_date', new Date().toISOString().slice(0, 10))
      .order('title_es'),
    supabase.from('blog_articles').select('slug, slug_en, title_es, title_en').eq('is_published', true).order('published_at', { ascending: false }),
    supabase.from('destinations').select('slug, name_es, name_en').eq('is_active', true).order('name_es'),
    supabase.from('organizer_profiles').select('slug, name').eq('status', 'verified').order('name'),
    supabase.from('products').select('slug, name_es, name_en').eq('status', 'active').order('name_es'),
    getCenterProvinces(),
    getCenterTypeProvincePairs(),
    getDestinationsWithRetreats(),
    getCategoriesWithRetreats(),
    getCategoryDestinationPairs(),
  ]);

  const [typeProvCityTriples, stylePairsRaw] = await Promise.all([
    getCenterTypeProvinceCityTriples(2),
    getStyleProvincePairs(5),
  ]);

  // Totales nacionales por estilo (para listar estilos nacionales por tipo)
  const styleTotals = new Map<string, { centerType: string; styleSlug: string; count: number }>();
  for (const p of stylePairsRaw) {
    const key = `${p.centerType}|${p.styleSlug}`;
    const entry = styleTotals.get(key) || { centerType: p.centerType, styleSlug: p.styleSlug, count: 0 };
    entry.count += p.count;
    styleTotals.set(key, entry);
  }
  const sortedStyleNational = Array.from(styleTotals.values())
    .filter((t) => t.count >= 3)
    .sort((a, b) => (a.centerType === b.centerType ? a.styleSlug.localeCompare(b.styleSlug) : a.centerType.localeCompare(b.centerType)));
  const sortedStyleProv = [...stylePairsRaw].sort((a, b) => {
    if (a.centerType !== b.centerType) return a.centerType.localeCompare(b.centerType);
    if (a.styleSlug !== b.styleSlug) return a.styleSlug.localeCompare(b.styleSlug);
    return a.provinceName.localeCompare(b.provinceName);
  });

  const centerTypeUrls = (['yoga', 'meditation', 'ayurveda'] as const).map((type) => {
    const esSlug = TYPE_ES_MAP[type] || type;
    const path = locale === 'es' ? `/es/centros/${esSlug}` : `/en/centers/${type}`;
    return { path, label: getCenterTypeLabel(type, locale) };
  });

  const sortedTypeProv = [...typeProvPairs].sort((a, b) =>
    a.type === b.type ? a.provinceName.localeCompare(b.provinceName) : a.type.localeCompare(b.type),
  );

  const sortedTypeProvCity = [...typeProvCityTriples].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.provinceName !== b.provinceName) return a.provinceName.localeCompare(b.provinceName);
    return a.cityName.localeCompare(b.cityName);
  });

  return (
    <div className="container-wide py-10">
      <header className="mb-10 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">{t.title}</h1>
        <p className="text-[#7a6b5d] leading-relaxed">{t.subtitle}</p>
        <p className="text-xs text-[#a09383] mt-2">
          {t.note}{' '}
          <Link href="/sitemap.xml" className="underline hover:text-terracotta-600" target="_blank" rel="noopener">
            /sitemap.xml
          </Link>
        </p>
      </header>

      <Group title={t.groups.staticPages} count={staticPages.length} openByDefault>
        <LinkList items={staticPages.map((p) => ({ href: p.path, label: p.label }))} />
      </Group>

      <Group title={t.groups.centerTypes} count={centerTypeUrls.length} openByDefault>
        <LinkList items={centerTypeUrls.map((p) => ({ href: p.path, label: p.label }))} />
      </Group>

      <Group title={t.groups.centerTypeProvince} count={sortedTypeProv.length}>
        <LinkList
          items={sortedTypeProv.map((p) => {
            const esSlug = TYPE_ES_MAP[p.type] || p.type;
            const href = locale === 'es' ? `/es/centros/${esSlug}/${p.province}` : `/en/centers/${p.type}/${p.province}`;
            return { href, label: `${getCenterTypeLabel(p.type, locale)} · ${p.provinceName}` };
          })}
        />
      </Group>

      <Group title={t.groups.centerTypeProvinceCity} count={sortedTypeProvCity.length}>
        <LinkList
          items={sortedTypeProvCity.map((p) => {
            const esSlug = TYPE_ES_MAP[p.type] || p.type;
            const href =
              locale === 'es'
                ? `/es/centros/${esSlug}/${p.provinceSlug}/${p.citySlug}`
                : `/en/centers/${p.type}/${p.provinceSlug}/${p.citySlug}`;
            return {
              href,
              label: `${getCenterTypeLabel(p.type, locale)} · ${p.provinceName} › ${p.cityName} (${p.count})`,
            };
          })}
        />
      </Group>

      <Group title={t.groups.centerTypeStyle} count={sortedStyleNational.length}>
        <LinkList
          items={sortedStyleNational.map((s) => {
            const esSlug = TYPE_ES_MAP[s.centerType] || s.centerType;
            const href =
              locale === 'es'
                ? `/es/centros/${esSlug}/estilo/${s.styleSlug}`
                : `/en/centers/${s.centerType}/style/${s.styleSlug}`;
            return {
              href,
              label: `${getCenterTypeLabel(s.centerType, locale)} · ${s.styleSlug} (${s.count})`,
            };
          })}
        />
      </Group>

      <Group title={t.groups.centerTypeStyleProvince} count={sortedStyleProv.length}>
        <LinkList
          items={sortedStyleProv.map((s) => {
            const esSlug = TYPE_ES_MAP[s.centerType] || s.centerType;
            const href =
              locale === 'es'
                ? `/es/centros/${esSlug}/estilo/${s.styleSlug}/${s.provinceSlug}`
                : `/en/centers/${s.centerType}/style/${s.styleSlug}/${s.provinceSlug}`;
            return {
              href,
              label: `${getCenterTypeLabel(s.centerType, locale)} · ${s.styleSlug} › ${s.provinceName} (${s.count})`,
            };
          })}
        />
      </Group>

      <Group title={t.groups.centerProvinces} count={centerProvinces.length}>
        <LinkList
          items={centerProvinces.map((p) => ({
            href: `${prefix}${locale === 'es' ? '/provincias' : '/provinces'}/${p.slug}`,
            label: p.name,
          }))}
        />
      </Group>

      <Group title={t.groups.centers} count={(centers || []).length}>
        <LinkList
          items={(centers || []).map((c: { slug: string; name: string; province: string | null }) => ({
            href: locale === 'es' ? `/es/centro/${c.slug}` : `/en/center/${c.slug}`,
            label: c.province ? `${c.name} — ${c.province}` : c.name,
          }))}
        />
      </Group>

      <Group title={t.groups.retreatCategories} count={categoriesWithRetreats.length} openByDefault>
        <LinkList
          items={categoriesWithRetreats.map((c) => {
            const enSlug = CATEGORY_SLUG_EN[c.slug] || c.slug;
            const href = locale === 'es' ? `/es/retiros-${c.slug}` : `/en/retreats-${enSlug}`;
            return { href, label: locale === 'es' ? c.name_es : c.name_en };
          })}
        />
      </Group>

      <Group title={t.groups.retreatCategoryDestination} count={catDestPairs.length}>
        <LinkList
          items={catDestPairs.map((p) => {
            const enSlug = CATEGORY_SLUG_EN[p.category] || p.category;
            const href =
              locale === 'es'
                ? `/es/retiros-${p.category}/${p.destination}`
                : `/en/retreats-${enSlug}/${p.destination}`;
            return { href, label: `${p.category} · ${p.destination}` };
          })}
        />
      </Group>

      <Group title={t.groups.retreatDestinations} count={destWithRetreats.length}>
        <LinkList
          items={destWithRetreats.map((d) => ({
            href: locale === 'es' ? `/es/retiros-retiru/${d.slug}` : `/en/retreats-retiru/${d.slug}`,
            label: locale === 'es' ? d.name_es : d.name_en,
          }))}
        />
      </Group>

      <Group title={t.groups.retreats} count={(retreats || []).length}>
        <LinkList
          items={(retreats || []).map((r: { slug: string; title_es: string; title_en: string | null }) => ({
            href: locale === 'es' ? `/es/retiro/${r.slug}` : `/en/retreat/${r.slug}`,
            label: (locale === 'es' ? r.title_es : r.title_en || r.title_es) || r.slug,
          }))}
        />
      </Group>

      <Group title={t.groups.blog} count={(blog || []).length}>
        <LinkList
          items={(blog || []).map((b: { slug: string; slug_en: string | null; title_es: string; title_en: string | null }) => ({
            href:
              locale === 'es'
                ? `/es/blog/${b.slug}`
                : `/en/blog/${b.slug_en || b.slug}`,
            label: (locale === 'es' ? b.title_es : b.title_en || b.title_es) || b.slug,
          }))}
        />
      </Group>

      <Group title={t.groups.destinations} count={(dests || []).length}>
        <LinkList
          items={(dests || []).map((d: { slug: string; name_es: string; name_en: string | null }) => ({
            href: locale === 'es' ? `/es/destinos/${d.slug}` : `/en/destinations/${d.slug}`,
            label: (locale === 'es' ? d.name_es : d.name_en || d.name_es) || d.slug,
          }))}
        />
      </Group>

      <Group title={t.groups.organizers} count={(orgs || []).length}>
        <LinkList
          items={(orgs || []).map((o: { slug: string; name: string | null }) => ({
            href: locale === 'es' ? `/es/organizador/${o.slug}` : `/en/organizer/${o.slug}`,
            label: o.name || o.slug,
          }))}
        />
      </Group>

      <Group title={t.groups.shop} count={(prods || []).length}>
        <LinkList
          items={(prods || []).map((p: { slug: string; name_es: string; name_en: string | null }) => ({
            href: locale === 'es' ? `/es/tienda/${p.slug}` : `/en/shop/${p.slug}`,
            label: (locale === 'es' ? p.name_es : p.name_en || p.name_es) || p.slug,
          }))}
        />
      </Group>
    </div>
  );
}

function Group({
  title,
  count,
  openByDefault,
  children,
}: {
  title: string;
  count: number;
  openByDefault?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group mb-4 bg-white border border-sand-200 rounded-xl overflow-hidden" open={openByDefault}>
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-sand-50">
        <span className="font-serif text-lg text-foreground">{title}</span>
        <span className="text-sm text-[#a09383] tabular-nums">
          {count}
          <svg
            className="inline-block w-4 h-4 ml-2 text-[#a09383] transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-sand-200 p-4 bg-sand-50/40">{children}</div>
    </details>
  );
}

function LinkList({ items }: { items: { href: string; label: string }[] }) {
  if (items.length === 0) return <p className="text-sm text-[#a09383]">—</p>;
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
      {items.map((it) => (
        <li key={it.href} className="truncate">
          <Link href={it.href} className="text-foreground hover:text-terracotta-600" title={it.label}>
            {it.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
