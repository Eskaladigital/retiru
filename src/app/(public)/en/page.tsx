// ============================================================================
// RETIRU · HOME — /en  (English version, same design as /es)
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { homeEN } from '@/lib/seo/page-metadata';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { getCategories, getDestinations, getHomeShopProducts, getPublishedRetreats } from '@/lib/data';
import { filterPublicRetreatCategories } from '@/lib/utils';

export const metadata: Metadata = homeEN;

/* ── Fallback images ──────────────────────────────────────────────────── */
const CAT_IMAGES: Record<string, string> = {
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  meditacion: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&q=80',
  ayurveda: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
};

const DEST_IMAGES: Record<string, string> = {
  ibiza: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  mallorca: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80',
  'costa-brava': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'sierra-gredos': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
  alpujarra: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
  'picos-europa': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80',
  'valle-jerte': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  lanzarote: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  pirineos: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  murcia: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
};

const DEFAULT_RETREAT_IMG = 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

const TESTIMONIALS = [
  { initials: 'MC', name: 'María C.', event: 'Yoga Retreat Ibiza · Jun 2025', text: 'An incredible experience. Booking was super easy and transparent. I knew exactly what I was paying at every step. The yoga retreat in Ibiza changed my life.' },
  { initials: 'JL', name: 'Jorge L.', event: 'Organizer · 12 retreats published', text: 'As an organizer, Retiru has given me everything I needed. Free dashboard, booking management, QR check-in... I\'ve stopped using Excel and WhatsApp for everything.' },
  { initials: 'ST', name: 'Sarah T.', event: 'Meditation Retreat Mallorca · May 2025', text: 'Found this amazing meditation retreat in Mallorca through Retiru. The whole booking process was clear, with transparent pricing breakdown. Will definitely book again!' },
];

/* ── SVG icon helpers ──────────────────────────────────────────────────── */
const IconSearch = () => <svg className="w-5 h-5 text-[#a09383] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconPin = () => <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCal = () => <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconStar = () => <svg className="w-[14px] h-[14px] text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconStarLg = () => <svg className="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconHeart = () => <svg className="w-[18px] h-[18px] text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const IconChevron = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>;
const IconCheck = () => <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
const IconShield = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconVerified = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconHeartsm = () => <svg className="w-[18px] h-[18px] text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;

