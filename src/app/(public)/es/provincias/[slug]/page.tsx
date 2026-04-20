// /es/provincias/[slug] — Hub geográfico unificado multi-disciplina por provincia.
//
// Objetivo SEO: concentrar señales para queries generalistas ("bienestar Madrid",
// "wellness Barcelona", "yoga y ayurveda en Valencia") combinando:
//   - intro editorial (reusa destinations.intro_es si existe, fallback sintético)
//   - top-N centros por disciplina (yoga, meditación, ayurveda)
//   - próximos retiros en la zona (retreats publicados con destinación descendiente)
//   - artículos del blog que mencionen la provincia
//   - FAQ local (reaprovecha la del tipo dominante en la provincia, tabla center_type_province_seo)
//
// Sustituye como canonical a /es/centros-retiru/[slug] para las provincias.
// /es/centros-retiru/[slug] redirige aquí con 308 cuando el nodo geo es provincia.
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

const DISCIPLINES: Array<{ type: 'yoga' | 'meditation' | 'ayurveda'; label: string; esSlug: string }> = [
  { type: 'yoga', label: 'Yoga', esSlug: 'yoga' },
  { type: 'meditation', label: 'Meditación', esSlug: 'meditacion' },
  { type: 'ayurveda', label: 'Ayurveda', esSlug: 'ayurveda' },
];

export async function generateStaticParams() {
  const provinces = await getCenterProvinces();
  return provinces.map((p) => ({ slug: p.slug }));
}

async function resolveProvincePayload(slug: string) {
  const { centers, provinceName } = await getCentersByProvince(slug);
  const geo = await resolveGeoLanding(slug);
  const effectiveName = provinceName || geo?.name_es || null;
  return { centers, provinceName: effectiveName, geo };
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
    title: `Centros de yoga, meditación y ayurveda en ${provinceName} | Retiru`,
    description:
      `Directorio completo de bienestar en ${provinceName}: ${centers.length} centros verificados de yoga, meditación y ayurveda, retiros en la zona y guía local.`,
    locale: 'es',
    path: `/es/provincias/${slug}`,
    altPath: `/en/provinces/${slug}`,
    keywords: [
      `bienestar ${provinceName}`,
      `yoga ${provinceName}`,
      `meditación ${provinceName}`,
      `ayurveda ${provinceName}`,
      'retiros',
      'retiru',
    ],
    noIndex: centers.length === 0,
  });
}

export default async function ProvinceHubPage({
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
  const faqs = Array.isArray(faqSeo?.faq_es) ? faqSeo!.faq_es.filter((q) => q.question && q.answer) : [];

  const destinationSlugs = geo?.descendantDestinationSlugs || [];
  const [retreats, blogPosts] = await Promise.all([
    destinationSlugs.length ? getUpcomingRetreatsForDestinations(destinationSlugs, 4) : Promise.resolve([]),
    getBlogArticlesMentioning(provinceName, 'es', 3),
  ]);

  const heroImage = geo?.cover_image_url;

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <>
              <Image src={heroImage} alt={`Bienestar en ${provinceName}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <p className="text-sm font-semibold text-terracotta-700 uppercase tracking-wider mb-2">Provincia</p>
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Yoga, meditación y ayurveda en {provinceName}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} verificado{centers.length !== 1 ? 's' : ''} en {provinceName}
              {retreats.length > 0 ? ` · ${retreats.length} retiro${retreats.length > 1 ? 's' : ''} próximo${retreats.length > 1 ? 's' : ''}` : ''}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap" aria-label="Migas de pan">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/centros-retiru" className="hover:text-terracotta-600">Provincias</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{provinceName}</span>
        </nav>

        {geo?.intro_es && (
          <div
            className="prose prose-sand max-w-3xl mb-10"
            dangerouslySetInnerHTML={{ __html: geo.intro_es.replace(/\n/g, '<br/>') }}
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
                    {d.label} en {provinceName}{' '}
                    <span className="text-sm font-normal text-[#a09383]">· {list.length} centro{list.length !== 1 ? 's' : ''}</span>
                  </h2>
                  {list.length > preview.length && (
                    <Link
                      href={`/es/centros/${d.esSlug}/${slug}`}
                      className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
                    >
                      Ver los {list.length} centros de {d.label.toLowerCase()} →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preview.map((c) => {
                    const img = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
                    return (
                      <Link
                        key={c.id}
                        href={`/es/centro/${c.slug}`}
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
                <CalendarDays className="text-terracotta-600" size={22} /> Próximos retiros en {provinceName}
              </h2>
              <Link href="/es/retiros" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
                Ver todos los retiros →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {retreats.map((r) => {
                const img = (Array.isArray(r.images) && r.images.find((i: any) => i.is_cover)?.url) || r.images?.[0]?.url;
                return (
                  <Link
                    key={r.id}
                    href={`/es/retiros/${r.slug}`}
                    className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                  >
                    <div className="relative w-full h-36 bg-sand-100">
                      {img ? (
                        <Image src={img} alt={r.title_es} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-sand-300">🧘</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-sm leading-tight group-hover:text-terracotta-600 transition-colors mb-1 line-clamp-2">{r.title_es}</h3>
                      <p className="text-xs text-[#7a6b5d] flex items-center gap-1">
                        <CalendarDays size={11} /> {new Date(r.start_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
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
              <BookOpen className="text-terracotta-600" size={22} /> Artículos del blog sobre {provinceName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/es/blog/${p.slug}`}
                  className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                >
                  <div className="relative w-full h-36 bg-sand-100">
                    {p.cover_image_url ? (
                      <Image src={p.cover_image_url} alt={p.title_es} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-sand-300">📖</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-sm leading-tight group-hover:text-terracotta-600 transition-colors mb-1.5 line-clamp-2">{p.title_es}</h3>
                    {p.excerpt_es && <p className="text-xs text-[#7a6b5d] line-clamp-2">{p.excerpt_es}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && dominantType && (
          <section className="mt-6 mb-4 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">
              Preguntas frecuentes sobre bienestar en {provinceName}
            </h2>
            <p className="text-sm text-[#a09383] mb-4">
              Enfocadas principalmente al {dominantType.label.toLowerCase()}, disciplina con más presencia en la provincia.
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
              name: `Yoga, meditación y ayurveda en ${provinceName}`,
              description: `Directorio de centros de bienestar en ${provinceName}.`,
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
              { name: 'Inicio', url: '/es' },
              { name: 'Provincias', url: '/es/centros-retiru' },
              { name: provinceName, url: `/es/provincias/${slug}` },
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
