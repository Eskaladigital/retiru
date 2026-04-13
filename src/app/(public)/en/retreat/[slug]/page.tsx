// ============================================================================
// RETIRU · RETREAT DETAIL — /en/retreat/[slug]
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRetreatBySlug } from '@/lib/data';
import { createStaticSupabase } from '@/lib/supabase/server';
import { generatePageMetadata, jsonLdEvent, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';
import { Star, MapPin, Calendar, Clock, Users, Globe, Shield, Zap, Heart, Share2, ChevronRight, Check, X as XIcon } from 'lucide-react';
import AskOrganizerButton from '@/components/messaging/AskOrganizerButton';
import ReserveButton from '@/components/booking/ReserveButton';
import { RetreatDescriptionBody, LinkifyText } from '@/components/ui/retreat-description-body';
import { CATEGORY_SLUG_EN } from '@/lib/utils';

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
    description:
      retreat.summary_en ||
      `${retreat.title_en || retreat.title_es}: yoga, meditation or ayurveda retreat in Spain — details and booking on Retiru.`,
    locale: 'en',
    path: `/en/retreat/${retreat.slug}`,
    altPath: `/es/retiro/${retreat.slug}`,
    ogImage: coverImg,
    ogType: 'website',
    keywords: [
      'retreat',
      (retreat.title_en || retreat.title_es).toLowerCase(),
      retreat.destination?.name_en?.toLowerCase() ?? retreat.destination?.name_es?.toLowerCase() ?? 'spain',
      'yoga',
      'meditation',
      'ayurveda',
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

  const minViable = r.min_attendees ?? 1;
  const confirmedCount = r.confirmed_bookings ?? 0;

  let reservedCount = 0;
  if (minViable > 1) {
    const sb = createStaticSupabase();
    const { count } = await sb
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', r.id)
      .eq('status', 'reserved_no_payment');
    reservedCount = count ?? 0;
  }
  const minReached = (confirmedCount + reservedCount) >= minViable;

  const eventLd = jsonLdEvent({
    name: r.title_en || r.title_es,
    description:
      r.summary_en ||
      `${r.title_en || r.title_es}: yoga, meditation or ayurveda retreat in Spain — book on Retiru.`,
    startDate: r.start_date,
    endDate: r.end_date,
    location,
    image: sortedImages[0]?.url ?? PLACEHOLDER_IMG,
    price: r.total_price,
    currency: r.currency,
    url: `/en/retreat/${r.slug}`,
    organizer: r.organizer?.business_name ?? 'Retiru',
    availability,
    rating: r.review_count > 0 ? r.avg_rating : ((r.organizer?.review_count ?? 0) > 0 ? r.organizer?.avg_rating : undefined),
    reviewCount: r.review_count > 0 ? r.review_count : ((r.organizer?.review_count ?? 0) > 0 ? r.organizer?.review_count : undefined),
  });

  const primaryCat = r.categories?.[0];
  const primaryCatEnSlug = primaryCat ? (CATEGORY_SLUG_EN[primaryCat.slug] || primaryCat.slug) : '';
  const breadcrumbItems = [
    { name: 'Home', url: '/en' },
    { name: 'Retreats', url: '/en/retreats-retiru' },
    ...(primaryCat ? [{ name: `${primaryCat.name_en} Retreats`, url: `/en/retreats-${primaryCatEnSlug}` }] : []),
    { name: r.title_en || r.title_es, url: `/en/retreat/${r.slug}` },
  ];
  const breadcrumbLd = jsonLdBreadcrumb(breadcrumbItems);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />

      {/* Cover + full gallery */}
      <section className="bg-sand-100 pt-20 md:pt-[72px]">
        <div className="container-wide py-4 space-y-3">
          {hasImages ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-sand-200/80 bg-sand-200/30">
                <img
                  src={sortedImages[0].url}
                  alt={sortedImages[0].alt_text ?? (r.title_en || r.title_es)}
                  className="w-full object-cover min-h-[220px] max-h-[min(480px,55vh)] md:max-h-[520px]"
                />
              </div>
              {sortedImages.length > 1 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7a6b5d] mb-2">Retreat gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {sortedImages.slice(1).map((img, i) => (
                      <div
                        key={img.id ?? `${img.url}-${i}`}
                        className="relative rounded-xl overflow-hidden border border-sand-200/80 aspect-[4/3] bg-sand-200/30"
                      >
                        <img
                          src={img.url}
                          alt={img.alt_text ?? `${r.title_en || r.title_es} — photo ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
            <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              <Link href="/en" className="hover:text-terracotta-600">Home</Link>
              <ChevronRight size={12} />
              <Link href="/en/retreats-retiru" className="hover:text-terracotta-600">Retreats</Link>
              {primaryCat && (
                <>
                  <ChevronRight size={12} />
                  <Link href={`/en/retreats-${primaryCatEnSlug}`} className="hover:text-terracotta-600">{primaryCat.name_en} Retreats</Link>
                </>
              )}
              <ChevronRight size={12} />
              <span className="text-foreground">{r.title_en || r.title_es}</span>
            </nav>

            <div className="mb-6">
              <div className="mb-2 flex flex-wrap gap-2">
                {r.categories?.map((cat) => (
                  <Link key={cat.id} href={`/en/retreats-${CATEGORY_SLUG_EN[cat.slug] || cat.slug}`} className="badge-sand hover:bg-sand-200 transition-colors">{cat.name_en || cat.name_es}</Link>
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
              {r.description_en ? (
                <RetreatDescriptionBody content={r.description_en} />
              ) : r.description_es ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We are adding an English description for this retreat.{' '}
                  <Link href={`/es/retiro/${slug}`} className="font-semibold text-terracotta-600 hover:text-terracotta-700">
                    View in Spanish
                  </Link>
                </p>
              ) : null}
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
                          <li key={i} className="text-sm text-muted-foreground">{item.time} <LinkifyText>{item.title_en || item.title_es}</LinkifyText></li>
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
                    The percentage applies to the total amount you paid. If a refund applies, you receive that amount in full to your original payment method. Retiru&apos;s remuneration in cancellation cases is handled under our agreement with the organizer and is not an extra deduction from your refund.
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
                <div className="mb-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{r.total_price}€ <span className="text-base font-normal text-muted-foreground">/ person</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {minReached ? 'Single payment · All inclusive' : 'Reserve without payment · Pay when minimum is reached'}
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
                  {minViable > 1 && (
                    <div className="rounded-lg bg-sand-50 border border-sand-200/80 p-3 text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Minimum participants:</strong> {minViable}.
                      {minReached ? (
                        <span className="block mt-1.5 text-sage-700 font-medium">The minimum has been met. This retreat will take place.</span>
                      ) : (
                        <>
                          <span className="block mt-1.5">{confirmedCount + reservedCount} of {minViable} spots reserved.</span>
                          <span className="block mt-1 text-terracotta-600 font-medium">Reserve your spot with no payment commitment. You only pay once the minimum is reached.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <ReserveButton
                  retreatId={r.id}
                  retreatSlug={r.slug}
                  totalPrice={r.total_price}
                  availableSpots={r.available_spots}
                  minReached={minReached}
                  locale="en"
                  className="w-full py-4 text-base"
                />

                <div className="mt-4 rounded-lg bg-sage-50/60 border border-sage-200/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    <Shield size={12} className="inline mr-1 text-sage-600" />
                    {minReached
                      ? '100% secure payment with Stripe · Refund per cancellation policy'
                      : 'Free reservation · You only pay when the retreat is confirmed'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                    Visa, Mastercard & more · Your data never touches our servers
                  </p>
                </div>

                <div className="mt-4">
                  <AskOrganizerButton retreatId={r.id} locale="en" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky CTA mobile */}
      <div className="sticky-cta lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0">
            <p className="text-lg font-bold text-foreground">{r.total_price}€</p>
            <p className="text-[10px] text-muted-foreground">per person · <Shield size={10} className="inline" /> Secure payment</p>
          </div>
          <div className="flex items-center gap-2">
            <AskOrganizerButton retreatId={r.id} locale="en" compact />
            <ReserveButton
              retreatId={r.id}
              retreatSlug={r.slug}
              totalPrice={r.total_price}
              availableSpots={r.available_spots}
              minReached={minReached}
              locale="en"
              className="px-6 py-3 whitespace-nowrap"
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
