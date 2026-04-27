// /en/centers/[type]/[province]/[city] — Centers by type, province and city/neighborhood
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
import { getCenterTypeLabel, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import {
  generatePageMetadata,
  jsonLdItemList,
  jsonLdBreadcrumb,
  jsonLdFAQ,
  jsonLdScript,
} from '@/lib/seo';
import SeoSections, { SeoFaqSection } from '@/components/seo/SeoSections';

export const revalidate = 3600;

const TYPE_ES_SLUG: Record<string, string> = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };
const VALID_CENTER_TYPES = new Set(['yoga', 'meditation', 'ayurveda']);

export async function generateStaticParams() {
  const triples = await getCenterTypeProvinceCityTriples(2);
  return triples.map((t) => ({ type: t.type, province: t.provinceSlug, city: t.citySlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; province: string; city: string }>;
}): Promise<Metadata> {
  const { type, province, city } = await params;
  if (!VALID_CENTER_TYPES.has(type)) return {};
  const label = getCenterTypeLabel(type, 'en');

  const [{ centers, provinceName, cityName }, seo] = await Promise.all([
    getCentersByProvinceCity(province, city),
    getCenterTypeProvinceCitySeo(type, province, city),
  ]);
  const filtered = centers.filter((c) => c.type === type);
  const cName = cityName || city;
  const pName = provinceName || province;
  const esSlug = TYPE_ES_SLUG[type] || type;
  const hasCenters = filtered.length > 0;

  return generatePageMetadata({
    title:
      (seo?.meta_title_en && seo.meta_title_en.trim()) ||
      `${label} Centers in ${cName} (${pName}) | Retiru`,
    description:
      (seo?.meta_description_en && seo.meta_description_en.trim()) ||
      `Find ${label.toLowerCase()} centers in ${cName}, ${pName}. Verified directory with real reviews, location and services.`,
    locale: 'en',
    path: `/en/centers/${type}/${province}/${city}`,
    altPath: `/es/centros/${esSlug}/${province}/${city}`,
    keywords: [`${label.toLowerCase()} centers in ${cName}`, `${label.toLowerCase()} ${cName}`, 'retiru'],
    noIndex: !hasCenters || Boolean(seo?.suppress_reason),
  });
}

export default async function CentersTypeProvinceCityPage({
  params,
}: {
  params: Promise<{ type: string; province: string; city: string }>;
}) {
  const { type, province, city } = await params;
  if (!type || !VALID_CENTER_TYPES.has(type)) notFound();
  const label = getCenterTypeLabel(type, 'en');

  const [{ centers, provinceName, cityName }, citySeo, provinceSeo] = await Promise.all([
    getCentersByProvinceCity(province, city),
    getCenterTypeProvinceCitySeo(type, province, city),
    getCenterTypeProvinceSeo(type, province),
  ]);

  if (!provinceName || !cityName) notFound();

  const filtered = centers.filter((c) => c.type === type);
  const seo = citySeo || provinceSeo;
  const introHtml = citySeo?.intro_en?.trim() || null;
  const faqs = Array.isArray(seo?.faq_en) ? seo!.faq_en.filter((q) => q.question && q.answer) : [];

  const otherCities = await getCitiesForCenterTypeProvince(type, province, city, 1);
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
              {label} Centers in {cityName}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {filtered.length} {label.toLowerCase()} center{filtered.length !== 1 ? 's' : ''} in {cityName}, {provinceName}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch locale="en" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link href="/en" className="hover:text-terracotta-600">Home</Link>
          <span>/</span>
          <Link href="/en/centers-retiru" className="hover:text-terracotta-600">Centers</Link>
          <span>/</span>
          <Link href={`/en/centers/${type}`} className="hover:text-terracotta-600">{label} Centers</Link>
          <span>/</span>
          <Link href={`/en/centers/${type}/${province}`} className="hover:text-terracotta-600">{provinceName}</Link>
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

        {Array.isArray(citySeo?.sections_en) && citySeo!.sections_en.length > 0 && (
          <SeoSections sections={citySeo!.sections_en} className="mb-12" />
        )}

        {filtered.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-12 px-6 bg-white border border-sand-200 rounded-2xl">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-2xl text-foreground mb-3">
              We don't have verified {label.toLowerCase()} centers in {cityName} yet
            </p>
            <p className="text-[#7a6b5d] mb-8 max-w-xl mx-auto">
              If you know a {label.toLowerCase()} center in {cityName} that fits Retiru, help us add it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/en/centers/${type}/${province}`}
                className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors"
              >
                All {label} centers in {provinceName}
              </Link>
              <Link
                href="/en/for-organizers"
                className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-sand-50 transition-colors"
              >
                List your center
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
                  href={`/en/center/${c.slug}`}
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
                      const raw = c.description_en;
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
              Other areas in {provinceName} with {label.toLowerCase()} centers
            </h2>
            <div className="flex flex-wrap gap-2">
              {topOtherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/en/centers/${type}/${province}/${c.slug}`}
                  className="px-4 py-2 bg-white border border-sand-200 rounded-full text-sm text-foreground hover:bg-sand-50 hover:border-sand-300 transition-colors"
                >
                  {c.name} <span className="text-[#a09383]">({c.count})</span>
                </Link>
              ))}
              <Link
                href={`/en/centers/${type}/${province}`}
                className="px-4 py-2 bg-terracotta-50 border border-terracotta-200 rounded-full text-sm text-terracotta-700 hover:bg-terracotta-100 transition-colors font-medium"
              >
                See entire province →
              </Link>
            </div>
          </section>
        )}

        <SeoFaqSection
          items={faqs}
          heading={`Frequently asked questions about ${label.toLowerCase()} in ${cityName}`}
          className="mt-16"
        />

        {filtered.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(filtered.map((c, i) => ({
                name: c.name,
                url: `/en/center/${c.slug}`,
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
              { name: 'Home', url: '/en' },
              { name: 'Centers', url: '/en/centers-retiru' },
              { name: `${label} Centers`, url: `/en/centers/${type}` },
              { name: provinceName, url: `/en/centers/${type}/${province}` },
              { name: cityName, url: `/en/centers/${type}/${province}/${city}` },
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
