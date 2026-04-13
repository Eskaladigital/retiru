import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import EventosSearch from '@/components/home/EventosSearch';
import {
  getCategoriesWithRetreats,
  getCategoryBySlug,
  getPublishedRetreats,
  getDestinationsForCategory,
} from '@/lib/data';
import { getOrganizerReviewStats, organizerHasRatingToShow, CATEGORY_SLUG_EN, CENTER_TYPE_URL_ES } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const cats = await getCategoriesWithRetreats();
  return cats.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  const name = cat?.name_es || category;
  const enSlug = CATEGORY_SLUG_EN[category] || category;
  return generatePageMetadata({
    title: cat?.meta_title_es || `Retiros de ${name} en España — Encuentra y reserva | Retiru`,
    description: cat?.meta_description_es || `Descubre los mejores retiros de ${name.toLowerCase()} en España. Compara precios, lee reseñas y reserva con transparencia total en Retiru.`,
    locale: 'es',
    path: `/es/retiros-${category}`,
    altPath: `/en/retreats-${enSlug}`,
    keywords: [`retiros de ${name.toLowerCase()}`, `retiros ${name.toLowerCase()} españa`, `${name.toLowerCase()} retiro`, 'retiru'],
  });
}

export default async function RetirosPorCategoriaPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);

  if (!cat) notFound();

  const [{ retreats, total }, destinations] = await Promise.all([
    getPublishedRetreats({ categorySlug: category, limit: 50 }),
    getDestinationsForCategory(category),
  ]);

  const enSlug = CATEGORY_SLUG_EN[category] || category;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cat.cover_image_url ? (
            <>
              <Image src={cat.cover_image_url} alt={`Retiros de ${cat.name_es}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Retiros de {cat.name_es} en España
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} retiro{total !== 1 ? 's' : ''} de {cat.name_es.toLowerCase()} disponibles
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <EventosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/retiros-retiru" className="hover:text-terracotta-600">Retiros</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Retiros de {cat.name_es}</span>
        </nav>

        {/* Intro SEO */}
        {cat.intro_es && (
          <div className="prose prose-sand max-w-3xl mb-10">
            <div dangerouslySetInnerHTML={{ __html: cat.intro_es.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {/* Destinos con retiros de esta categoría */}
        {destinations.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl text-foreground mb-6">
              Destinos con retiros de {cat.name_es.toLowerCase()}
            </h2>
            <div className="flex flex-wrap gap-3">
              {destinations.map(d => (
                <Link
                  key={d.slug}
                  href={`/es/retiros-${category}/${d.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-sand-200 rounded-full text-sm hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
                >
                  <MapPin size={14} />
                  {d.name_es}
                  <span className="text-xs text-[#a09383]">({d.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grid de retiros */}
        {retreats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay retiros de {cat.name_es} disponibles</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otra categoría o explora todos los retiros</p>
            <Link href="/es/retiros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver todos los retiros</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {retreats.map(r => {
              const coverImg = r.images?.find((i: any) => i.is_cover)?.url || r.images?.[0]?.url || '';
              const destName = r.destination?.name_es || '';
              const spotsLow = (r.available_spots ?? 0) <= 3 && (r.available_spots ?? 0) > 0;
              const { avg_rating: orgAvg, review_count: orgReviews } = getOrganizerReviewStats(r);
              const showOrgRating = organizerHasRatingToShow(r);
              return (
                <Link
                  key={r.id}
                  href={`/es/retiro/${r.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                    {coverImg ? (
                      <Image src={coverImg} alt={r.title_es} fill loading="lazy" className="object-cover transition-transform duration-[600ms] group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-sand-300">🧘</div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {r.categories?.[0] && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{r.categories[0].name_es}</span>
                      )}
                      {r.confirmation_type === 'automatic' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">Inmediata</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {destName}</span>
                      {showOrgRating && (
                        <span className="text-[13px] font-semibold flex items-center gap-1" title="Valoración del organizador">
                          <Star size={13} className="text-amber-400 fill-amber-400" /> {orgAvg.toFixed(1)}
                          <span className="font-normal text-[#7a6b5d]">({orgReviews})</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{r.title_es}</h3>
                    <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-3">
                      {r.start_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(r.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {r.end_date && ` – ${new Date(r.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </span>
                      )}
                      {r.duration_days && (
                        <>
                          <span className="text-[#a09383]">·</span>
                          <span>{r.duration_days} días</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span>
                        <span className="text-2xl font-bold leading-none mt-0.5">{r.total_price}€ <span className="text-sm font-normal text-[#7a6b5d]">/persona</span></span>
                      </div>
                      {(r.available_spots ?? 0) > 0 && (
                        <span className={`text-[13px] font-medium flex items-center gap-1 ${spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                          <Users size={14} />
                          {r.available_spots} plazas
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cross-link a centros de la misma disciplina */}
        {Object.values(CENTER_TYPE_URL_ES).includes(category) && (
          <section className="mt-12 p-6 bg-sage-50 border border-sage-200 rounded-2xl">
            <h2 className="font-serif text-xl text-foreground mb-2">
              Centros de {cat.name_es} en España
            </h2>
            <p className="text-sm text-[#7a6b5d] mb-4">
              Encuentra centros de {cat.name_es.toLowerCase()} cerca de ti en nuestro directorio verificado.
            </p>
            <Link
              href={`/es/centros/${category}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
            >
              Ver centros de {cat.name_es.toLowerCase()} →
            </Link>
          </section>
        )}

        {/* FAQ */}
        {Array.isArray(cat.faq) && cat.faq.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {cat.faq.map((item, i) => (
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

        {/* JSON-LD */}
        {retreats.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(retreats.map((r, i) => ({
                name: r.title_es,
                url: `/es/retiro/${r.slug}`,
                image: r.images?.find((img: any) => img.is_cover)?.url || r.images?.[0]?.url,
                position: i + 1,
              })))),
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(jsonLdBreadcrumb([
              { name: 'Inicio', url: '/es' },
              { name: 'Retiros', url: '/es/retiros-retiru' },
              { name: `Retiros de ${cat.name_es}`, url: `/es/retiros-${category}` },
            ])),
          }}
        />
        {Array.isArray(cat.faq) && cat.faq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(cat.faq)) }}
          />
        )}
      </div>
    </>
  );
}
