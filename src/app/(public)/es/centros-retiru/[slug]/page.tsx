// /es/centros-retiru/[slug] — Centros filtrados por provincia (datos reales de Supabase)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getCenterProvinces, getCentersByProvince } from '@/lib/data';
import { getCenterTypeLabel, CENTER_TYPE_URL_ES } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const provinces = await getCenterProvinces();
  return provinces.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { provinceName } = await getCentersByProvince(slug);
  const name = provinceName || slug;
  return generatePageMetadata({
    title: `Centros de yoga, meditación y ayurveda en ${name} | Retiru`,
    description: `Encuentra centros de yoga, meditación y ayurveda en ${name}. Directorio verificado con reseñas reales.`,
    locale: 'es',
    path: `/es/centros-retiru/${slug}`,
    altPath: `/en/centers-retiru/${slug}`,
    keywords: ['centros yoga ' + name, 'meditación ' + name, 'ayurveda ' + name],
  });
}

export default async function CentrosPorProvinciaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { centers, provinceName } = await getCentersByProvince(slug);

  if (!provinceName) {
    return (
      <div className="container-wide py-12">
        <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Directorio de centros
        </Link>
        <p className="font-serif text-xl text-foreground">Provincia no encontrada</p>
      </div>
    );
  }

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">Centros en {provinceName}</h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {centers.length} centro{centers.length !== 1 ? 's' : ''} de yoga, meditación y ayurveda en {provinceName}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los centros
        </Link>

        {(() => {
          const typeMap = new Map<string, string>();
          centers.forEach(c => { if (c.type && !typeMap.has(c.type)) typeMap.set(c.type, getCenterTypeLabel(c.type)); });
          const types = Array.from(typeMap.entries());
          return types.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs text-muted-foreground self-center mr-1">Filtrar por tipo:</span>
              {types.map(([type, label]) => (
                <Link key={type} href={`/es/centros-${CENTER_TYPE_URL_ES[type] || type}/${slug}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 transition-colors">Centros de {label}</Link>
              ))}
            </div>
          ) : null;
        })()}

        {centers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay centros en {provinceName}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otra provincia o explora el directorio completo</p>
            <Link href="/es/centros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver directorio completo</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {centers.map(c => {
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
                    {c.description_es && (
                      <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{c.description_es}</p>
                    )}
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
      </div>
    </>
  );
}
