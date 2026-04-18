// /es/retiros-en/[slug] — Landing geográfica para retiros (país / CCAA / provincia)
// Resuelve la jerarquía en `destinations` (kind + parent_slug) y agrega retiros
// y centros hijos. Complemento SEO de /es/retiros-retiru/[slug] (destino hoja).

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import EventosSearch from '@/components/home/EventosSearch';
import { createServerSupabase } from '@/lib/supabase/server';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';
import { resolveGeoLanding, type GeoNode } from '@/lib/geo-landing';

export const revalidate = 3600;

export async function generateStaticParams() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('destinations')
    .select('slug')
    .eq('is_active', true)
    .in('kind', ['country', 'region', 'province']);
  return (data || []).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const node = await resolveGeoLanding(slug);
  if (!node) {
    return generatePageMetadata({
      title: 'No encontrado | Retiru',
      description: '',
      locale: 'es',
      path: `/es/retiros-en/${slug}`,
    });
  }
  const name = node.name_es;
  return generatePageMetadata({
    title: `Retiros en ${name} | Retiru`,
    description: `Descubre los mejores retiros de yoga, meditación y bienestar en ${name}. Compara fechas, precios y reseñas reales. Reserva segura en Retiru.`,
    locale: 'es',
    path: `/es/retiros-en/${slug}`,
    altPath: `/en/retreats-in/${slug}`,
    keywords: [
      `retiros en ${name}`,
      `retiros de yoga en ${name}`,
      `retiros espirituales ${name}`,
      `escapadas de bienestar ${name}`,
    ],
  });
}