export default async function HomePageEN() {
  const [categories, destinations, { retreats }, shopProducts] = await Promise.all([
    getCategories('en'),
    getDestinations('en'),
    getPublishedRetreats({ limit: 3 }),
    getHomeShopProducts(4),
  ]);

  const cats = filterPublicRetreatCategories(categories);
  const dests = destinations.slice(0, 5);
  const popularRetreats = retreats.slice(0, 3);

  return (
    <>
        {/* HERO */}
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80" alt="Person meditating at sunrise" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:via-[rgba(254,253,251,0.8)] max-md:to-[rgba(254,253,251,0.4)]" />
          </div>
          <div className="container-wide relative z-10 pt-24 pb-12 md:py-20">
            <div className="max-w-[620px] md:max-w-[900px]">
              <div className="flex flex-wrap gap-2 mb-6 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-700 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-[float_2s_ease-in-out_infinite]" />
                  850+ centers in Spain
                </div>
                <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-[13px] font-semibold px-4 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full animate-[float_2s_ease-in-out_infinite_0.5s]" />
                  500+ retreats
                </div>
              </div>
              <h1 className="font-serif text-[clamp(36px,6vw,60px)] leading-[1.15] tracking-[-0.01em] text-foreground mb-2 max-w-[600px] animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards] opacity-0">
                <span className="text-terracotta-700 tracking-[-0.02em]">Yoga</span>,{' '}
                <span className="text-sage-700 tracking-[-0.02em]">meditation</span>{' '}
                &amp;{' '}
                <span className="text-amber-700 tracking-[-0.02em]">ayurveda</span>{' '}
                centers &amp; retreats
                <span className="inline-block w-[0.3em] h-[0.3em] bg-terracotta-600 rounded-full animate-[float_3s_ease-in-out_infinite] ml-1 -mb-0.5" />
              </h1>
              <p className="font-serif text-[clamp(18px,3vw,26px)] text-[#7a6b5d] tracking-wide mb-5 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.15s_forwards] opacity-0">
                The directory and booking platform you need
              </p>
              <p className="text-lg text-[#7a6b5d] leading-[1.7] mb-9 max-w-[500px] animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards] opacity-0">
                Find centers near you or book transformative retreats and getaways across Spain. Everything in one place.
              </p>
              <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated animate-[scaleIn_0.6s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards] opacity-0">
                <form action="/en/search" className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors"><IconSearch /><input name="q" type="text" placeholder="Yoga, meditation, ayurveda..." className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans" /></div>
                  <div className="hidden md:block w-px h-8 bg-sand-200" />
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors"><svg className="w-5 h-5 text-[#a09383] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><input name="destination" type="text" placeholder="Where?" className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans" /></div>
                  <div className="hidden md:block w-px h-8 bg-sand-200" />
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors"><IconCal /><input name="dates" type="text" placeholder="When?" className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans" /></div>
                  <button type="submit" className="flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(200,90,48,0.3)] hover:bg-terracotta-700 transition-all whitespace-nowrap">
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Search
                  </button>
                </form>
              </div>
              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-sand-200 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards] opacity-0">
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]"><div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconShield /></div>Secure payments</div>
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]"><div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconVerified /></div>Verified organizers</div>
                <div className="flex items-center gap-2.5 text-sm text-[#7a6b5d]"><div className="w-9 h-9 bg-sage-50 rounded-full flex items-center justify-center shrink-0"><IconHeartsm /></div>Transparent pricing</div>
              </div>
            </div>
          </div>
        </section>

        {/* TWO PILLARS — Centers + Retreats */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Two worlds, one place</h2>
              <p className="text-base text-[#7a6b5d] mt-2 max-w-[520px] mx-auto">Retiru combines the largest center directory with a retreat booking platform</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              <Link href="/en/centers-retiru" className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 p-8 md:p-10 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-5">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <h3 className="font-serif text-2xl md:text-[28px] mb-2">Center directory</h3>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-5">850+ verified yoga, meditation and ayurveda centers across Spain. Find yours near home.</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 group-hover:gap-2.5 transition-all">
                    Explore centers <IconChevron />
                  </span>
                </div>
              </Link>
              <Link href="/en/retreats-retiru" className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-terracotta-600 to-terracotta-700 p-8 md:p-10 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-5">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                  </div>
                  <h3 className="font-serif text-2xl md:text-[28px] mb-2">Retreats &amp; getaways</h3>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-5">Book yoga, meditation and ayurveda retreats with transparent pricing. Secure payments and instant confirmation.</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 group-hover:gap-2.5 transition-all">
                    Explore retreats <IconChevron />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-12 md:py-16 bg-sand-50">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Explore by focus</h2><p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Yoga, meditation or ayurveda — choose your path</p></div>
              <Link href="/en/retreats-retiru" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">View all <IconChevron /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 max-w-4xl mx-auto">
              {cats.map((c) => (
                <Link key={c.slug} href={`/en/retreats-retiru?tipo=${c.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer transition-transform duration-[400ms] hover:-translate-y-1">
                  <ImageWithFallback
                    src={c.cover_image_url || CAT_IMAGES[c.slug] || CAT_IMAGES.yoga}
                    alt={c.name_en || c.name_es}
                    className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.08]"
                    fallbackEmoji="🥤"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.7)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-[28px] mb-2 drop-shadow-md">{c.icon || '✨'}</div>
                    <h3 className="font-serif text-lg text-white">{c.name_en || c.name_es}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED CENTERS */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Featured centers</h2><p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Yoga, meditation &amp; ayurveda directory across Spain</p></div>
              <Link href="/en/centers-retiru" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">View directory <IconChevron /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', rating: 4.9, reviews: 87, services: ['Hatha', 'Vinyasa', 'Ashtanga'], img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&q=80' },
                { slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditation', city: 'Barcelona', rating: 4.8, reviews: 63, services: ['Zen', 'Mindfulness', 'Vipassana'], img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=500&q=80' },
                { slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Seville', rating: 4.9, reviews: 112, services: ['Kundalini', 'Hatha', 'Training'], img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80' },
              ].map((c) => (
                <Link key={c.slug} href={`/en/center/${c.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 hover:shadow-elevated hover:-translate-y-1 transition-all duration-[350ms]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 flex gap-1.5"><span className="text-[10px] font-bold uppercase tracking-wider bg-sage-700 text-white px-2 py-0.5 rounded-full">Center</span><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{c.type}</span></div>
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">⭐ Featured</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2 text-[13px]"><span className="text-[#7a6b5d] flex items-center gap-1"><IconPin /> {c.city}</span><span className="font-semibold flex items-center gap-1"><IconStar /> {c.rating} <span className="font-normal text-[#a09383]">({c.reviews})</span></span></div>
                    <h3 className="font-serif text-lg leading-[1.3] mb-2">{c.name}</h3>
                    <div className="flex flex-wrap gap-1">{c.services.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR RETREATS */}
        <section className="bg-sand-100 py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Popular retreats</h2><p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Most booked by our community</p></div>
              <Link href="/en/search" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">View all <IconChevron /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRetreats.map((r) => {
                const img = r.images?.find(i => i.is_cover)?.url || r.images?.[0]?.url || DEFAULT_RETREAT_IMG;
                const category = r.categories?.[0]?.name_en || r.categories?.[0]?.name_es || 'Retreat';
                const location = r.destination?.name_en || r.destination?.name_es || '';
                const dates = `${dateFmt.format(new Date(r.start_date))}–${dateFmt.format(new Date(r.end_date))} · ${r.duration_days} days`;
                const spotsLow = r.available_spots <= 5;
                const instant = r.confirmation_type === 'automatic';
                return (
                <Link key={r.slug} href={`/en/retreat/${r.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={img} alt={r.title_en || r.title_es} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{category}</span>
                      {instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] backdrop-blur-sm text-white">⚡ Instant confirmation</span>}
                    </div>
                    <div className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <IconHeart />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><IconPin /> {location}</span>
                      <span className="text-[13px] font-semibold text-foreground flex items-center gap-1"><IconStar /> {r.avg_rating.toFixed(1)} <span className="font-normal text-[#7a6b5d]">({r.review_count})</span></span>
                    </div>
                    <h3 className="font-serif text-xl leading-[1.3] mb-2 line-clamp-2">{r.title_en || r.title_es}</h3>
                    <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-1.5">
                      <IconCal /> {dates}
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span>
                        <span className="text-2xl font-bold text-foreground leading-none mt-0.5">{r.total_price}€ <span className="text-sm font-normal text-[#7a6b5d]">/person</span></span>
                      </div>
                      <span className={`text-[13px] font-medium flex items-center gap-1 ${spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                        {spotsLow ? '🔥' : ''} {r.available_spots} spots
                      </span>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container-wide">
            <div className="text-center mb-8 md:mb-10"><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">How does it work?</h2><p className="text-base text-[#7a6b5d] mt-2">Find centers near you or book your next retreat</p></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
              {[
                { n: 1, t: 'Explore', d: 'Browse our center directory or discover retreats by destination, date or discipline.' },
                { n: 2, t: 'Book your spot', d: 'Pay the full retreat price in one secure card payment (Stripe). Your place is handled through the platform.' },
                { n: 3, t: 'Coordinate', d: 'Chat directly with the organizer. Fill in the questionnaire and prepare your experience.' },
                { n: 4, t: 'Live the experience', d: 'Enjoy the experience. Cancellation refunds, when they apply, follow the retreat policy on what you paid.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="text-center px-5 py-8"><div className="w-12 h-12 bg-terracotta-50 border-2 border-terracotta-200 text-terracotta-600 rounded-full flex items-center justify-center font-serif text-xl mx-auto mb-5">{n}</div><h3 className="font-serif text-lg mb-2">{t}</h3><p className="text-sm text-[#7a6b5d] leading-relaxed">{d}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICE TRANSPARENCY */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="max-w-[700px] mx-auto bg-white border border-sand-300 rounded-3xl p-10 md:p-14">
              <h3 className="font-serif text-[28px] text-center mb-2">100% transparent pricing</h3>
              <p className="text-center text-[#7a6b5d] mb-8">You&apos;ll always know exactly what you pay and to whom</p>
              <div className="bg-sand-100 rounded-2xl p-6 mb-6">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#a09383] mb-4">Example: 500€ retreat</p>
                <div className="flex justify-between items-center py-2.5"><span className="text-[15px] flex items-center gap-2">Booking management fee <span className="text-[11px] font-semibold uppercase tracking-wider bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full">Retiru</span></span><span className="text-lg font-bold">100€</span></div>
                <div className="flex justify-between items-center py-2.5 border-t border-sand-200"><span className="text-[15px] flex items-center gap-2">Payment to organizer <span className="text-[11px] font-semibold uppercase tracking-wider bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Organizer</span></span><span className="text-lg font-bold">400€</span></div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-foreground"><span className="text-base font-semibold">Total retreat price</span><span className="text-2xl font-bold">500€</span></div>
              </div>
              <p className="text-center text-sm text-[#7a6b5d] leading-relaxed"><strong className="text-foreground">You pay €500 in a single charge.</strong> Of that, Retiru retains €100 (commission) and transfers €400 to the organizer per the settlement agreement. No hidden fees or separate second payment.</p>
            </div>
          </div>
        </section>

        {/* DESTINATIONS */}
        <section className="py-12 md:py-16 bg-sand-100">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Popular destinations</h2><p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">The most sought-after places to disconnect</p></div>
              <Link href="/en/destinations" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">View all <IconChevron /></Link>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
              {dests.map((d) => (
                <Link key={d.slug} href={`/en/destinations/${d.slug}`} className="shrink-0 w-[260px] snap-start rounded-2xl overflow-hidden relative cursor-pointer hover:-translate-y-1 transition-transform duration-300 group">
                  <div className="relative w-full h-[180px]">
                    <ImageWithFallback
                      src={d.cover_image_url || DEST_IMAGES[d.slug] || DEST_IMAGES.ibiza}
                      alt={d.name_en || d.name_es}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      fallbackEmoji="🏝️"
                      fallbackSize="md"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.65)] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 px-5">
                    <h3 className="font-serif text-xl text-white">{d.name_en || d.name_es}</h3>
                    {d.region && <p className="text-[13px] text-white/80">{d.region}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {shopProducts.length > 0 && (
        <section className="bg-sand-100 py-12 md:py-16">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-6 md:mb-8 gap-4 flex-wrap">
              <div><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">Retiru <span className="text-terracotta-600">shop</span></h2><p className="text-base text-[#7a6b5d] mt-2 max-w-[480px]">Products for your yoga, meditation and ayurveda practice</p></div>
              <Link href="/en/shop" className="text-[15px] font-semibold text-terracotta-600 inline-flex items-center gap-1.5 hover:gap-2.5 transition-all whitespace-nowrap">View shop <IconChevron /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shopProducts.map((p) => {
                const imgs = Array.isArray(p.images) ? p.images : [];
                const img = typeof imgs[0] === 'string' ? imgs[0] : null;
                const name = p.name_en || p.name_es;
                const discount = p.compare_price && p.compare_price > p.price
                  ? Math.round((1 - p.price / p.compare_price) * 100)
                  : 0;
                return (
                  <Link key={p.id} href={`/en/shop/${p.slug}`} className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all">
                    <div className="relative aspect-square overflow-hidden bg-sand-50">
                      {img ? (
                        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-sage-50 text-sage-400">🛍️</div>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500 text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{Number(p.price).toFixed(2)}€</span>
                        {p.compare_price != null && p.compare_price > p.price && (
                          <span className="text-sm text-[#a09383] line-through">{Number(p.compare_price).toFixed(2)}€</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* TESTIMONIALS */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="text-center mb-8 md:mb-10"><h2 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground">What our guests say</h2><p className="text-base text-[#7a6b5d] mt-2">Real experiences from people who found their ideal retreat</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white border border-sand-200 rounded-2xl p-8 hover:shadow-soft hover:border-sand-300 transition-all">
                  <div className="flex gap-0.5 mb-4">{Array.from({ length: 5 }).map((_, j) => <IconStarLg key={j} />)}</div>
                  <p className="text-[15px] leading-[1.7] text-foreground italic mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3"><div className="w-11 h-11 bg-sage-100 rounded-full flex items-center justify-center text-base font-bold text-sage-700">{t.initials}</div><div><p className="text-[15px] font-semibold">{t.name}</p><p className="text-[13px] text-[#7a6b5d]">{t.event}</p></div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA ORGANIZERS */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 px-10 py-16 md:px-16 md:py-20 text-white">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10 max-w-[600px]">
                <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-wide mb-6">✨ 100% FREE for organizers</div>
                <h2 className="font-serif text-[clamp(28px,4vw,42px)] text-white mb-4">Organize retreats? Publish for free.</h2>
                <p className="text-[17px] text-white/80 leading-[1.7] mb-8">No commissions, no subscriptions. Get a complete professional dashboard to manage your events, bookings, attendees, messaging and much more. All free.</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {['0% commission', 'Full dashboard', 'Attendee CRM', 'QR Check-in', 'Integrated messaging', 'Analytics'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm font-medium"><div className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center shrink-0"><IconCheck /></div>{f}</div>
                  ))}
                </div>
                <Link href="/en/for-organizers" className="inline-flex items-center gap-2 bg-white text-sage-800 font-bold text-base px-8 py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all">Start publishing for free <IconChevron /></Link>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
