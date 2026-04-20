// /es/centros/[tipo]/estilo/[estilo] — Landing nacional por estilo (Fase 3 #10)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import { getCentersByStyle, getProvincesForStyle, getStyleProvincePairs } from '@/lib/data';
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
  jsonLdFAQ,
  jsonLdScript,
} from '@/lib/seo';

// Ver nota en /[provincia]/page.tsx: force-dynamic por interacción ISR + cookies layout.
export const dynamic = 'force-dynamic';

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;
const MIN_CENTERS_STYLE_NATIONAL = 3; // umbral para indexar la combinación
const MIN_CENTERS_STYLE_PROVINCE = 5;

type Params = Promise<{ tipo: string; estilo: string }>;

export async function generateStaticParams() {
  const pairs = await getStyleProvincePairs(MIN_CENTERS_STYLE_PROVINCE);
  // Solo renderizamos nacional si hay al menos MIN_CENTERS_STYLE_NATIONAL centros
  // totales del estilo. Para eso agrupamos por styleSlug+centerType sumando los count.
  const totals = new Map<string, { tipo: string; estilo: string; count: number }>();
  for (const p of pairs) {
    const tipoUrl = p.centerType === 'meditation' ? 'meditacion' : p.centerType;
    const key = `${tipoUrl}|${p.styleSlug}`;
    const entry = totals.get(key) || { tipo: tipoUrl, estilo: p.styleSlug, count: 0 };
    entry.count += p.count;
    totals.set(key, entry);
  }
  return Array.from(totals.values())
    .filter((t) => t.count >= MIN_CENTERS_STYLE_NATIONAL)
    .map(({ tipo, estilo }) => ({ tipo, estilo }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tipo: urlType, estilo } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) return {};
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const { style, total } = await getCentersByStyle(estilo);
  if (!style || style.center_type !== dbType || total < MIN_CENTERS_STYLE_NATIONAL) return {};

  const typeLabel = getCenterTypeLabel(dbType, 'es').toLowerCase();
  return generatePageMetadata({
    title: `${style.name_es} en España — Centros de ${typeLabel} ${style.name_es} | Retiru`,
    description: `Directorio verificado de centros de ${typeLabel} ${style.name_es} en España. ${style.description_es || ''}`.trim(),
    locale: 'es',
    path: `/es/centros/${urlType}/estilo/${estilo}`,
    altPath: `/en/centers/${dbType}/style/${estilo}`,
    keywords: [
      style.name_es.toLowerCase(),
      `${style.name_es.toLowerCase()} españa`,
      `centros de ${style.name_es.toLowerCase()}`,
      `${typeLabel} ${style.name_es.toLowerCase()}`,
      'retiru',
    ],
  });
}

export default async function CentrosPorEstiloPage({ params }: { params: Params }) {
  const { tipo: urlType, estilo } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) notFound();
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;

  const [{ centers, total, style }, provinces] = await Promise.all([
    getCentersByStyle(estilo, { limit: 50 }),
    getProvincesForStyle(estilo, 1),
  ]);
  if (!style || style.center_type !== dbType || total < MIN_CENTERS_STYLE_NATIONAL) notFound();

  const typeLabel = getCenterTypeLabel(dbType, 'es');
  const indexableProvinces = provinces.filter((p) => p.count >= MIN_CENTERS_STYLE_PROVINCE);
  const allProvincesDisplay = provinces.slice(0, 12);

  const itemListLd = jsonLdItemList(
    centers.slice(0, 20).map((c, i) => ({
      name: c.name,
      url: `/es/centro/${c.slug}`,
      image: c.cover_url || (Array.isArray(c.images) ? c.images[0] : undefined) || undefined,
      position: i + 1,
    })),
  );

  const breadcrumbLd = jsonLdBreadcrumb([
    { name: 'Retiru', url: '/es' },
    { name: `Centros de ${typeLabel}`, url: `/es/centros/${urlType}` },
    { name: style.name_es, url: `/es/centros/${urlType}/estilo/${estilo}` },
  ]);

  const faqItems = [
    {
      question: `¿Qué es ${style.name_es}?`,
      answer: style.description_es || `${style.name_es} es un estilo de ${typeLabel.toLowerCase()}.`,
    },
    {
      question: `¿Dónde se practica ${style.name_es} en España?`,
      answer: `Hay centros de ${typeLabel.toLowerCase()} ${style.name_es} en ${provinces.length} provincias españolas. Las que más centros concentran: ${allProvincesDisplay.slice(0, 5).map((p) => p.name).join(', ')}.`,
    },
    {
      question: `¿Cómo elegir un centro de ${style.name_es}?`,
      answer: `Lo más importante es verificar la formación del profesorado, la metodología y las reseñas reales. En Retiru todos los centros están verificados y con información de contacto actualizada.`,
    },
  ];
  const faqLd = jsonLdFAQ(faqItems);

  return (
    <>
      <section className="relative pt-[120px] pb-10 md:pt-[140px] md:pb-16 bg-gradient-to-br from-sage-50 via-cream-50 to-sand-50">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Link href={`/es/centros/${urlType}`} className="hover:underline">Centros de {typeLabel}</Link>
              <span>/</span>
              <span>{style.name_es}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Centros de {typeLabel} <span className="text-terracotta-600">{style.name_es}</span> en España
            </h1>
            {style.description_es && (
              <p className="text-base md:text-lg text-[#7a6b5d] leading-relaxed mb-5">
                {style.description_es}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'centro verificado' : 'centros verificados'} · {provinces.length} {provinces.length === 1 ? 'provincia' : 'provincias'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide">
          {indexableProvinces.length > 1 && (
            <div className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">
                {style.name_es} por provincia
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {indexableProvinces.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/es/centros/${urlType}/estilo/${estilo}/${p.slug}`}
                    className="px-4 py-3 rounded-xl border border-sand-200 bg-white hover:bg-sand-50 hover:border-terracotta-300 transition text-sm font-medium flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-[#a09383]">{p.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">
            Centros destacados de {style.name_es}
          </h2>
          <div className="space-y-4">
            {centers.map((c, idx) => {
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

          <section className="mt-12">
            <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {faqItems.map((f) => (
                <details key={f.question} className="group rounded-xl border border-sand-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-foreground list-none">{f.question}</summary>
                  <p className="mt-3 text-sm text-[#7a6b5d] leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqLd) }} />
    </>
  );
}
