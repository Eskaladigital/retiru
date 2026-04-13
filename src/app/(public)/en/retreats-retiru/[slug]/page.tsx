// /en/retreats-retiru/[slug] — Retreats filtered by destination (real Supabase data)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import { getDestinationsWithRetreats, getDestinationBySlug, getPublishedRetreats } from '@/lib/data';
import { getOrganizerReviewStats, organizerHasRatingToShow, CATEGORY_SLUG_EN } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdScript } from '@/lib/seo';

export const revalidate = 3600;

export async function generateStaticParams() {
  const destinations = await getDestinationsWithRetreats();
  return destinations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);
  const name = dest?.name_en || dest?.name_es || slug;
  return generatePageMetadata({
    title: `Retreats in ${name} — Yoga, meditation & ayurveda | Retiru`,
    description: `Discover yoga, meditation and ayurveda retreats and events in ${name}. Book with full transparency.`,
    locale: 'en',
    path: `/en/retreats-retiru/${slug}`,
    altPath: `/es/retiros-retiru/${slug}`,
    keywords: ['retreats ' + name, 'yoga ' + name, 'meditation ' + name, 'ayurveda ' + name],
  });
}

export default async function RetreatsByDestinationPageEN({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);

  if (!dest) {
    return (
      <div className="container-wide py-12">
        <Link href="/en/retreats-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          All retreats
        </Link>
        <p className="font-serif text-xl text-foreground">Destination not found</p>
      </div>
    );
  }

  const { retreats, total } = await getPublishedRetreats({ destinationSlug: slug, limit: 50 });
  const destName = dest.name_en || dest.name_es;

  return (
    <div className="container-wide py-10">
      <Link href="/en/retreats-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        All retreats
      </Link>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Retreats in {destName}</h1>
      <p className="text-sm text-[#a09383] mb-6">{total} retreat{total !== 1 ? 's' : ''} in {destName}</p>

      {(() => {
        const catMap = new Map<string, { slug: string; name: string }>();
        retreats.forEach(r => r.categories?.forEach((c: any) => { if (!catMap.has(c.slug)) catMap.set(c.slug, { slug: c.slug, name: c.name_en || c.name_es }); }));
        const cats = Array.from(catMap.values());
        return cats.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-xs text-muted-foreground self-center mr-1">Filter by category:</span>
            {cats.map(c => (
              <Link key={c.slug} href={`/en/retreats-${CATEGORY_SLUG_EN[c.slug] || c.slug}/${slug}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-sand-100 text-[#7a6b5d] border border-sand-200 hover:bg-sand-200 transition-colors">{c.name}</Link>
            ))}
          </div>
        ) : null;
      })()}

      {retreats.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No retreats in {destName}</p>
          <Link href="/en/retreats-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">View all retreats</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {retreats.map(r => {
            const coverImg = r.images?.find((i: any) => i.is_cover)?.url || r.images?.[0]?.url || '';
            const rDestName = r.destination?.name_en || r.destination?.name_es || destName;
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
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {r.categories?.[0] && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{r.categories[0].name_en || r.categories[0].name_es}</span>
                    )}
                    {r.confirmation_type === 'automatic' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">Instant</span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {rDestName}</span>
                    {showOrgRating && (
                      <span className="text-[13px] font-semibold flex items-center gap-1" title="Organizer rating">
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
                      <span className="text-2xl font-bold leading-none mt-0.5">{r.total_price}€ <span className="text-sm font-normal text-[#7a6b5d]">/person</span></span>
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
    </div>
  );
}
