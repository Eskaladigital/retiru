import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import EventosSearch from '@/components/home/EventosSearch';
import {
  getCategoryDestinationPairs,
  getCategoryBySlug,
  getDestinationBySlug,
  getPublishedRetreats,
} from '@/lib/data';
import { getOrganizerReviewStats, organizerHasRatingToShow, CATEGORY_SLUG_EN, CATEGORY_SLUG_FROM_EN } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const pairs = await getCategoryDestinationPairs();
  return pairs.map(p => ({ category: CATEGORY_SLUG_EN[p.category] || p.category, destination: p.destination }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; destination: string }> }): Promise<Metadata> {
  const { category: enSlug, destination } = await params;
  const dbSlug = CATEGORY_SLUG_FROM_EN[enSlug] || enSlug;
  const [cat, dest] = await Promise.all([getCategoryBySlug(dbSlug), getDestinationBySlug(destination)]);
  const catName = cat?.name_en || enSlug;
  const destName = dest?.name_en || destination;
  return generatePageMetadata({
    title: `${catName} Retreats in ${destName} | Retiru`,
    description: `Book ${catName.toLowerCase()} retreats in ${destName}. Transparent pricing, real reviews and secure booking on Retiru.`,
    locale: 'en',
    path: `/en/retreats-${enSlug}/${destination}`,
    altPath: `/es/retiros-${dbSlug}/${destination}`,
    keywords: [`${catName.toLowerCase()} retreats in ${destName}`, `${catName.toLowerCase()} ${destName}`, 'retiru'],
  });
}

export default async function RetreatsCategoryDestinationPage({ params }: { params: Promise<{ category: string; destination: string }> }) {
  const { category: enSlug, destination } = await params;
  const dbSlug = CATEGORY_SLUG_FROM_EN[enSlug] || enSlug;
  const [cat, dest, { retreats, total }] = await Promise.all([
    getCategoryBySlug(dbSlug),
    getDestinationBySlug(destination),
    getPublishedRetreats({ categorySlug: dbSlug, destinationSlug: destination, limit: 50 }),
  ]);

  if (!cat || !dest) {
    return (
      <div className="container-wide py-12">
        <Link href={`/en/retreats-${enSlug}`} className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Link>
        <p className="font-serif text-xl text-foreground">Page not found</p>
      </div>
    );
  }

  const combinedFaq = [
    ...(Array.isArray(cat.faq) ? cat.faq : []),
    ...(Array.isArray(dest.faq) ? dest.faq : []),
  ].slice(0, 8);

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {dest.cover_image_url ? (
            <>
              <Image src={dest.cover_image_url} alt={`${cat.name_en} Retreats in ${dest.name_en}`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              {cat.name_en} Retreats in {dest.name_en}
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} {cat.name_en.toLowerCase()} retreat{total !== 1 ? 's' : ''} in {dest.name_en}
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <EventosSearch locale="en" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8 flex-wrap">
          <Link href="/en" className="hover:text-terracotta-600">Home</Link>
          <span>/</span>
          <Link href="/en/retreats-retiru" className="hover:text-terracotta-600">Retreats</Link>
          <span>/</span>
          <Link href={`/en/retreats-${enSlug}`} className="hover:text-terracotta-600">{cat.name_en} Retreats</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{dest.name_en}</span>
        </nav>

        <div className="prose prose-sand max-w-3xl mb-10">
          {cat.intro_en && <div dangerouslySetInnerHTML={{ __html: cat.intro_en.replace(/\n/g, '<br/>') }} />}
          {dest.intro_en && <div dangerouslySetInnerHTML={{ __html: dest.intro_en.replace(/\n/g, '<br/>') }} />}
        </div>

        {retreats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">Coming soon: {cat.name_en} retreats in {dest.name_en}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Browse all {cat.name_en.toLowerCase()} retreats or retreats in {dest.name_en}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/en/retreats-${enSlug}`} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">{cat.name_en} Retreats</Link>
              <Link href={`/en/retreats-retiru/${destination}`} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Retreats in {dest.name_en}</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {retreats.map(r => {
              const coverImg = r.images?.find((i: any) => i.is_cover)?.url || r.images?.[0]?.url || '';
              const destName = r.destination?.name_en || dest.name_en;
              const spotsLow = (r.available_spots ?? 0) <= 3 && (r.available_spots ?? 0) > 0;
              const { avg_rating: orgAvg, review_count: orgReviews } = getOrganizerReviewStats(r);
              const showOrgRating = organizerHasRatingToShow(r);
              return (
                <Link
                  key={r.id}
                  href={`/en/retreat/${r.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
                    {coverImg ? (
                      <Image src={coverImg} alt={r.title_en || r.title_es} fill loading="lazy" className="object-cover transition-transform duration-[600ms] group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-sand-300">🧘</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {destName}</span>
                      {showOrgRating && (
                        <span className="text-[13px] font-semibold flex items-center gap-1">
                          <Star size={13} className="text-amber-400 fill-amber-400" /> {orgAvg.toFixed(1)}
                          <span className="font-normal text-[#7a6b5d]">({orgReviews})</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{r.title_en || r.title_es}</h3>
                    <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-3">
                      {r.start_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(r.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {r.end_date && ` – ${new Date(r.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </span>
                      )}
                      {r.duration_days && (
                        <>
                          <span className="text-[#a09383]">·</span>
                          <span>{r.duration_days} days</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span>
                        <span className="text-2xl font-bold leading-none mt-0.5">€{r.total_price} <span className="text-sm font-normal text-[#7a6b5d]">/person</span></span>
                      </div>
                      {(r.available_spots ?? 0) > 0 && (
                        <span className={`text-[13px] font-medium flex items-center gap-1 ${spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                          <Users size={14} />
                          {r.available_spots} spots
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {combinedFaq.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {combinedFaq.map((item, i) => (
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

        {retreats.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(retreats.map((r, i) => ({
                name: r.title_en || r.title_es,
                url: `/en/retreat/${r.slug}`,
                image: r.images?.find((img: any) => img.is_cover)?.url || r.images?.[0]?.url,
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
              { name: 'Retreats', url: '/en/retreats-retiru' },
              { name: `${cat.name_en} Retreats`, url: `/en/retreats-${enSlug}` },
              { name: dest.name_en, url: `/en/retreats-${enSlug}/${destination}` },
            ])),
          }}
        />
        {combinedFaq.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(combinedFaq)) }}
          />
        )}
      </div>
    </>
  );
}
