'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays, Users } from 'lucide-react';

const EVENTS = [
  { slug: 'yoga-retreat-ibiza', title: 'Yoga & Meditation Retreat by the Sea', type: 'Yoga', price: 890, location: 'Ibiza', province: 'Balearics', dates: '15–20 Jun 2026', duration: '6 days', rating: 4.9, reviews: 47, spots: 4, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80', desc: 'Reconnect with body and mind in a seaside yoga retreat with sunrise sessions on the Mediterranean.' },
  { slug: 'detox-escape-grazalema', title: 'Detox Escape in Sierra de Grazalema', type: 'Detox & Fasting', price: 450, location: 'Grazalema', province: 'Cádiz', dates: '22–25 Jul 2026', duration: '4 days', rating: 4.7, reviews: 23, spots: 8, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', desc: 'Body cleanse with juices, intermittent fasting, hiking and conscious nutrition workshops.' },
  { slug: 'gastronomy-retreat-priorat', title: 'Gastronomic Retreat among Priorat Vineyards', type: 'Gastronomy', price: 680, location: 'Priorat', province: 'Tarragona', dates: '5–8 Sep 2026', duration: '4 days', rating: 4.8, reviews: 31, spots: 6, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', desc: 'Cook among vineyards: wine tasting, Mediterranean cooking workshops and winery visits.' },
  { slug: 'mindfulness-montserrat', title: 'Mindfulness & Silence in Montserrat', type: 'Meditation', price: 320, location: 'Montserrat', province: 'Barcelona', dates: '10–12 Oct 2026', duration: '3 days', rating: 4.6, reviews: 18, spots: 12, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', desc: 'Silent retreat with guided meditations, contemplative walks and total digital detox.' },
  { slug: 'wellness-lanzarote', title: 'Wellness & Spa in Lanzarote', type: 'Wellness & Spa', price: 1200, location: 'Lanzarote', province: 'Las Palmas', dates: '1–7 Nov 2026', duration: '7 days', rating: 4.9, reviews: 52, spots: 2, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', desc: 'A week of total relaxation with massages, yoga, thermal pool and km0 gastronomy in Lanzarote.' },
  { slug: 'yoga-mallorca-sunrise', title: 'Sunrise Yoga in Mallorca', type: 'Yoga', price: 650, location: 'Deià', province: 'Balearics', dates: '3–8 Jul 2026', duration: '6 days', rating: 4.8, reviews: 29, spots: 7, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80', desc: 'Wake up with sunrise yoga in Serra de Tramuntana. Includes hiking and cove swimming.' },
  { slug: 'adventure-picos-europa', title: 'Adventure & Nature in Picos de Europa', type: 'Adventure', price: 520, location: 'Picos de Europa', province: 'Asturias', dates: '15–19 Aug 2026', duration: '5 days', rating: 4.7, reviews: 15, spots: 10, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80', desc: 'Mountain routes, canyoneering, kayaking and stargazing nights in Picos de Europa.' },
  { slug: 'creative-writing-cadaques', title: 'Creative Writing Retreat in Cadaqués', type: 'Creativity', price: 580, location: 'Cadaqués', province: 'Girona', dates: '20–24 Sep 2026', duration: '5 days', rating: 4.9, reviews: 11, spots: 8, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80', desc: 'Writing workshops, inspiring walks through Dalí\'s village and time to create.' },
];

const TYPES = ['All', 'Yoga', 'Meditation', 'Nature', 'Gastronomy', 'Detox & Fasting', 'Adventure', 'Wellness & Spa', 'Creativity'];
const PROVINCES = ['All', ...Array.from(new Set(EVENTS.map(e => e.province))).sort()];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'date', label: 'Nearest date' },
];
const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
  { value: 4.8, label: '4.8+ stars' },
];

export default function EventsClientEN() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let results = EVENTS.filter(e => {
      const q = query.toLowerCase();
      const matchesQuery = !q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
      const matchesType = selectedType === 'All' || e.type === selectedType;
      const matchesProvince = selectedProvince === 'All' || e.province === selectedProvince;
      const matchesRating = e.rating >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesRating;
    });

    switch (sortBy) {
      case 'price_asc': results.sort((a, b) => a.price - b.price); break;
      case 'price_desc': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      default: results.sort((a, b) => b.reviews - a.reviews);
    }
    return results;
  }, [query, selectedType, selectedProvince, minRating, sortBy]);

  const hasActiveFilters = selectedType !== 'All' || selectedProvince !== 'All' || minRating > 0 || query;

  function clearFilters() {
    setQuery(''); setSelectedType('All'); setSelectedProvince('All'); setMinRating(0); setSortBy('relevance');
  }

  return (
    <div className="container-wide py-10">
      <div className="mb-8">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Retreats &amp; getaways</h1>
        <p className="text-[#7a6b5d] max-w-xl">Discover yoga, meditation, nature, gastronomy retreats and much more across Spain</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a09383]" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, destination, type of retreat..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-sand-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400 transition-all" />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] hover:text-foreground"><X size={16} /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white border-sand-300 text-[#7a6b5d] hover:border-terracotta-300'}`}>
          <SlidersHorizontal size={16} /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-terracotta-400" />}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Retreat type</label>
            <div className="relative"><select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Province</label>
            <div className="relative"><select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">{PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Minimum rating</label>
            <div className="relative"><select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">{RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Sort by</label>
            <div className="relative"><select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">{SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" /></div>
          </div>
          {hasActiveFilters && <div className="sm:col-span-2 lg:col-span-4 flex justify-end"><button onClick={clearFilters} className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1"><X size={14} /> Clear filters</button></div>}
        </div>
      )}

      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {query && <span className="inline-flex items-center gap-1 text-xs bg-terracotta-100 text-terracotta-700 px-3 py-1.5 rounded-full font-medium">&ldquo;{query}&rdquo; <button onClick={() => setQuery('')}><X size={12} /></button></span>}
          {selectedType !== 'All' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedType} <button onClick={() => setSelectedType('All')}><X size={12} /></button></span>}
          {selectedProvince !== 'All' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedProvince} <button onClick={() => setSelectedProvince('All')}><X size={12} /></button></span>}
          {minRating > 0 && <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">{minRating}+ stars <button onClick={() => setMinRating(0)}><X size={12} /></button></span>}
          <button onClick={clearFilters} className="text-xs text-terracotta-600 hover:underline font-medium">Clear all</button>
        </div>
      )}

      <p className="text-sm text-[#a09383] mb-6">{filtered.length} retreat{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No retreats found</p>
          <p className="text-sm text-[#7a6b5d] mb-6">Try changing filters or broadening your search</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(e => (
            <Link key={e.slug} href={`/en/retreat/${e.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{e.type}</span>
                  {e.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡ Instant</span>}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {e.location}, {e.province}</span>
                  <span className="text-[13px] font-semibold flex items-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" /> {e.rating} <span className="font-normal text-[#7a6b5d]">({e.reviews})</span></span>
                </div>
                <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{e.title}</h3>
                <p className="text-sm text-[#7a6b5d] line-clamp-2 mb-3">{e.desc}</p>
                <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-3">
                  <span className="flex items-center gap-1"><CalendarDays size={14} /> {e.dates}</span>
                  <span className="text-[#a09383]">·</span>
                  <span>{e.duration}</span>
                </div>
                <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span>
                    <span className="text-2xl font-bold leading-none mt-0.5">{e.price}€ <span className="text-sm font-normal text-[#7a6b5d]">/person</span></span>
                  </div>
                  <span className={`text-[13px] font-medium flex items-center gap-1 ${e.spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                    <Users size={14} /> {e.spotsLow ? '🔥 ' : ''}{e.spots} spots
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Cross-sell → Centers */}
      <div className="mt-12 rounded-2xl border border-sage-200 bg-sage-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-sage-600 mb-2">You might also be interested</p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">Do you have a wellness center?</h3>
          <p className="text-sm text-[#7a6b5d] leading-relaxed max-w-lg">
            If you also run a yoga, meditation, wellness or spa center,
            you can appear in our directory so thousands of people can find you.
          </p>
        </div>
        <Link href="/en/centers-retiru" className="shrink-0 inline-flex items-center gap-2 bg-sage-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sage-800 transition-colors text-sm">
          <MapPin size={16} /> Browse centers directory
        </Link>
      </div>

      <div className="mt-6 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 md:p-10 text-white text-center">
        <h2 className="font-serif text-2xl mb-3">Do you organize retreats or getaways?</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">Publish your retreats for free on Retiru. Complete management panel, no commissions.</p>
        <Link href="/en/for-organizers#organizers" className="inline-flex bg-white text-terracotta-700 font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all text-sm">Start for free</Link>
      </div>
    </div>
  );
}
