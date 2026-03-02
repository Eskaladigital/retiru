'use client';

// ============================================================================
// RETIRU · UNIFIED SEARCH — /en/search  (Retreats + Centers)
// ============================================================================

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';

const MOCK_RETREATS = [
  { kind: 'retreat' as const, slug: 'yoga-retreat-ibiza', title: 'Yoga & Meditation Retreat by the Sea', price: 890, location: 'Ibiza', rating: 4.9, reviews: 47, spots: 4, duration: '7 days', category: 'Yoga', instant: true, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { kind: 'retreat' as const, slug: 'detox-escape-grazalema', title: 'Detox Escape in Sierra de Grazalema', price: 450, location: 'Cádiz', rating: 4.7, reviews: 23, spots: 8, duration: '4 days', category: 'Detox', instant: false, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
  { kind: 'retreat' as const, slug: 'gastronomy-retreat-priorat', title: 'Gastronomic Escape in Priorat', price: 680, location: 'Tarragona', rating: 4.8, reviews: 31, spots: 6, duration: '4 days', category: 'Gastronomy', instant: true, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { kind: 'retreat' as const, slug: 'mindfulness-montserrat', title: 'Mindfulness & Silence in Montserrat', price: 320, location: 'Barcelona', rating: 4.6, reviews: 18, spots: 12, duration: '3 days', category: 'Meditation', instant: true, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { kind: 'retreat' as const, slug: 'wellness-lanzarote', title: 'Wellness & Spa in Lanzarote', price: 1200, location: 'Lanzarote', rating: 4.9, reviews: 52, spots: 2, duration: '7 days', category: 'Wellness', instant: true, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { kind: 'retreat' as const, slug: 'yoga-mallorca-sunrise', title: 'Sunrise Yoga in Mallorca', price: 650, location: 'Mallorca', rating: 4.8, reviews: 29, spots: 7, duration: '6 days', category: 'Yoga', instant: true, img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
];

const MOCK_CENTERS = [
  { kind: 'center' as const, slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', province: 'Madrid', rating: 4.9, reviews: 87, plan: 'featured' as const, services: ['Hatha', 'Vinyasa', 'Ashtanga'], priceRange: 'From 14€/class', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
  { kind: 'center' as const, slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditation', city: 'Barcelona', province: 'Barcelona', rating: 4.8, reviews: 63, plan: 'featured' as const, services: ['Zen', 'Mindfulness', 'Silence'], priceRange: 'From 10€/session', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80' },
  { kind: 'center' as const, slug: 'om-yoga-sevilla', name: 'Om Yoga Seville', type: 'Yoga', city: 'Seville', province: 'Seville', rating: 4.9, reviews: 112, plan: 'featured' as const, services: ['Kundalini', 'Hatha', 'Training'], priceRange: 'Unlimited 89€/mo', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { kind: 'center' as const, slug: 'spa-termal-murcia', name: 'Spa Termal Murcia', type: 'Spa', city: 'Murcia', province: 'Murcia', rating: 4.6, reviews: 34, plan: 'basic' as const, services: ['Thermal circuit', 'Massages', 'Flotation'], priceRange: 'Circuit from 25€', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&q=80' },
];

const TYPES_FILTER = ['All', 'Retreats', 'Centers'];
const CAT_FILTER = ['Yoga', 'Meditation', 'Wellness', 'Spa', 'Detox', 'Gastronomy', 'Adventure', 'Nature'];

type ResultItem = (typeof MOCK_RETREATS)[number] | (typeof MOCK_CENTERS)[number];

export default function SearchPage() {
  return <Suspense fallback={<div className="container-wide py-8 text-[#a09383]">Loading...</div>}><SearchContent /></Suspense>;
}

function SearchContent() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('');

  const results = useMemo(() => {
    let items: ResultItem[] = [];
    if (typeFilter === 'All' || typeFilter === 'Retreats') items.push(...MOCK_RETREATS);
    if (typeFilter === 'All' || typeFilter === 'Centers') items.push(...MOCK_CENTERS);
    const q = query.toLowerCase().trim();
    if (q) {
      items = items.filter((item) => {
        if (item.kind === 'retreat') return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
        return item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q) || item.city.toLowerCase().includes(q);
      });
    }
    if (catFilter) {
      items = items.filter((item) => {
        if (item.kind === 'retreat') return item.category === catFilter;
        return item.type === catFilter || item.services.some(s => s.toLowerCase().includes(catFilter.toLowerCase()));
      });
    }
    items.sort((a, b) => {
      const aF = a.kind === 'center' && a.plan === 'featured' ? 1 : 0;
      const bF = b.kind === 'center' && b.plan === 'featured' ? 1 : 0;
      if (bF !== aF) return bF - aF;
      return b.rating - a.rating;
    });
    return items;
  }, [query, typeFilter, catFilter]);

  const retreatCount = results.filter(r => r.kind === 'retreat').length;
  const centerCount = results.filter(r => r.kind === 'center').length;

  return (
    <div className="container-wide py-8">
      <h1 className="font-serif text-3xl text-foreground mb-2">Search</h1>
      <p className="text-[#7a6b5d] mb-6">Find retreats and wellness centers across Spain</p>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09383]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Yoga in Madrid, detox retreat, spa Murcia..." className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES_FILTER.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${typeFilter === t ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white border-sand-300 text-[#7a6b5d] hover:border-terracotta-300'}`}>
            {t}{t === 'Retreats' ? ` (${retreatCount})` : t === 'Centers' ? ` (${centerCount})` : ''}
          </button>
        ))}
        <span className="w-px bg-sand-300 mx-1" />
        {CAT_FILTER.map(c => (
          <button key={c} onClick={() => setCatFilter(catFilter === c ? '' : c)} className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${catFilter === c ? 'bg-sage-600 text-white border-sage-600' : 'bg-white border-sand-200 text-[#a09383] hover:border-sage-300 hover:text-sage-600'}`}>{c}</button>
        ))}
      </div>

      <p className="text-sm text-[#a09383] mb-6">{results.length} results · {retreatCount} retreats · {centerCount} centers</p>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => item.kind === 'retreat' ? (
          <Link key={`r-${item.slug}`} href={`/en/retreat/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-terracotta-600 text-white px-2 py-0.5 rounded-full">Retreat</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{item.category}</span>
                {item.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡</span>}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2 text-[13px]"><span className="text-[#7a6b5d]">📍 {item.location}</span><span className="font-semibold">⭐ {item.rating} ({item.reviews})</span></div>
              <h3 className="font-serif text-lg leading-[1.3] mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-[#a09383] mb-3">{item.duration}</p>
              <div className="flex items-end justify-between pt-3 border-t border-sand-200"><div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">From</span><br /><span className="text-xl font-bold">{item.price}€</span> <span className="text-xs text-[#7a6b5d]">/person</span></div></div>
            </div>
          </Link>
        ) : (
          <Link key={`c-${item.slug}`} href={`/en/center/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-700 text-white px-2 py-0.5 rounded-full">Center</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{item.type}</span>
              </div>
              {item.plan === 'featured' && <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">⭐ Featured</span>}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2 text-[13px]"><span className="text-[#7a6b5d]">📍 {item.city}, {item.province}</span><span className="font-semibold">⭐ {item.rating} ({item.reviews})</span></div>
              <h3 className="font-serif text-lg leading-[1.3] mb-2">{item.name}</h3>
              <div className="flex flex-wrap gap-1 mb-3">{item.services.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}</div>
              <div className="pt-3 border-t border-sand-200"><span className="text-sm text-[#7a6b5d]">💰 {item.priceRange}</span></div>
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-16"><p className="text-4xl mb-4">🔍</p><h3 className="font-serif text-xl mb-2">No results</h3><p className="text-sm text-[#7a6b5d]">Try different terms or remove a filter</p></div>
      )}
    </div>
  );
}
