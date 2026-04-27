// /es/centros/[tipo]/[provincia]/[ciudad] — Centros por tipo, provincia y ciudad/barrio
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import {
  getCenterTypeProvinceCityTriples,
  getCentersByProvinceCity,
  getCenterTypeProvinceCitySeo,
  getCenterTypeProvinceSeo,
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
import SeoSections, { SeoFaqSection } from '@/components/seo/SeoSections';

export const revalidate = 3600;

const VALID_TYPES_ES = ['yoga', 'meditacion', 'ayurveda'] as const;

export async function generateStaticParams() {
  const triples = await getCenterTypeProvinceCityTriples(2);
  return triples.map((t) => ({
    tipo: CENTER_TYPE_URL_ES[t.type] || t.type,
    provincia: t.provinceSlug,
    ciudad: t.citySlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string; provincia: string; ciudad: string }>;
}): Promise<Metadata> {
  const { tipo: urlType, provincia: province, ciudad: city } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) return {};
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const [{ centers, provinceName, cityName }, seo] = await Promise.all([
    getCentersByProvinceCity(province, city),
    getCenterTypeProvinceCitySeo(dbType, province, city),
  ]);
  const filtered = centers.filter((c) => c.type === dbType);
  const cName = cityName || city;
  const pName = provinceName || province;
  const hasCenters = filtered.length > 0;

  return generatePageMetadata({
    title:
      (seo?.meta_title_es && seo.meta_title_es.trim()) ||
      `Centros de ${label} en ${cName} (${pName}) | Retiru`,
    description:
      (seo?.meta_description_es && seo.meta_description_es.trim()) ||
      `Encuentra centros de ${label.toLowerCase()} en ${cName}, ${pName}. Directorio verificado con reseñas reales, ubicación y servicios.`,
    locale: 'es',
    path: `/es/centros/${urlType}/${province}/${city}`,
    altPath: `/en/centers/${dbType}/${province}/${city}`,
    keywords: [
      `centros de ${label.toLowerCase()} en ${cName}`,
      `${label.toLowerCase()} ${cName}`,
      `${label.toLowerCase()} ${pName}`,
      'retiru',
    ],
    noIndex: !hasCenters || Boolean(seo?.suppress_reason),
  });
}

export default async function CentrosTipoProvinciaCiudadPage({
  params,
}: {
  params: Promise<{ tipo: string; provincia: string; ciudad: string }>;
}) {
  const { tipo: urlType, provincia: province, ciudad: city } = await params;
  if (!(VALID_TYPES_ES as readonly string[]).includes(urlType)) notFound();
  const dbType = CENTER_TYPE_FROM_URL_ES[urlType] || urlType;
  const label = getCenterTypeLabel(dbType, 'es');

  const [{ centers, provinceName, cityName }, citySeo, provinceSeo] = await Promise.all([
    getCentersByProvinceCity(province, city),
    getCenterTypeProvinceCitySeo(dbType, province, city),
    getCenterTypeProvinceSeo(dbType, province),
  ]);

  if (!provinceName || !cityName) notFound();

  const filtered = centers.filter((c) => c.type === dbType);

  const seo = citySeo || provinceSeo;
  const introHtml = citySeo?.intro_es?.trim() || null;
  const faqs = Array.isArray(seo?.faq_es) ? seo!.faq_es.filter((q) => q.question && q.answer) : [];

  const otherCities = await getCitiesForCenterTypeProvince(dbType, province, city, 1);
  const topOtherCities = otherCities.slice(0, 8);

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <p className="text-sm font-semibold text-terracotta-700 uppercase tracking-wider mb-2">
              {provinceName}
            </p>
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              Centros de {label} en {cityName}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {filtered.length} centro{filtered.length !== 1 ? 's' : ''} de {label.toLowerCase()} en {cityName}, {provinceName}
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
          <Link href={`/es/centros/${urlType}/${province}`} className="hover:text-terracotta-600">{provinceName}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cityName}</span>
        </nav>

        {introHtml && (
          <div className="max-w-4xl mb-10 bg-gradient-to-br from-sand-50 to-cream-50 border border-sand-200 rounded-2xl p-6 md:p-8">
            <div
              className="prose prose-sand max-w-none text-[#44362b] leading-relaxed prose-p:mb-3 prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          </div>
        )}

        {Array.isArray(citySeo?.sections_es) && citySeo!.sections_es.length > 0 && (
          <SeoSections sections={citySeo!.sections_es} className="mb-12" />
        )}

        {filtered.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-12 px-6 bg-white border border-sand-200 rounded-2xl">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-2xl text-foreground mb-3">
              Aún no tenemos centros de {label.toLowerCase()} verificados en {cityName}
            </p>
            <p className="text-[#7a6b5d] mb-8 max-w-xl mx-auto">
              Si conoces un centro de {label.toLowerCase()} en {cityName} que encaje con Retiru, ayúdanos a añadirlo.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/es/centros/${urlType}/${province}`}
                className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
              >
                Ver todos los centros de {label} en {provinceName}
              </Link>
              <Link
                href="/es/para-organizadores"
                className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sand-50 transition-colors"
              >
                Registra tu centro
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

        {topOtherCities.length > 0 && (
          <section className="mt-12 max-w-4xl">
            <h2 className="font-serif text-xl text-foreground mb-4">
              Otras zonas de {provinceName} con centros de {label.toLowerCase()}
            </h2>
            <div className="flex flex-wrap gap-2">
              {topOtherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/es/centros/${urlType}/${province}/${c.slug}`}
                  className="px-4 py-2 bg-white border border-sand-200 rounded-full text-sm text-foreground hover:bg-sand-50 hover:border-sand-300 transition-colors"
                >
                  {c.name} <span className="text-[#a09383]">({c.count})</span>
                </Link>
              ))}
              <Link
                href={`/es/centros/${urlType}/${province}`}
                className="px-4 py-2 bg-terracotta-50 border border-terracotta-200 rounded-full text-sm text-terracotta-700 hover:bg-terracotta-100 transition-colors font-medium"
              >
                Ver toda la provincia →
              </Link>
            </div>
          </section>
        )}

        <SeoFaqSection
          items={faqs}
          heading={`Preguntas frecuentes sobre ${label.toLowerCase()} en ${cityName}`}
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
              { name: cityName, url: `/es/centros/${urlType}/${province}/${city}` },
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
