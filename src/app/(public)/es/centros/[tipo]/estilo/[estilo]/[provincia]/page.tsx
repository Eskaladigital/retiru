// /es/centros/[tipo]/estilo/[estilo]/[provincia] — Landing provincial por estilo (Fase 3 #10)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import { getCentersByStyle, getStyleProvincePairs } from '@/lib/data';
import {
  getCenterTypeLabel,
  CENTER_TYPE_FROM_URL_ES,
  stripMarkdownForPreview,
  isGenericDescription,
} from '@/lib/utils';
import {
  generatePageMetadata,
  jsonLdItemList,
  jsonLdBreadcrumb,
  jsonLdScript,
} from '@/lib/seo';

// Landing dinámica bajo (public)/layout (que usa cookies → getCurrentUserForHeader).
// Con ISR (revalidate) + cookies en el layout, Next 14 marcaba la página como SSG
// fallida (DYNAMIC_SERVER_USAGE) y servía 500 al visitar la URL tras el build.
// La servimos como dinámica pero con cache-control largo en la CDN (ver headers()).
export const dynamic = 'force-dynamic';

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;
const MIN_CENTERS_STYLE_PROVINCE = 5;

type Params = Promise<{ tipo: string; estilo: string; provincia: string }>;

export async function generateStaticParams() {
  const pairs = await getStyleProvincePairs(MIN_CENTERS_STYLE_PROVINCE);
  return pairs.map((p) => ({
    tipo: p.centerType === 'meditation' ? 'meditacion' : p.centerType,
    estilo: p.styleSlug,
    provincia: p.provinceSlug,
  }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tipo: urlType, estilo, provincia } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) return {};
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;

  const { style, centers } = await getCentersByStyle(estilo, { province: null, limit: 200 });
  if (!style || style.center_type !== dbType) return {};

  const provinceMatches = centers.filter((c) => {
    if (!c.province) return false;
    const slug = c.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    return slug === provincia;
  });
  if (provinceMatches.length < MIN_CENTERS_STYLE_PROVINCE) return {};

  const provinceName = provinceMatches[0].province;
  const typeLabel = getCenterTypeLabel(dbType, 'es').toLowerCase();
  return generatePageMetadata({
    title: `${style.name_es} en ${provinceName} — ${provinceMatches.length} centros de ${typeLabel} | Retiru`,
    description: `Centros de ${typeLabel} ${style.name_es} en ${provinceName}. ${provinceMatches.length} opciones verificadas con reseñas reales.`,
    locale: 'es',
    path: `/es/centros/${urlType}/estilo/${estilo}/${provincia}`,
    altPath: `/en/centers/${dbType}/style/${estilo}/${provincia}`,
    keywords: [
      `${style.name_es.toLowerCase()} ${provinceName?.toLowerCase()}`,
      `centros ${style.name_es.toLowerCase()} ${provinceName?.toLowerCase()}`,
      `${typeLabel} ${provinceName?.toLowerCase()}`,
      'retiru',
    ],
  });
}

export default async function CentrosEstiloProvinciaPage({ params }: { params: Params }) {
  const { tipo: urlType, estilo, provincia } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) notFound();
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;

  const { style, centers } = await getCentersByStyle(estilo, { limit: 300 });
  if (!style || style.center_type !== dbType) notFound();

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const provinceCenters = centers.filter((c) => c.province && normalize(c.province) === provincia);
  if (provinceCenters.length < MIN_CENTERS_STYLE_PROVINCE) notFound();

  const provinceName = provinceCenters[0].province;
  const typeLabel = getCenterTypeLabel(dbType, 'es');

  const itemListLd = jsonLdItemList(
    provinceCenters.slice(0, 20).map((c, i) => ({
      name: c.name,
      url: `/es/centro/${c.slug}`,
      image: c.cover_url || (Array.isArray(c.images) && c.images[0]) || undefined,
      position: i + 1,
    })),
  );
  const breadcrumbLd = jsonLdBreadcrumb([
    { name: 'Retiru', url: '/es' },
    { name: `Centros de ${typeLabel}`, url: `/es/centros/${urlType}` },
    { name: style.name_es, url: `/es/centros/${urlType}/estilo/${estilo}` },
    { name: provinceName, url: `/es/centros/${urlType}/estilo/${estilo}/${provincia}` },
  ]);

  return (
    <>
      <section className="relative pt-[120px] pb-10 md:pt-[140px] md:pb-16 bg-gradient-to-br from-sage-50 via-cream-50 to-sand-50">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Link href={`/es/centros/${urlType}`} className="hover:underline">Centros de {typeLabel}</Link>
              <span>/</span>
              <Link href={`/es/centros/${urlType}/estilo/${estilo}`} className="hover:underline">{style.name_es}</Link>
              <span>/</span>
              <span>{provinceName}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {style.name_es} en <span className="text-terracotta-600">{provinceName}</span>
            </h1>
            <p className="text-base md:text-lg text-[#7a6b5d] leading-relaxed mb-5">
              {provinceCenters.length} centros de {typeLabel.toLowerCase()} {style.name_es} verificados en {provinceName}.
              {style.description_es && ` ${style.description_es}`}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide">
          <div className="space-y-4">
            {provinceCenters.map((c, idx) => {
              const imgSrc = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
              const clean = c.description_es && !isGenericDescription(c.description_es)
                ? stripMarkdownForPreview(c.description_es)
                : '';
              return (
                <Link
                  key={c.slug}
                  href={`/es/centro/${c.slug}`}
                  className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
                >
                  <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative bg-sand-100">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={c.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 208px"
                        {...(idx < 3 ? { priority: true } : { loading: 'lazy' as const })}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a09383] text-sm">Sin imagen</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h3>
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1 mt-1.5">
                          <MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={15} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{c.avg_rating ?? '–'}</span>
                        <span className="text-xs text-[#a09383]">({c.review_count ?? 0})</span>
                      </div>
                    </div>
                    {clean && <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{clean}</p>}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-sand-50 border border-sand-200 text-sm leading-relaxed text-[#7a6b5d]">
            ¿Buscas {style.name_es} fuera de {provinceName}? Descubre{' '}
            <Link href={`/es/centros/${urlType}/estilo/${estilo}`} className="text-terracotta-600 font-semibold underline">
              todos los centros de {style.name_es} en España
            </Link>
            {' '}o explora{' '}
            <Link href={`/es/centros/${urlType}`} className="text-terracotta-600 font-semibold underline">
              centros de {typeLabel.toLowerCase()} en España
            </Link>.
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
    </>
  );
}
