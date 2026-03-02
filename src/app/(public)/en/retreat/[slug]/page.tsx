// ============================================================================
// RETIRU · RETREAT DETAIL — /en/retreat/[slug]
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRetreatBySlug } from '@/lib/data';
import { generatePageMetadata, jsonLdEvent, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';
import { Star, MapPin, Calendar, Clock, Users, Globe, Shield, Zap, Heart, Share2, ChevronRight, Check, X as XIcon } from 'lucide-react';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80';

function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

function durationLabel(days: number) {
  if (days <= 1) return '1 day';
  return `${days} days · ${days - 1} nights`;
}

export async function generateStaticParams() {
  const { getRetreatSlugs } = await import('@/lib/data');
  const slugs = await getRetreatSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) return {};

  const coverImg = retreat.images?.find((i) => i.is_cover)?.url
    ?? retreat.images?.[0]?.url
    ?? PLACEHOLDER_IMG;

  return generatePageMetadata({
    title: `${retreat.title_en || retreat.title_es} — Retiru`,
    description: retreat.summary_en || retreat.summary_es,
    locale: 'en',
    path: `/en/retreat/${retreat.slug}`,
    altPath: `/es/retiro/${retreat.slug}`,
    ogImage: coverImg,
    ogType: 'website',
    keywords: [
      'retreat',
      (retreat.title_en || retreat.title_es).toLowerCase(),
      retreat.destination?.name_en?.toLowerCase() ?? retreat.destination?.name_es?.toLowerCase() ?? 'spain',
      'wellness',
      ...(retreat.categories?.map((c) => (c.name_en || c.name_es).toLowerCase()) ?? []),
    ],
  });
}

