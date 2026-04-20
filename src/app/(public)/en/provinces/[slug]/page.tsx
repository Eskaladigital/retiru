// /en/provinces/[slug] — Unified geographic hub by province (multi-discipline).
// Mirror of /es/provincias/[slug].
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star, CalendarDays, BookOpen } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import {
  getCenterProvinces,
  getCentersByProvince,
  getCenterTypeProvinceSeo,
  getUpcomingRetreatsForDestinations,
  getBlogArticlesMentioning,
} from '@/lib/data';
import { resolveGeoLanding } from '@/lib/geo-landing';
import {
  generatePageMetadata,
  jsonLdBreadcrumb,
  jsonLdFAQ,
  jsonLdScript,
} from '@/lib/seo';

export const revalidate = 3600;

const DISCIPLINES: Array<{ type: 'yoga' | 'meditation' | 'ayurveda'; label: string }> = [
  { type: 'yoga', label: 'Yoga' },
  { type: 'meditation', label: 'Meditation' },
  { type: 'ayurveda', label: 'Ayurveda' },
];

export async function generateStaticParams() {
  const provinces = await getCenterProvinces();
  return provinces.map((p) => ({ slug: p.slug }));
}

async function resolveProvincePayload(slug: string) {
  const { centers, provinceName } = await getCentersByProvince(slug);
  const geo = await resolveGeoLanding(slug);
  return { centers, provinceName: provinceName || geo?.name_en || null, geo };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { centers, provinceName } = await resolveProvincePayload(slug);
  if (!provinceName) return {};

  return generatePageMetadata({
    title: `Yoga, meditation and ayurveda in ${provinceName} | Retiru`,
    description:
      `Full wellness directory in ${provinceName}: ${centers.length} verified yoga, meditation and ayurveda centers, upcoming retreats and local guide.`,
    locale: 'en',
    path: `/en/provinces/${slug}`,
    altPath: `/es/provincias/${slug}`,
    keywords: [
      `wellness ${provinceName}`,
      `yoga ${provinceName}`,
      `meditation ${provinceName}`,
      `ayurveda ${provinceName}`,
      'retreats',
      'retiru',
    ],
    noIndex: centers.length === 0,
  });
}