export default async function RetirosEnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const node: GeoNode | null = await resolveGeoLanding(slug);
  if (!node) notFound();

  const supabase = await createServerSupabase();

  // Retiros con destination.slug en la jerarquía hija (destinos hoja)
  const { data: destHijos } = await supabase
    .from('destinations')
    .select('id, slug, name_es')
    .in('slug', node.descendantDestinationSlugs.length ? node.descendantDestinationSlugs : ['___none___']);

  const destHijoIds = (destHijos || []).map((d) => d.id);

  let retreats: Array<{ id: string; slug: string; title_es: string; total_price: number; start_date: string | null; end_date: string | null; duration_days: number | null; available_spots: number | null; cover_url: string | null; dest_name: string | null; }> = [];
  if (destHijoIds.length) {
    const { data: rs } = await supabase
      .from('retreats')
      .select(
        'id, slug, title_es, total_price, start_date, end_date, duration_days, available_spots, destinations!destination_id(name_es), retreat_images(url, is_cover)',
      )
      .eq('status', 'published')
      .gte('end_date', new Date().toISOString().slice(0, 10))
      .in('destination_id', destHijoIds)
      .order('start_date', { ascending: true })
      .limit(60);
    retreats = (rs || []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title_es: r.title_es,
      total_price: r.total_price,
      start_date: r.start_date,
      end_date: r.end_date,
      duration_days: r.duration_days,
      available_spots: r.available_spots,
      cover_url: r.retreat_images?.find((i: any) => i.is_cover)?.url || r.retreat_images?.[0]?.url || null,
      dest_name: r.destinations?.name_es || null,
    }));
  }

  // Centros en la jerarquía: filtramos por los campos country/region/province de `centers`
  const centersQuery = supabase.from('centers').select('id, slug, name, city, province, cover_url, logo_url, avg_rating, review_count').eq('status', 'active').order('name').limit(48);
  let centers: Array<any> = [];
  if (node.kind === 'country') {
    const { data } = await centersQuery.eq('country', node.centersCountryText || 'España');
    centers = data || [];
  } else if (node.kind === 'region') {
    const { data } = await centersQuery.eq('region', node.name_es);
    centers = data || [];
  } else if (node.kind === 'province') {
    const { data } = await centersQuery.eq('province', node.name_es);
    centers = data || [];
  }

  const faq = Array.isArray((node as any).faq) ? (node as any).faq : [];
  const breadcrumb = node.breadcrumb;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {node.cover_image_url ? (
            <>
              <Image src={node.cover_image_url} alt={`Retiros en ${node.name_es}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Retiros en {node.name_es}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {retreats.length} retiro{retreats.length !== 1 ? 's' : ''} y {centers.length} centro{centers.length !== 1 ? 's' : ''} de yoga, meditación y bienestar en {node.name_es}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <EventosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/retiros-retiru" className="hover:text-terracotta-600">Retiros</Link>
          {breadcrumb.map((b) => (
            <span key={b.slug} className="flex items-center gap-1.5">
              <span>/</span>
              {b.current ? (
                <span className="text-foreground font-medium">{b.name}</span>
              ) : (
                <Link href={`/es/retiros-en/${b.slug}`} className="hover:text-terracotta-600">{b.name}</Link>
              )}
            </span>
          ))}
        </nav>

        {/* Intro */}
        {node.intro_es && (
          <div className="prose prose-sand max-w-3xl mb-10">
            <div dangerouslySetInnerHTML={{ __html: node.intro_es.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {/* Hijos navegables (p. ej. España → CCAA; Andalucía → provincias) */}
        {node.children.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl mb-5">Explora por {node.kind === 'country' ? 'comunidad autónoma' : node.kind === 'region' ? 'provincia o destino' : 'destino'}</h2>
            <div className="flex flex-wrap gap-2">
              {node.children.map((c) => (
                <Link
                  key={c.slug}
                  href={c.kind === 'destination' ? `/es/retiros-retiru/${c.slug}` : `/es/retiros-en/${c.slug}`}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-sand-300 text-sm text-foreground hover:bg-sand-100 transition-colors"
                >
                  {c.name_es}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Retiros */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl mb-5">Retiros disponibles</h2>
          {retreats.length === 0 ? (
            <div className="bg-cream-100 border border-sand-200 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">🧘</p>
              <p className="font-serif text-lg mb-2">Próximamente retiros en {node.name_es}</p>
              <p className="text-sm text-[#7a6b5d] mb-4">
                Mientras tanto, explora nuestro <Link href="/es/centros-retiru" className="text-terracotta-600 font-semibold">directorio de centros</Link>
                {' '}o los <Link href="/es/retiros-retiru" className="text-terracotta-600 font-semibold">retiros en todos los destinos</Link>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {retreats.map((r) => {
                const spotsLow = (r.available_spots ?? 0) <= 3 && (r.available_spots ?? 0) > 0;
                return (
                  <Link
                    key={r.id}
                    href={`/es/retiro/${r.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                      {r.cover_url ? (
                        <Image src={r.cover_url} alt={r.title_es} fill loading="lazy" className="object-cover transition-transform duration-[600ms] group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-sand-300">🧘</div>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1 mb-2">
                        <MapPin size={13} /> {r.dest_name || node.name_es}
                      </span>
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
        </section>

        {/* Centros */}
        {centers.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-2xl mb-5">Centros en {node.name_es}</h2>
            <p className="text-sm text-[#7a6b5d] mb-5">
              Directorio de centros de yoga, meditación y bienestar verificados en {node.name_es}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {centers.slice(0, 12).map((c: any) => (
                <Link
                  key={c.id}
                  href={`/es/centro/${c.slug}`}
                  className="group bg-white rounded-xl overflow-hidden border border-sand-200 hover:shadow-elevated hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-sand-100">
                    {c.cover_url ? (
                      <Image src={c.cover_url} alt={c.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                    ) : c.logo_url ? (
                      <Image src={c.logo_url} alt={c.name} fill className="object-contain p-6" sizes="(max-width: 768px) 100vw, 25vw" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif text-base leading-tight mb-1 line-clamp-2 group-hover:text-terracotta-600">{c.name}</h3>
                    <p className="text-xs text-[#7a6b5d] flex items-center gap-1">
                      <MapPin size={11} /> {c.city || c.province}
                    </p>
                    {c.avg_rating > 0 && (
                      <div className="text-xs mt-1 flex items-center gap-1">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        {Number(c.avg_rating).toFixed(1)}
                        <span className="text-[#a09383]">({c.review_count})</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {centers.length > 12 && (
              <div className="mt-5">
                <Link href={`/es/centros-retiru/${slug}`} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
                  Ver los {centers.length} centros en {node.name_es} →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faq.map((item: any, i: number) => (
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
                image: r.cover_url || undefined,
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
              ...breadcrumb.map((b) => ({
                name: b.name,
                url: b.current ? `/es/retiros-en/${b.slug}` : `/es/retiros-en/${b.slug}`,
              })),
            ])),
          }}
        />
        {faq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(faq)) }}
          />
        )}
      </div>
    </>
  );
}
