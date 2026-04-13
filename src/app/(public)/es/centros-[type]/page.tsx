import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getActiveCenters, getCategoryBySlug, getProvincesForCenterType } from '@/lib/data';
import {
  getCenterTypeLabel,
  CENTER_TYPE_FROM_URL_ES,
  CENTER_TYPE_URL_ES,
} from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;

export async function generateStaticParams() {
  return VALID_TYPES_ES.map(t => ({ type: t }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type: urlType } = await params;
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');
  const enType = dbType;
  return generatePageMetadata({
    title: `Centros de ${label} en España — Directorio verificado | Retiru`,
    description: `Encuentra centros de ${label.toLowerCase()} en toda España. Directorio con reseñas reales, ubicación y servicios. Busca tu centro ideal en Retiru.`,
    locale: 'es',
    path: `/es/centros-${urlType}`,
    altPath: `/en/centers-${enType}`,
    keywords: [`centros de ${label.toLowerCase()}`, `${label.toLowerCase()} españa`, `directorio ${label.toLowerCase()}`, 'retiru'],
  });
}

export default async function CentrosPorTipoPage({ params }: { params: Promise<{ type: string }> }) {
  const { type: urlType } = await params;
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const [{ centers, total }, provinces, cat] = await Promise.all([
    getActiveCenters({ type: dbType, limit: 50 }),
    getProvincesForCenterType(dbType),
    getCategoryBySlug(urlType === 'meditacion' ? 'meditacion' : urlType),
  ]);

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cat?.cover_image_url ? (
            <>
              <Image src={cat.cover_image_url} alt={`Centros de ${label}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Centros de {label} en España
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} centro{total !== 1 ? 's' : ''} de {label.toLowerCase()} en el directorio
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/centros-retiru" className="hover:text-terracotta-600">Centros</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Centros de {label}</span>
        </nav>

        {cat?.intro_es && (
          <div className="prose prose-sand max-w-3xl mb-10">
            <div dangerouslySetInnerHTML={{ __html: cat.intro_es.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {/* Provincias con centros de este tipo */}
        {provinces.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl text-foreground mb-6">Centros de {label.toLowerCase()} por provincia</h2>
            <div className="flex flex-wrap gap-3">
              {provinces.map(p => (
                <Link
                  key={p.slug}
                  href={`/es/centros-${urlType}/${p.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-sand-200 rounded-full text-sm hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
                >
                  <MapPin size={14} />
                  {p.name}
                  <span className="text-xs text-[#a09383]">({p.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {centers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay centros de {label.toLowerCase()} disponibles</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Explora el directorio completo</p>
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cross-link a retiros de la misma disciplina */}
        <section className="mt-12 p-6 bg-sand-50 border border-sand-200 rounded-2xl">
          <h2 className="font-serif text-xl text-foreground mb-2">
            Retiros de {getCenterTypeLabel(dbType)} en España
          </h2>
          <p className="text-sm text-[#7a6b5d] mb-4">
            Descubre retiros y escapadas de {getCenterTypeLabel(dbType).toLowerCase()} en toda España con precios transparentes.
          </p>
          <Link
            href={`/es/retiros-${urlType}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
          >
            Ver retiros de {getCenterTypeLabel(dbType).toLowerCase()} →
          </Link>
        </section>

        {Array.isArray(cat?.faq) && cat.faq.length > 0 && (
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
              { name: `Centros de ${label}`, url: `/es/centros-${urlType}` },
            ])),
          }}
        />
        {Array.isArray(cat?.faq) && cat.faq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(cat.faq)) }}
          />
        )}
      </div>
    </>
  );
}
