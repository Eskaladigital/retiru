'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays } from 'lucide-react';

const CENTERS = [
  { slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', province: 'Madrid', rating: 4.9, reviews: 87, featured: true, services: ['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Meditation'], schedule: 'Mon-Fri 7:00-21:00 · Sat 9:00-14:00', priceRange: 'From 14€/class', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80', desc: 'Yoga studio in central Madrid with internationally certified teachers.' },
  { slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditation', city: 'Barcelona', province: 'Barcelona', rating: 4.8, reviews: 63, featured: true, services: ['Zen Meditation', 'Mindfulness', 'Silent workshops'], schedule: 'Mon-Sat 8:00-20:00', priceRange: 'From 10€/session', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80', desc: 'Meditation center specializing in mindfulness with over 15 years of experience.' },
  { slug: 'bienestar-integral-valencia', name: 'Bienestar Integral', type: 'Wellness', city: 'Valencia', province: 'Valencia', rating: 4.7, reviews: 41, featured: false, services: ['Yoga', 'Pilates', 'Nutrition', 'Massage'], schedule: 'Mon-Fri 8:00-21:00', priceRange: 'From 12€/class', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', desc: 'Wellness center combining yoga, pilates, nutrition and body therapies.' },
  { slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Seville', province: 'Seville', rating: 4.9, reviews: 112, featured: true, services: ['Kundalini', 'Hatha', 'Restorative yoga', 'Teacher training'], schedule: 'Mon-Sat 7:30-21:30', priceRange: 'From 15€/class', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', desc: 'The largest yoga studio in Seville. Yoga Alliance certified teacher training.' },
  { slug: 'spa-termal-murcia', name: 'Spa Termal Murcia', type: 'Spa', city: 'Murcia', province: 'Murcia', rating: 4.6, reviews: 34, featured: false, services: ['Thermal circuit', 'Massages', 'Facials', 'Flotation'], schedule: 'Mon-Sun 10:00-22:00', priceRange: 'From 25€/circuit', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&q=80', desc: 'Urban spa with natural thermal waters and extensive treatment menu.' },
  { slug: 'shala-yoga-malaga', name: 'Shala Yoga Málaga', type: 'Yoga', city: 'Málaga', province: 'Málaga', rating: 4.8, reviews: 58, featured: false, services: ['Ashtanga', 'Yin Yoga', 'Meditation', 'Workshops'], schedule: 'Mon-Fri 7:00-20:30 · Sat 9:00-13:00', priceRange: 'From 12€/class', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80', desc: 'Intimate shala dedicated to Ashtanga yoga practice in central Málaga.' },
  { slug: 'pilates-studio-bilbao', name: 'Pilates Studio Bilbao', type: 'Pilates', city: 'Bilbao', province: 'Biscay', rating: 4.7, reviews: 29, featured: false, services: ['Pilates Mat', 'Pilates Reformer', 'Prenatal Pilates'], schedule: 'Mon-Fri 8:00-21:00', priceRange: 'From 18€/class', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', desc: 'Pilates studio with Reformer machines and personalized classes in Bilbao.' },
  { slug: 'centro-ayurveda-granada', name: 'Centro Ayurveda Granada', type: 'Wellness', city: 'Granada', province: 'Granada', rating: 4.5, reviews: 22, featured: false, services: ['Ayurveda', 'Abhyanga massage', 'Nutritional consultation', 'Panchakarma'], schedule: 'Mon-Fri 9:00-19:00', priceRange: 'From 45€/session', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80', desc: 'Center specialized in Ayurvedic medicine with therapists trained in India.' },
];

const TYPES = ['All', 'Yoga', 'Meditation', 'Pilates', 'Wellness', 'Spa'];
const PROVINCES = ['All', ...Array.from(new Set(CENTERS.map(c => c.province))).sort()];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'name', label: 'Name A-Z' },
];
const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
  { value: 4.8, label: '4.8+ stars' },
];

export default function CentersClientEN() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let results = CENTERS.filter(c => {
      const q = query.toLowerCase();
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.services.some(s => s.toLowerCase().includes(q));
      const matchesType = selectedType === 'All' || c.type === selectedType;
      const matchesProvince = selectedProvince === 'All' || c.province === selectedProvince;
      const matchesRating = c.rating >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesRating;
    });

    switch (sortBy) {
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'reviews': results.sort((a, b) => b.reviews - a.reviews); break;
      case 'name': results.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
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
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Centers Directory</h1>
        <p className="text-[#7a6b5d] max-w-xl">Find the best yoga, meditation, wellness and spa centers across Spain</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a09383]" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, city, discipline..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-sand-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-400 transition-all" />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] hover:text-foreground"><X size={16} /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white border-sand-300 text-[#7a6b5d] hover:border-terracotta-300'}`}>
          <SlidersHorizontal size={16} /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-terracotta-400" />}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Center type</label>
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

      <p className="text-sm text-[#a09383] mb-6">{filtered.length} center{filtered.length !== 1 ? 's' : ''} found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No centers found</p>
          <p className="text-sm text-[#7a6b5d] mb-6">Try changing filters or broadening your search</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <Link key={c.slug} href={`/en/center/${c.slug}`} className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all">
              <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {c.featured && <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Featured</span>}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{c.type}</span>
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {c.city}, {c.province}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={15} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold">{c.rating}</span>
                    <span className="text-xs text-[#a09383]">({c.reviews})</span>
                  </div>
                </div>
                <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{c.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.services.slice(0, 4).map(s => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}
                  {c.services.length > 4 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#a09383]">+{c.services.length - 4}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#a09383]">
                  <span>🕐 {c.schedule}</span>
                  <span>💰 {c.priceRange}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Cross-sell → Events */}
      <div className="mt-12 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta-500 mb-2">You might also be interested</p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">Does your center organize retreats or events?</h3>
          <p className="text-sm text-[#7a6b5d] leading-relaxed max-w-lg">
            Beyond your directory listing, you can publish retreats, getaways or workshops for free.
            Reach thousands of people already looking for experiences like yours.
          </p>
        </div>
        <Link href="/en/retreats-retiru" className="shrink-0 inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          <CalendarDays size={16} /> Browse events
        </Link>
      </div>

      <div className="mt-6 bg-gradient-to-br from-sage-800 to-sage-900 rounded-2xl p-8 md:p-10 text-white text-center">
        <h2 className="font-serif text-2xl mb-3">Own a yoga, meditation or wellness center?</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">Appear in Spain&apos;s most visited wellness directory. Thousands of people search for centers near them every month.</p>
        <Link href="/en/for-organizers#centers" className="inline-flex bg-white text-sage-800 font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all text-sm">
          List my center
        </Link>
      </div>
    </div>
  );
}
