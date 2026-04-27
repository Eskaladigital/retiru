// /es/centros/[tipo]/[provincia] — Centros por tipo y provincia
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import SeoSections, { SeoFaqSection } from '@/components/seo/SeoSections';
import {
  getCenterTypeProvincePairs,
  getCentersByProvince,
  getCategoryBySlug,
  getCenterTypeProvinceSeo,
  getProvincesForCenterType,
  getCitiesForCenterTypeProvince,
} from '@/lib/data';
import {
  getCenterTypeLabel,
  CENTER_TYPE_FROM_URL_ES,
  CENTER_TYPE_URL_ES,
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

export const revalidate = 3600;

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;

export async function generateStaticParams() {
  const pairs = await getCenterTypeProvincePairs();
  return pairs.map((p) => ({
    tipo: CENTER_TYPE_URL_ES[p.type] || p.type,
    provincia: p.province,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string; provincia: string }>;
}): Promise<Metadata> {
  const { tipo: urlType, provincia: province } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) return {};
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const [{ centers, provinceName }, seo] = await Promise.all([
    getCentersByProvince(province),
    getCenterTypeProvinceSeo(dbType, province),
  ]);
  const filtered = centers.filter((c) => c.type === dbType);
  const name = provinceName || province;
  const hasCenters = filtered.length > 0;

  return generatePageMetadata({
    title:
      (seo?.meta_title_es && seo.meta_title_es.trim()) ||
      `Centros de ${label} en ${name} | Retiru`,
    description:
      (seo?.meta_description_es && seo.meta_description_es.trim()) ||
      `Encuentra centros de ${label.toLowerCase()} en ${name}. Directorio verificado con reseñas reales, ubicación y servicios.`,
    locale: 'es',
    path: `/es/centros/${urlType}/${province}`,
    altPath: `/en/centers/${dbType}/${province}`,
    keywords: [
      `centros de ${label.toLowerCase()} en ${name}`,
      `${label.toLowerCase()} ${name}`,
      'retiru',
    ],
    noIndex: !hasCenters || Boolean(seo?.suppress_reason),
  });
}

export default async function CentrosTipoProvinciaPage({
  params,
}: {
  params: Promise<{ tipo: string; provincia: string }>;
}) {
  const { tipo: urlType, provincia: province } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) notFound();
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const [{ centers, provinceName }, seo] = await Promise.all([
    getCentersByProvince(province),
    getCenterTypeProvinceSeo(dbType, province),
  ]);
  const filtered = centers.filter((c) => c.type === dbType);
  const catSlug = urlType === 'meditacion' ? 'meditacion' : urlType;
  const cat = await getCategoryBySlug(catSlug);

  if (!provinceName) notFound();

  const introHtml = seo?.intro_es?.trim() || cat?.intro_es?.replace(/\n/g, '<br/>') || null;
  const faqs = Array.isArray(seo?.faq_es) ? seo!.faq_es.filter((q) => q.question && q.answer) : [];
  const sections = seo?.sections_es ?? [];

  // "Otras provincias con {tipo}" — se calcula siempre (no solo en fallback)
  // para reforzar el enlazado interno programático (#8 del PLAN_SEO).
  const allProvinces = await getProvincesForCenterType(dbType);
  const neighborProvinces = allProvinces
    .filter((p) => p.slug !== province)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // "Ciudades destacadas en {provincia}" — ciudades con ≥2 centros del mismo tipo
  // dentro de la provincia actual, para alimentar las nuevas landings de ciudad.
  const provinceCities = await getCitiesForCenterTypeProvince(dbType, province, null, 2);

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
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap" aria-label="Migas de pan">
          <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
          <span>/</span>
          <Link href="/es/centros-retiru" className="hover:text-terracotta-600">Centros</Link>
          <span>/</span>
          <Link href={`/es/centros/${urlType}`} className="hover:text-terracotta-600">Centros de {label}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{provinceName}</span>
        </nav>

        {introHtml && (
          <div className="max-w-4xl mb-10 bg-gradient-to-br from-sand-50 to-cream-50 border border-sand-200 rounded-2xl p-6 md:p-8">
            <div
              className="prose prose-sand max-w-none text-[#44362b] leading-relaxed prose-p:mb-3 prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          </div>
        )}

        {/* Secciones editoriales enriquecidas (why_here, how_to_choose) §8 SEO-LANDINGS.
            Posición: ANTES del listado para dar contexto y peso SEO al contenido. */}
        {sections.length > 0 && (
          <SeoSections sections={sections} className="mb-12" />
        )}

        {filtered.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-12 px-6 bg-white border border-sand-200 rounded-2xl">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-2xl text-foreground mb-3">
              Aún no tenemos centros de {label.toLowerCase()} verificados en {provinceName}
            </p>
            <p className="text-[#7a6b5d] mb-8 max-w-xl mx-auto">
              Estamos ampliando el directorio. Si conoces un centro de {label.toLowerCase()} en {provinceName} que encaje con Retiru, ayúdanos a añadirlo.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/es/para-organizadores"
                className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
              >
                Registra tu centro
              </Link>
              <Link
                href={`/es/centros/${urlType}`}
                className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sand-50 transition-colors"
              >
                Ver todos los centros de {label}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => {
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

        {/* Ciudades destacadas dentro de la provincia (≥2 centros del tipo) */}
        {provinceCities.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-foreground mb-4">
              Ciudades con centros de {label.toLowerCase()} en {provinceName}
            </h2>
            <p className="text-sm text-[#7a6b5d] mb-5">
              Explora landings específicas por ciudad dentro de la provincia.
            </p>
            <div className="flex flex-wrap gap-2">
              {provinceCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/es/centros/${urlType}/${province}/${c.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-sand-200 rounded-full text-sm text-foreground hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
                >
                  <MapPin size={13} />
                  {c.name}
                  <span className="text-xs text-[#a09383]">({c.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Otras provincias con {tipo} — siempre visible (no solo en fallback) */}
        {neighborProvinces.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-foreground mb-4">
              Otras provincias con centros de {label.toLowerCase()}
            </h2>
            <div className="flex flex-wrap gap-2">
              {neighborProvinces.map((p) => (
                <Link
                  key={p.slug}
                  href={`/es/centros/${urlType}/${p.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-sand-200 rounded-full text-sm text-foreground hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
                >
                  <MapPin size={13} />
                  {p.name}
                  <span className="text-xs text-[#a09383]">({p.count})</span>
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href={`/es/centros/${urlType}`}
                className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
              >
                Ver todas las provincias con centros de {label.toLowerCase()} →
              </Link>
            </div>
          </section>
        )}

        {/* NOTA: el hub /es/provincias/[slug] se descartó el 2026-04-22 por
            canibalización con esta página (§8 docs/SEO-LANDINGS.md). No hay
            enlace al multi-disciplina; el usuario navega vía breadcrumb + tags
            de "otras provincias". */}

        <SeoFaqSection
          items={faqs}
          heading={`Preguntas frecuentes sobre centros de ${label.toLowerCase()} en ${provinceName}`}
          className="mt-16"
        />

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
              { name: `Centros de ${label}`, url: `/es/centros/${urlType}` },
              { name: provinceName, url: `/es/centros/${urlType}/${province}` },
            ])),
          }}
        />
        {faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(faqs)) }}
          />
        )}
      </div>
    </>
  );
}
