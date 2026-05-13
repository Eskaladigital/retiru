'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays, Users, Zap, Flame } from 'lucide-react';
import type { Retreat, Category, Destination } from '@/types';
import { getOrganizerReviewStats, organizerHasRatingToShow, getSearchTokens, matchesAllTokens } from '@/lib/utils';

interface EventsClientProps {
  retreats: Retreat[];
  categories: Category[];
  destinations: Destination[];
}

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

export default function EventsClientEN({ retreats, categories, destinations }: EventsClientProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const categoryOptions = useMemo(
    () => ['All', ...categories.map((c) => c.name_en || c.name_es)],
    [categories],
  );
  const destinationOptions = useMemo(
    () => ['All', ...destinations.map((d) => d.name_en || d.name_es)],
    [destinations],
  );

  useEffect(() => {
    const qParam = searchParams.get('q');
    const destParam = searchParams.get('destination') || searchParams.get('destino');
    const tipoParam = searchParams.get('type') || searchParams.get('tipo');
    if (qParam) setQuery(qParam);
    if (destParam) {
      const match = destinations.find(
        (d) => d.slug === destParam.toLowerCase() || (d.name_en || d.name_es).toLowerCase().replace(/\s/g, '-') === destParam.toLowerCase(),
      );
      if (match) { setSelectedDestination(match.name_en || match.name_es); setShowFilters(true); }
    }
    if (tipoParam) {
      const match = categories.find(
        (c) => c.slug === tipoParam.toLowerCase() || (c.name_en || c.name_es).toLowerCase() === tipoParam.toLowerCase(),
      );
      if (match) { setSelectedCategory(match.name_en || match.name_es); setShowFilters(true); }
    }
    if (qParam || destParam || tipoParam) setShowFilters(true);
  }, [searchParams, categories, destinations]);

  const tokens = useMemo(
    () => getSearchTokens(query, ['retreat', 'retreats', 'escape', 'escapes', 'retiro', 'retiros']),
    [query],
  );

  const filtered = useMemo(() => {
    let results = retreats.filter((r) => {
      const title = r.title_en || r.title_es;
      const summary = r.summary_en || r.summary_es || '';
      const destName = r.destination?.name_en || r.destination?.name_es || '';
      const catNames = (r.categories ?? []).flatMap((c) => [c.name_en, c.name_es]);
      const matchesQuery = matchesAllTokens(tokens, [
        title,
        summary,
        destName,
        ...catNames,
      ]);
      const matchesCategory = selectedCategory === 'All'
        || r.categories?.some((c) => (c.name_en || c.name_es) === selectedCategory);
      const matchesDestination = selectedDestination === 'All'
        || (r.destination?.name_en || r.destination?.name_es) === selectedDestination;
      const matchesRating = getOrganizerReviewStats(r).avg_rating >= minRating;
      return matchesQuery && matchesCategory && matchesDestination && matchesRating;
    });

    switch (sortBy) {
      case 'price_asc': results.sort((a, b) => a.total_price - b.total_price); break;
      case 'price_desc': results.sort((a, b) => b.total_price - a.total_price); break;
      case 'rating': results.sort((a, b) => getOrganizerReviewStats(b).avg_rating - getOrganizerReviewStats(a).avg_rating); break;
      case 'date': results.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()); break;
      default: results.sort((a, b) => getOrganizerReviewStats(b).review_count - getOrganizerReviewStats(a).review_count);
    }
    return results;
  }, [tokens, selectedCategory, selectedDestination, minRating, sortBy, retreats]);

  const hasActiveFilters = selectedCategory !== 'All' || selectedDestination !== 'All' || minRating > 0 || query;

  function clearFilters() {
    setQuery('');
    setSelectedCategory('All');
    setSelectedDestination('All');
    setMinRating(0);
    setSortBy('relevance');
  }

  function formatDateRange(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}–${e.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${monthNames[s.getMonth()]}–${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
  }

  return (
    <div className="container-wide py-10">
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a09383]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, destination, yoga, meditation, ayurveda..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-sand-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white border-sand-300 text-[#7a6b5d] hover:border-terracotta-300'}`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-terracotta-400" />}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Retreat type</label>
            <div className="relative">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {categoryOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Destination</label>
            <div className="relative">
              <select value={selectedDestination} onChange={e => setSelectedDestination(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {destinationOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Minimum rating</label>
            <div className="relative">
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Sort by</label>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium flex items-center gap-1">
                <X size={14} /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {query && <span className="inline-flex items-center gap-1 text-xs bg-terracotta-100 text-terracotta-700 px-3 py-1.5 rounded-full font-medium">&ldquo;{query}&rdquo; <button onClick={() => setQuery('')}><X size={12} /></button></span>}
          {selectedCategory !== 'All' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedCategory} <button onClick={() => setSelectedCategory('All')}><X size={12} /></button></span>}
          {selectedDestination !== 'All' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedDestination} <button onClick={() => setSelectedDestination('All')}><X size={12} /></button></span>}
          {minRating > 0 && <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">{minRating}+ stars <button onClick={() => setMinRating(0)}><X size={12} /></button></span>}
          <button onClick={clearFilters} className="text-xs text-terracotta-600 hover:underline font-medium">Clear all</button>
        </div>
      )}

      <p className="text-sm text-[#a09383] mb-6">{filtered.length} retreat{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4 text-[#a09383]">
            <Search className="w-14 h-14" strokeWidth={1.25} aria-hidden />
          </div>
          <p className="font-serif text-xl text-foreground mb-2">No retreats found</p>
          <p className="text-sm text-[#7a6b5d] mb-6">Try changing filters or broadening your search</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => {
            const coverImg = r.images?.find((i) => i.is_cover) ?? r.images?.[0];
            const categoryLabel = r.categories?.[0]?.name_en || r.categories?.[0]?.name_es || '';
            const spotsLow = r.available_spots <= 4;
            const isInstant = r.confirmation_type === 'automatic';
            const { avg_rating: orgAvg, review_count: orgReviews } = getOrganizerReviewStats(r);
            const showOrgRating = organizerHasRatingToShow(r);

            return (
              <Link
                key={r.slug}
                href={`/en/retreat/${r.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={coverImg?.url ?? 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80'}
                    alt={coverImg?.alt_text ?? (r.title_en || r.title_es)}
                    className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {categoryLabel && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{categoryLabel}</span>}
                    {isInstant && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white inline-flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                        Instant
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1">
                      <MapPin size={13} /> {r.destination?.name_en || r.destination?.name_es || 'Spain'}
                    </span>
                    {showOrgRating && (
                      <span className="text-[13px] font-semibold flex items-center gap-1" title="Organizer rating">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        {orgAvg.toFixed(1)} <span className="font-normal text-[#7a6b5d]">({orgReviews})</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{r.title_en || r.title_es}</h3>
                  <p className="text-sm text-[#7a6b5d] line-clamp-2 mb-3">{r.summary_en || r.summary_es}</p>
                  <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-3">
                    <span className="flex items-center gap-1"><CalendarDays size={14} /> {formatDateRange(r.start_date, r.end_date)}</span>
                    <span className="text-[#a09383]">·</span>
                    <span>{r.duration_days} day{r.duration_days !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span>
                      <span className="text-2xl font-bold leading-none mt-0.5">{r.total_price}€ <span className="text-sm font-normal text-[#7a6b5d]">/person</span></span>
                    </div>
                    <span className={`text-[13px] font-medium inline-flex items-center gap-1 ${spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                      <Users size={14} aria-hidden />
                      {spotsLow && <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                      {r.available_spots} spots
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Cross-sell → Centers */}
      <div className="mt-12 rounded-2xl border border-sage-200 bg-sage-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-sage-600 mb-2">You might also be interested</p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">Do you have a yoga, meditation or ayurveda center?</h3>
          <p className="text-sm text-[#7a6b5d] leading-relaxed max-w-lg">
            If you also run a yoga, meditation or ayurveda center,
            you can appear in our directory so thousands of people can find you.
          </p>
        </div>
        <Link href="/en/centers-retiru" className="shrink-0 inline-flex items-center gap-2 bg-sage-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sage-800 transition-colors text-sm">
          <MapPin size={16} /> Browse centers directory
        </Link>
      </div>

      <div className="mt-6 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 md:p-10 text-white text-center">
        <h2 className="font-serif text-2xl mb-3">Do you organize yoga, meditation or ayurveda retreats?</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">Publish with no subscription: first retreat free (0%), second at 10%, then 20% of the PVP. Full management panel.</p>
        <Link href="/en/for-organizers#organizers" className="inline-flex bg-white text-terracotta-700 font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all text-sm">Start for free</Link>
      </div>
    </div>
  );
}