export default async function RetreatDetailPageEN({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) notFound();

  const r = retreat;

  const sortedImages = [...(r.images ?? [])].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });
  const hasImages = sortedImages.length > 0;

  const location = r.destination
    ? `${r.destination.name_en || r.destination.name_es}${r.destination.region ? `, ${r.destination.region}` : ''}`
    : r.address ?? '';

  const availability: 'InStock' | 'SoldOut' | 'LimitedAvailability' =
    r.available_spots === 0 ? 'SoldOut' : r.available_spots <= 3 ? 'LimitedAvailability' : 'InStock';

  const eventLd = jsonLdEvent({
    name: r.title_en || r.title_es,
    description: r.summary_en || r.summary_es,
    startDate: r.start_date,
    endDate: r.end_date,
    location,
    image: sortedImages[0]?.url ?? PLACEHOLDER_IMG,
    price: r.total_price,
    currency: r.currency,
    url: `/en/retreat/${r.slug}`,
    organizer: r.organizer?.business_name ?? 'Retiru',
    availability,
    rating: r.avg_rating > 0 ? r.avg_rating : undefined,
    reviewCount: r.review_count > 0 ? r.review_count : undefined,
  });

  const breadcrumbLd = jsonLdBreadcrumb([
    { name: 'Home', url: '/en' },
    { name: 'Retreats', url: '/en/retreats-retiru' },
    { name: r.title_en || r.title_es, url: `/en/retreat/${r.slug}` },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />

      {/* Image Gallery */}
      <section className="bg-sand-100">
        <div className="container-wide py-4">
          {hasImages ? (
            <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 rounded-2xl overflow-hidden" style={{ maxHeight: '480px' }}>
              <div className="md:col-span-2 md:row-span-2 relative">
                <img src={sortedImages[0].url} alt={sortedImages[0].alt_text ?? (r.title_en || r.title_es)} className="h-full w-full object-cover" style={{ minHeight: '300px' }} />
              </div>
              {sortedImages.slice(1, 5).map((img, i) => (
                <div key={img.id ?? i} className="hidden md:block relative">
                  <img src={img.url} alt={img.alt_text ?? ''} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl bg-sand-200 text-muted-foreground" style={{ height: '320px' }}>
              <span className="text-sm">No images available</span>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="container-wide py-8">
        <div className="flex gap-10">
          <div className="flex-1 max-w-3xl">
            <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
              <Link href="/en" className="hover:text-terracotta-600">Home</Link>
              <ChevronRight size={12} />
              <Link href="/en/retreats-retiru" className="hover:text-terracotta-600">Retreats</Link>
              <ChevronRight size={12} />
              <span className="text-foreground">{r.title_en || r.title_es}</span>
            </nav>

            <div className="mb-6">
              <div className="mb-2 flex flex-wrap gap-2">
                {r.categories?.map((cat) => (
                  <span key={cat.id} className="badge-sand">{cat.name_en || cat.name_es}</span>
                ))}
                {r.confirmation_type === 'automatic' && <span className="badge-sage"><Zap size={12} /> Instant confirmation</span>}
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">{r.title_en || r.title_es}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {location && <span className="flex items-center gap-1"><MapPin size={15} /> {location}</span>}
                <span className="flex items-center gap-1"><Calendar size={15} /> {formatDate(r.start_date)} — {formatDate(r.end_date)}</span>
                <span className="flex items-center gap-1"><Clock size={15} /> {durationLabel(r.duration_days)}</span>
                {r.review_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={15} className="fill-terracotta-500 text-terracotta-500" />
                    <strong className="text-foreground">{r.avg_rating.toFixed(1)}</strong> ({r.review_count} reviews)
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <button className="btn-ghost text-sm"><Heart size={16} /> Save</button>
                <button className="btn-ghost text-sm"><Share2 size={16} /> Share</button>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="mb-4 font-serif text-2xl font-semibold">About this retreat</h2>
              <div className="prose prose-sand text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                {r.description_en || r.description_es}
              </div>
            </section>

            <section className="mb-10 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-serif text-xl font-semibold">What&apos;s included</h3>
                <ul className="space-y-2">
                  {(r.includes_en ?? r.includes_es ?? []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-sage-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 font-serif text-xl font-semibold">Not included</h3>
                <ul className="space-y-2">
                  {(r.excludes_en ?? r.excludes_es ?? []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XIcon size={16} className="mt-0.5 shrink-0 text-sand-400" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {r.schedule?.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-serif text-2xl font-semibold">Schedule</h2>
                <div className="space-y-4">
                  {r.schedule.map((day) => (
                    <div key={day.day} className="rounded-xl border border-sand-200 p-5">
                      <h4 className="mb-2 font-semibold text-foreground">Day {day.day}: {day.title_en || day.title_es}</h4>
                      <ul className="space-y-1">
                        {day.items.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{item.time} {item.title_en || item.title_es}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {r.organizer && (
              <section className="mb-10 rounded-2xl border border-sand-200 p-6">
                <h2 className="mb-4 font-serif text-2xl font-semibold">Organizer</h2>
                <div className="flex items-center gap-4">
                  {r.organizer.logo_url ? (
                    <img src={r.organizer.logo_url} alt={r.organizer.business_name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-xl font-bold text-sage-700">
                      {r.organizer.business_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{r.organizer.business_name}</h3>
                      {r.organizer.status === 'verified' && <Shield size={16} className="text-sage-600" />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {r.organizer.review_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-terracotta-500 text-terracotta-500" /> {r.organizer.avg_rating.toFixed(1)} ({r.organizer.review_count} reviews)
                        </span>
                      )}
                      <span>{r.organizer.total_retreats} retreats</span>
                    </div>
                  </div>
                </div>
                <Link href={`/en/organizer/${r.organizer.slug}`} className="btn-outline mt-4 text-sm">
                  View full profile
                </Link>
              </section>
            )}

            {r.cancellation_policy?.refund_tiers?.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-serif text-2xl font-semibold">Cancellation policy</h2>
                <div className="rounded-xl bg-cream-100 p-5">
                  <p className="mb-3 text-sm font-medium text-foreground">{r.cancellation_policy.type} cancellation</p>
                  <ul className="space-y-2">
                    {r.cancellation_policy.refund_tiers.map((tier, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`h-2 w-2 rounded-full ${tier.refund_percent === 100 ? 'bg-sage-500' : tier.refund_percent > 0 ? 'bg-yellow-500' : 'bg-red-400'}`} />
                        More than {tier.days_before} days before: {tier.refund_percent}% refund
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {r.cancellation_policy.platform_fee_refundable
                      ? 'Retiru\'s management fee (20%) is refundable.'
                      : 'Retiru\'s management fee (20%) is non-refundable.'}
                  </p>
                </div>
              </section>
            )}

            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold">Reviews</h2>
                {r.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <Star size={20} className="fill-terracotta-500 text-terracotta-500" />
                    <span className="text-xl font-bold">{r.avg_rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">· {r.review_count} reviews</span>
                  </div>
                )}
              </div>
              {r.review_count === 0 ? (
                <div className="rounded-xl border border-sand-200 p-8 text-center">
                  <p className="text-sm text-muted-foreground">No reviews yet for this retreat. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="rounded-xl border border-sand-200 p-5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={20} className={j < Math.round(r.avg_rating) ? 'fill-terracotta-500 text-terracotta-500' : 'text-sand-300'} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.review_count} reviews · Average rating {r.avg_rating.toFixed(1)}/5</p>
                </div>
              )}
            </section>
          </div>

          {/* Booking Sidebar (desktop) */}
          <aside className="hidden w-96 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-elevated">
                <div className="mb-4 text-center">
                  <span className="text-sm text-muted-foreground">Total price</span>
                  <p className="text-3xl font-bold text-foreground">{r.total_price}€ <span className="text-base font-normal text-muted-foreground">/ person</span></p>
                </div>

                <div className="mb-6 rounded-xl bg-cream-100 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retiru fee (20%)</span>
                    <span className="font-semibold text-terracotta-600">{r.platform_fee}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To organizer (80%)</span>
                    <span className="font-semibold">{r.organizer_amount}€</span>
                  </div>
                  <hr className="border-sand-300" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You pay <strong>{r.platform_fee}€</strong> to Retiru today · The rest ({r.organizer_amount}€) goes to the organizer before the retreat.
                  </p>
                </div>

                <div className="mb-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} /> {formatDate(r.start_date)} — {formatDate(r.end_date)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} /> {durationLabel(r.duration_days)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span className={r.available_spots <= 3 ? 'text-terracotta-600 font-semibold' : ''}>
                      {r.available_spots === 0
                        ? 'No spots available'
                        : r.available_spots <= 3
                          ? `Only ${r.available_spots} spots left!`
                          : `${r.available_spots} spots available`}
                    </span>
                  </div>
                  {r.languages?.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe size={16} /> {r.languages.join(', ')}
                    </div>
                  )}
                  {r.confirmation_type === 'automatic' && (
                    <div className="flex items-center gap-2 text-sage-600 font-medium">
                      <Zap size={16} /> Instant confirmation
                    </div>
                  )}
                </div>

                <button className="btn-primary w-full py-4 text-base" disabled={r.available_spots === 0}>
                  {r.available_spots === 0 ? 'Sold out' : `Book your spot · ${r.platform_fee}€`}
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <Shield size={12} className="inline mr-1" />
                  Secure payment with Stripe · You won&apos;t be charged yet
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky CTA mobile */}
      <div className="sticky-cta lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{r.total_price}€</p>
            <p className="text-xs text-muted-foreground">Pay today {r.platform_fee}€</p>
          </div>
          <button className="btn-primary px-8 py-3" disabled={r.available_spots === 0}>
            {r.available_spots === 0 ? 'Sold out' : `Book your spot · ${r.platform_fee}€`}
          </button>
        </div>
      </div>
    </div>
  );
}