export default async function ProvinceHubPageEN({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { centers, provinceName, geo } = await resolveProvincePayload(slug);
  if (!provinceName) notFound();

  const centersByType = new Map<string, typeof centers>();
  for (const c of centers) {
    if (!c.type) continue;
    const list = centersByType.get(c.type) || [];
    list.push(c);
    centersByType.set(c.type, list);
  }

  const dominantType = DISCIPLINES
    .map((d) => ({ ...d, count: centersByType.get(d.type)?.length || 0 }))
    .sort((a, b) => b.count - a.count)
    .find((d) => d.count > 0);

  const faqSeo = dominantType ? await getCenterTypeProvinceSeo(dominantType.type, slug) : null;
  const faqs = Array.isArray(faqSeo?.faq_en) ? faqSeo!.faq_en.filter((q) => q.question && q.answer) : [];

  const destinationSlugs = geo?.descendantDestinationSlugs || [];
  const [retreats, blogPosts] = await Promise.all([
    destinationSlugs.length ? getUpcomingRetreatsForDestinations(destinationSlugs, 4) : Promise.resolve([]),
    getBlogArticlesMentioning(provinceName, 'en', 3),
  ]);

  const heroImage = geo?.cover_image_url;

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <>
              <Image src={heroImage} alt={`Wellness in ${provinceName}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <p className="text-sm font-semibold text-terracotta-700 uppercase tracking-wider mb-2">Province</p>
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Yoga, meditation and ayurveda in {provinceName}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {centers.length} verified center{centers.length !== 1 ? 's' : ''} in {provinceName}
              {retreats.length > 0 ? ` · ${retreats.length} upcoming retreat${retreats.length > 1 ? 's' : ''}` : ''}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch locale="en" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link href="/en" className="hover:text-terracotta-600">Home</Link>
          <span>/</span>
          <Link href="/en/centers-retiru" className="hover:text-terracotta-600">Provinces</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{provinceName}</span>
        </nav>

        {geo?.intro_en && (
          <div
            className="prose prose-sand max-w-3xl mb-10"
            dangerouslySetInnerHTML={{ __html: geo.intro_en.replace(/\n/g, '<br/>') }}
          />
        )}

        <section className="mb-14 space-y-10">
          {DISCIPLINES.map((d) => {
            const list = centersByType.get(d.type) || [];
            if (list.length === 0) return null;
            const preview = list.slice(0, 3);
            return (
              <div key={d.type}>
                <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                  <h2 className="font-serif text-2xl text-foreground">
                    {d.label} in {provinceName}{' '}
                    <span className="text-sm font-normal text-[#a09383]">· {list.length} center{list.length !== 1 ? 's' : ''}</span>
                  </h2>
                  {list.length > preview.length && (
                    <Link
                      href={`/en/centers/${d.type}/${slug}`}
                      className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
                    >
                      See all {list.length} {d.label.toLowerCase()} centers →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preview.map((c) => {
                    const img = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
                    return (
                      <Link
                        key={c.id}
                        href={`/en/center/${c.slug}`}
                        className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                      >
                        <div className="relative w-full h-40 bg-sand-100">
                          {img ? (
                            <Image src={img} alt={c.name} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-sand-300">🏢</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif text-base leading-tight group-hover:text-terracotta-600 transition-colors mb-1.5 line-clamp-2">{c.name}</h3>
                          <div className="flex items-center justify-between gap-2 text-xs text-[#7a6b5d]">
                            <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {c.city}</span>
                            {(c.avg_rating ?? 0) > 0 && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                {c.avg_rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {retreats.length > 0 && (
          <section className="mb-14">
            <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
              <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
                <CalendarDays className="text-terracotta-600" size={22} /> Upcoming retreats in {provinceName}
              </h2>
              <Link href="/en/retreats" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
                See all retreats →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {retreats.map((r) => {
                const img = (Array.isArray(r.images) && r.images.find((i: any) => i.is_cover)?.url) || r.images?.[0]?.url;
                const title = r.title_en || r.title_es;
                return (
                  <Link
                    key={r.id}
                    href={`/en/retreats/${r.slug}`}
                    className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                  >
                    <div className="relative w-full h-36 bg-sand-100">
                      {img ? (
                        <Image src={img} alt={title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-sand-300">🧘</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-sm leading-tight group-hover:text-terracotta-600 transition-colors mb-1 line-clamp-2">{title}</h3>
                      <p className="text-xs text-[#7a6b5d] flex items-center gap-1">
                        <CalendarDays size={11} /> {new Date(r.start_date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {blogPosts.length > 0 && (
          <section className="mb-14">
            <h2 className="font-serif text-2xl text-foreground flex items-center gap-2 mb-4">
              <BookOpen className="text-terracotta-600" size={22} /> Blog articles about {provinceName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogPosts.map((p) => {
                const title = p.title_en || p.title_es;
                const excerpt = p.excerpt_en || p.excerpt_es;
                return (
                  <Link
                    key={p.id}
                    href={`/en/blog/${p.slug}`}
                    className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                  >
                    <div className="relative w-full h-36 bg-sand-100">
                      {p.cover_image_url ? (
                        <Image src={p.cover_image_url} alt={title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-sand-300">📖</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-sm leading-tight group-hover:text-terracotta-600 transition-colors mb-1.5 line-clamp-2">{title}</h3>
                      {excerpt && <p className="text-xs text-[#7a6b5d] line-clamp-2">{excerpt}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {faqs.length > 0 && dominantType && (
          <section className="mt-6 mb-4 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">
              Frequently asked questions about wellness in {provinceName}
            </h2>
            <p className="text-sm text-[#a09383] mb-4">
              Focused primarily on {dominantType.label.toLowerCase()}, the discipline with the largest presence in the province.
            </p>
            <div className="space-y-4">
              {faqs.map((item, i) => (
                <details key={i} className="group bg-white border border-sand-200 rounded-xl">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-foreground">
                    {item.question}
                    <svg className="w-5 h-5 text-[#a09383] shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{item.answer}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `Yoga, meditation and ayurveda in ${provinceName}`,
              description: `Wellness centers directory in ${provinceName}.`,
              about: {
                '@type': 'Place',
                name: provinceName,
                address: { '@type': 'PostalAddress', addressRegion: provinceName, addressCountry: 'ES' },
              },
              numberOfItems: centers.length,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(jsonLdBreadcrumb([
              { name: 'Home', url: '/en' },
              { name: 'Provinces', url: '/en/centers-retiru' },
              { name: provinceName, url: `/en/provinces/${slug}` },
            ])),
          }}
        />
        {faqs.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(faqs)) }} />
        )}
      </div>
    </>
  );
}
