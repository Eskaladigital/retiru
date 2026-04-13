import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getActiveCenters, getCategoryBySlug, getProvincesForCenterType } from '@/lib/data';
import { getCenterTypeLabel, CATEGORY_SLUG_EN } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

const TYPE_ES_SLUG: Record<string, string> = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };
const VALID_TYPES = ['yoga', 'meditation', 'ayurveda'] as const;

export async function generateStaticParams() {
  return VALID_TYPES.map(t => ({ type: t }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const label = getCenterTypeLabel(type, 'en');
  const esSlug = TYPE_ES_SLUG[type] || type;
  return generatePageMetadata({
    title: `${label} Centers in Spain — Verified Directory | Retiru`,
    description: `Find ${label.toLowerCase()} centers across Spain. Directory with real reviews, location and services. Find your ideal center on Retiru.`,
    locale: 'en',
    path: `/en/centers-${type}`,
    altPath: `/es/centros-${esSlug}`,
    keywords: [`${label.toLowerCase()} centers`, `${label.toLowerCase()} spain`, `${label.toLowerCase()} directory`, 'retiru'],
  });
}

export default async function CentersByTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) notFound();
  const label = getCenterTypeLabel(type, 'en');
  const catSlug = type === 'meditation' ? 'meditacion' : type;

  const [{ centers, total }, provinces, cat] = await Promise.all([
    getActiveCenters({ type, limit: 50 }),
    getProvincesForCenterType(type),
    getCategoryBySlug(catSlug),
  ]);

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cat?.cover_image_url ? (
            <>
              <Image src={cat.cover_image_url} alt={`${label} Centers`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              {label} Centers in Spain
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} {label.toLowerCase()} center{total !== 1 ? 's' : ''} in our directory
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8">
          <Link href="/en" className="hover:text-terracotta-600">Home</Link>
          <span>/</span>
          <Link href="/en/centers-retiru" className="hover:text-terracotta-600">Centers</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{label} Centers</span>
        </nav>

        {cat?.intro_en && (
          <div className="prose prose-sand max-w-3xl mb-10">
            <div dangerouslySetInnerHTML={{ __html: cat.intro_en.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {provinces.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl text-foreground mb-6">{label} centers by province</h2>
            <div className="flex flex-wrap gap-3">
              {provinces.map(p => (
                <Link
                  key={p.slug}
                  href={`/en/centers-${type}/${p.slug}`}
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
            <p className="font-serif text-xl text-foreground mb-2">No {label.toLowerCase()} centers available</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Browse the full directory</p>
            <Link href="/en/centers-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">View full directory</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {centers.map(c => {
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
                        <div className="flex items-center gap-2 mt-1.5">
                          {c.type && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{getCenterTypeLabel(c.type, 'en')}</span>
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
                    {c.description_en && (
                      <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{c.description_en}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cross-link to retreats of same discipline */}
        <section className="mt-12 p-6 bg-sand-50 border border-sand-200 rounded-2xl">
          <h2 className="font-serif text-xl text-foreground mb-2">
            {label} Retreats in Spain
          </h2>
          <p className="text-sm text-[#7a6b5d] mb-4">
            Discover {label.toLowerCase()} retreats and getaways across Spain with transparent pricing.
          </p>
          <Link
            href={`/en/retreats-${CATEGORY_SLUG_EN[catSlug] || catSlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
          >
            Browse {label.toLowerCase()} retreats →
          </Link>
        </section>

        {centers.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(centers.map((c, i) => ({
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
              { name: `${label} Centers`, url: `/en/centers-${type}` },
            ])),
          }}
        />
      </div>
    </>
  );
}
