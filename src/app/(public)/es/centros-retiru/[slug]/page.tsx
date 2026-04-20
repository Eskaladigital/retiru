// /es/centros-retiru/[slug] — Centros filtrados por ámbito geográfico
// Acepta país, comunidad autónoma, provincia (vía `destinations.kind`) y,
// como fallback, provincia por match textual en centers.province (legacy).

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getCenterProvinces, getCentersByProvince } from '@/lib/data';
import { getCenterTypeLabel, CENTER_TYPE_URL_ES, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';
import { resolveGeoLanding, type GeoNode } from '@/lib/geo-landing';
import { createServerSupabase, createStaticSupabase } from '@/lib/supabase/server';
import type { Center } from '@/types';

export const revalidate = 3600;

export async function generateStaticParams() {
  // Desde #7 del PLAN_SEO las provincias canónicas viven en /es/provincias/[slug].
  // Aquí solo pre-generamos país y comunidades autónomas (las provincias
  // caen por permanentRedirect y no necesitan estáticos propios).
  const supabase = createStaticSupabase();
  const { data: geo } = await supabase
    .from('destinations')
    .select('slug')
    .eq('is_active', true)
    .in('kind', ['country', 'region']);
  return (geo || []).map((g) => ({ slug: g.slug }));
}

async function fetchCentersForGeo(node: GeoNode): Promise<Center[]> {
  const supabase = await createServerSupabase();
  const select = `
    id, slug, name, type, description_es, description_en, categories,
    country, region, province, city, address, latitude, longitude,
    cover_url, logo_url, images, avg_rating, review_count,
    google_maps_url, google_place_id
  `;
  let query = supabase.from('centers').select(select).eq('status', 'active').order('name').limit(2000);
  if (node.kind === 'country') {
    query = query.eq('country', node.centersCountryText || 'España');
  } else if (node.kind === 'region') {
    query = query.eq('region', node.name_es);
  } else if (node.kind === 'province') {
    query = query.eq('province', node.name_es);
  }
  const { data } = await query;
  return (data || []) as Center[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const geo = await resolveGeoLanding(slug);
  if (geo?.kind === 'province') {
    permanentRedirect(`/es/provincias/${slug}`);
  }
  let name = slug;
  if (geo) {
    name = geo.name_es;
  } else {
    const { provinceName } = await getCentersByProvince(slug);
    if (provinceName) name = provinceName;
  }
  return generatePageMetadata({
    title: `Centros de yoga, meditación y ayurveda en ${name} | Retiru`,
    description: `Encuentra centros de yoga, meditación y ayurveda en ${name}. Directorio verificado con reseñas reales.`,
    locale: 'es',
    path: `/es/centros-retiru/${slug}`,
    altPath: `/en/centers-retiru/${slug}`,
    keywords: [`centros yoga ${name}`, `meditación ${name}`, `ayurveda ${name}`],
  });
}

export default async function CentrosPorGeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let centers: Center[] = [];
  let placeName: string | null = null;
  let geo: GeoNode | null = null;

  geo = await resolveGeoLanding(slug);
  if (geo?.kind === 'province') {
    permanentRedirect(`/es/provincias/${slug}`);
  }
  if (geo) {
    placeName = geo.name_es;
    centers = await fetchCentersForGeo(geo);
  } else {
    // Fallback provincia por match textual (legacy): también redirigimos al nuevo hub.
    const res = await getCentersByProvince(slug);
    if (res.provinceName) {
      permanentRedirect(`/es/provincias/${slug}`);
    }
    centers = res.centers;
    placeName = res.provinceName;
  }

  if (!placeName) notFound();

  const breadcrumb = geo?.breadcrumb || [{ slug, name: placeName, current: true }];
  const subLabel = geo?.kind === 'country' ? 'comunidad autónoma' : geo?.kind === 'region' ? 'provincia' : null;

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {geo?.cover_image_url ? (
            <>
              <Image src={geo.cover_image_url} alt={`Centros en ${placeName}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">Centros en {placeName}</h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} de yoga, meditación y ayurveda en {placeName}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-6 flex-wrap">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/centros-retiru" className="hover:text-terracotta-600">Centros</Link>
          {breadcrumb.map((b) => (
            <span key={b.slug} className="flex items-center gap-1.5">
              <span>/</span>
              {b.current ? (
                <span className="text-foreground font-medium">{b.name}</span>
              ) : (
                <Link href={`/es/centros-retiru/${b.slug}`} className="hover:text-terracotta-600">{b.name}</Link>
              )}
            </span>
          ))}
        </nav>

        {/* Intro AI (solo para geo con intro) */}
        {geo?.intro_es && (
          <div className="prose prose-sand max-w-3xl mb-8">
            <div dangerouslySetInnerHTML={{ __html: geo.intro_es.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {/* Hijos navegables */}
        {geo && geo.children.length > 0 && subLabel && (
          <section className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#a09383] mb-2">Explora por {subLabel}</p>
            <div className="flex flex-wrap gap-2">
              {geo.children.map((c) => (
                <Link
                  key={c.slug}
                  href={`/es/centros-retiru/${c.slug}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-sand-300 text-xs text-foreground hover:bg-sand-100 transition-colors"
                >
                  {c.name_es}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filtros por tipo (sólo si es provincia con slug que coincide con /es/centros/[tipo]/[prov]) */}
        {(() => {
          const typeMap = new Map<string, string>();
          centers.forEach((c) => { if (c.type && !typeMap.has(c.type)) typeMap.set(c.type, getCenterTypeLabel(c.type)); });
          const types = Array.from(typeMap.entries());
          const canLinkType = !geo;
          return types.length > 0 && canLinkType ? (
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs text-muted-foreground self-center mr-1">Filtrar por tipo:</span>
              {types.map(([type, label]) => (
                <Link key={type} href={`/es/centros/${CENTER_TYPE_URL_ES[type] || type}/${slug}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 transition-colors">Centros de {label}</Link>
              ))}
            </div>
          ) : null;
        })()}

        {centers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay centros en {placeName}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otra zona o explora el directorio completo</p>
            <Link href="/es/centros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver directorio completo</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {centers.map((c) => {
              const img = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
              return (
                <Link
                  key={c.id}
                  href={`/es/centro/${c.slug}`}
                  className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
                >
                  <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative bg-sand-100">
                    {img ? (
                      <Image src={img} alt={c.name} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 208px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-sand-300">🏢</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                          {c.type && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{getCenterTypeLabel(c.type)}</span>
                          )}
                          <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}</span>
                          {(c.google_maps_url || c.google_place_id) && (
                            <a href={c.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${c.google_place_id}`} target="_blank" rel="noopener" className="text-[11px] text-terracotta-600 hover:underline flex items-center gap-0.5">Maps</a>
                          )}
                        </div>
                      </div>
                      {(c.avg_rating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={15} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold">{c.avg_rating}</span>
                          {(c.review_count ?? 0) > 0 && <span className="text-xs text-[#a09383]">({c.review_count})</span>}
                        </div>
                      )}
                    </div>
                    {(() => {
                      const raw = c.description_es;
                      if (!raw || isGenericDescription(raw)) return null;
                      const clean = stripMarkdownForPreview(raw);
                      if (!clean) return null;
                      return <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{clean}</p>;
                    })()}
                    {Array.isArray(c.categories) && c.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {c.categories.slice(0, 4).map((cat: string) => (
                          <span key={cat} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{cat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {centers.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(centers.map((c, i) => ({
                name: c.name,
                url: `/es/centro/${c.slug}`,
                image: c.cover_url || (Array.isArray(c.images) && c.images[0]) || undefined,
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
              { name: 'Centros', url: '/es/centros-retiru' },
              ...breadcrumb.map((b) => ({ name: b.name, url: `/es/centros-retiru/${b.slug}` })),
            ])),
          }}
        />
      </div>
    </>
  );
}
