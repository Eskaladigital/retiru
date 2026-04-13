// /es/retiros-retiru/[slug] — Retiros filtrados por destino (datos reales de Supabase)
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import EventosSearch from '@/components/home/EventosSearch';
import { getDestinationsWithRetreats, getDestinationBySlug, getPublishedRetreats } from '@/lib/data';
import { getOrganizerReviewStats, organizerHasRatingToShow } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const destinations = await getDestinationsWithRetreats();
  return destinations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);
  const name = dest?.name_es || slug;
  return generatePageMetadata({
    title: `Retiros en ${name} — Yoga, meditación y ayurveda | Retiru`,
    description: `Descubre retiros y eventos de yoga, meditación y ayurveda en ${name}. Reserva tu plaza con transparencia total.`,
    locale: 'es',
    path: `/es/retiros-retiru/${slug}`,
    altPath: `/en/retreats-retiru/${slug}`,
    keywords: ['retiros ' + name, 'yoga ' + name, 'meditación ' + name, 'ayurveda ' + name],
  });
}

export default async function RetirosPorDestinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);

  if (!dest) {
    return (
      <div className="container-wide py-12">
        <Link href="/es/retiros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los retiros
        </Link>
        <p className="font-serif text-xl text-foreground">Destino no encontrado</p>
      </div>
    );
  }

  const { retreats, total } = await getPublishedRetreats({ destinationSlug: slug, limit: 50 });

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {dest.cover_image_url ? (
            <>
              <img src={dest.cover_image_url} alt={`Retiros en ${dest.name_es}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">Retiros en {dest.name_es}</h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} retiro{total !== 1 ? 's' : ''} y escapadas en {dest.name_es}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <EventosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <Link href="/es/retiros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los retiros
        </Link>

        {retreats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay retiros en {dest.name_es}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otro destino o explora todos los retiros</p>
            <Link href="/es/retiros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver todos los retiros</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {retreats.map(r => {
              const coverImg = r.images?.find((i: any) => i.is_cover)?.url || r.images?.[0]?.url || '';
              const destName = r.destination?.name_es || dest.name_es;
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
                      <img src={coverImg} alt={r.title_es} loading="lazy" className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
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
      </div>
    </>
  );
}
