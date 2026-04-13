import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getCenterTypeProvincePairs, getCentersByProvince, getCategoryBySlug } from '@/lib/data';
import { getCenterTypeLabel, CENTER_TYPE_FROM_URL_ES, CENTER_TYPE_URL_ES, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;

export async function generateStaticParams() {
  const pairs = await getCenterTypeProvincePairs();
  return pairs.map(p => ({
    type: CENTER_TYPE_URL_ES[p.type] || p.type,
    province: p.province,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; province: string }> }): Promise<Metadata> {
  const { type: urlType, province } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) return {};
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');
  const { provinceName } = await getCentersByProvince(province);
  const name = provinceName || province;
  return generatePageMetadata({
    title: `Centros de ${label} en ${name} | Retiru`,
    description: `Encuentra centros de ${label.toLowerCase()} en ${name}. Directorio verificado con reseñas reales, ubicación y servicios.`,
    locale: 'es',
    path: `/es/centros-${urlType}/${province}`,
    altPath: `/en/centers-${dbType}/${province}`,
    keywords: [`centros de ${label.toLowerCase()} en ${name}`, `${label.toLowerCase()} ${name}`, 'retiru'],
  });
}

export default async function CentrosTipoProvinciaPage({ params }: { params: Promise<{ type: string; province: string }> }) {
  const { type: urlType, province } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) notFound();
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const { centers, provinceName } = await getCentersByProvince(province);
  const filtered = centers.filter(c => c.type === dbType);
  const catSlug = urlType === 'meditacion' ? 'meditacion' : urlType;
  const cat = await getCategoryBySlug(catSlug);

  if (!provinceName) notFound();

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Centros de {label} en {provinceName}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {filtered.length} centro{filtered.length !== 1 ? 's' : ''} de {label.toLowerCase()} en {provinceName}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/centros-retiru" className="hover:text-terracotta-600">Centros</Link>
          <span>/</span>
          <Link href={`/es/centros-${urlType}`} className="hover:text-terracotta-600">Centros de {label}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{provinceName}</span>
        </nav>

        {/* Intro combinado */}
        <div className="prose prose-sand max-w-3xl mb-10">
          {cat?.intro_es && <div dangerouslySetInnerHTML={{ __html: cat.intro_es.replace(/\n/g, '<br/>') }} />}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">Próximamente centros de {label.toLowerCase()} en {provinceName}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Explora todos los centros de {label.toLowerCase()} o centros en {provinceName}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/es/centros-${urlType}`} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Centros de {label}</Link>
              <Link href={`/es/centros-retiru/${province}`} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Centros en {provinceName}</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(c => {
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
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1 mt-1.5"><MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}</span>
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(filtered.map((c, i) => ({
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
              { name: provinceName, url: `/es/centros-${urlType}/${province}` },
            ])),
          }}
        />
      </div>
    </>
  );
}
