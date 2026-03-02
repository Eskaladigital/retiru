'use client';

// ============================================================================
// RETIRU · BÚSQUEDA UNIFICADA — /es/buscar  (Retiros + Centros)
// ============================================================================

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const MOCK_RETIROS = [
  { kind: 'retiro' as const, slug: 'retiro-yoga-ibiza', title: 'Retiro de Yoga y Meditación en Ibiza', price: 890, location: 'Ibiza', rating: 4.9, reviews: 47, spots: 4, duration: '7 días', category: 'Yoga', instant: true, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { kind: 'retiro' as const, slug: 'escapada-detox-grazalema', title: 'Escapada Detox en Sierra de Grazalema', price: 450, location: 'Cádiz', rating: 4.7, reviews: 23, spots: 8, duration: '4 días', category: 'Detox', instant: false, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
  { kind: 'retiro' as const, slug: 'retiro-gastronomico-priorat', title: 'Retiro Gastronómico en el Priorat', price: 680, location: 'Tarragona', rating: 4.8, reviews: 31, spots: 6, duration: '4 días', category: 'Gastronomía', instant: true, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { kind: 'retiro' as const, slug: 'mindfulness-montserrat', title: 'Mindfulness y Silencio en Montserrat', price: 320, location: 'Barcelona', rating: 4.6, reviews: 18, spots: 12, duration: '3 días', category: 'Meditación', instant: true, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { kind: 'retiro' as const, slug: 'wellness-lanzarote', title: 'Wellness & Spa en Lanzarote', price: 1200, location: 'Lanzarote', rating: 4.9, reviews: 52, spots: 2, duration: '7 días', category: 'Wellness', instant: true, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { kind: 'retiro' as const, slug: 'yoga-mallorca-sunrise', title: 'Yoga al Amanecer en Mallorca', price: 650, location: 'Mallorca', rating: 4.8, reviews: 29, spots: 7, duration: '6 días', category: 'Yoga', instant: true, img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
];

const MOCK_CENTROS = [
  { kind: 'centro' as const, slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', province: 'Madrid', rating: 4.9, reviews: 87, plan: 'featured' as const, services: ['Hatha', 'Vinyasa', 'Ashtanga'], priceRange: 'Desde 14€/clase', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
  { kind: 'centro' as const, slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditación', city: 'Barcelona', province: 'Barcelona', rating: 4.8, reviews: 63, plan: 'featured' as const, services: ['Zen', 'Mindfulness', 'Silencio'], priceRange: 'Desde 10€/sesión', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80' },
  { kind: 'centro' as const, slug: 'bienestar-integral-valencia', name: 'Bienestar Integral', type: 'Wellness', city: 'Valencia', province: 'Valencia', rating: 4.7, reviews: 41, plan: 'basic' as const, services: ['Yoga', 'Pilates', 'Nutrición'], priceRange: 'Desde 12€/clase', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { kind: 'centro' as const, slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Sevilla', province: 'Sevilla', rating: 4.9, reviews: 112, plan: 'featured' as const, services: ['Kundalini', 'Hatha', 'Formación'], priceRange: 'Ilimitado 89€/mes', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { kind: 'centro' as const, slug: 'spa-termal-murcia', name: 'Spa Termal Murcia', type: 'Spa', city: 'Murcia', province: 'Murcia', rating: 4.6, reviews: 34, plan: 'basic' as const, services: ['Circuito termal', 'Masajes', 'Flotación'], priceRange: 'Circuito desde 25€', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&q=80' },
];

const TYPES_FILTER = ['Todos', 'Retiros', 'Centros'];
const CAT_FILTER = ['Yoga', 'Meditación', 'Wellness', 'Spa', 'Detox', 'Gastronomía', 'Aventura', 'Naturaleza'];

type ResultItem = (typeof MOCK_RETIROS)[number] | (typeof MOCK_CENTROS)[number];

export default function BuscarPage() {
  return <Suspense fallback={<div className="container-wide py-8 text-[#a09383]">Cargando...</div>}><BuscarContent /></Suspense>;
}

function BuscarContent() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [catFilter, setCatFilter] = useState('');

  const results = useMemo(() => {
    let items: ResultItem[] = [];
    if (typeFilter === 'Todos' || typeFilter === 'Retiros') items.push(...MOCK_RETIROS);
    if (typeFilter === 'Todos' || typeFilter === 'Centros') items.push(...MOCK_CENTROS);

    const q = query.toLowerCase().trim();
    if (q) {
      items = items.filter((item) => {
        if (item.kind === 'retiro') return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
        return item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q) || item.city.toLowerCase().includes(q);
      });
    }

    if (catFilter) {
      items = items.filter((item) => {
        if (item.kind === 'retiro') return item.category === catFilter;
        return item.type === catFilter || item.services.some(s => s.toLowerCase().includes(catFilter.toLowerCase()));
      });
    }

    // Featured centers first, then by rating
    items.sort((a, b) => {
      const aFeatured = a.kind === 'centro' && a.plan === 'featured' ? 1 : 0;
      const bFeatured = b.kind === 'centro' && b.plan === 'featured' ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      return b.rating - a.rating;
    });

    return items;
  }, [query, typeFilter, catFilter]);

  const retiroCount = results.filter(r => r.kind === 'retiro').length;
  const centroCount = results.filter(r => r.kind === 'centro').length;

  return (
    <div className="container-wide py-8">
      <h1 className="font-serif text-3xl text-foreground mb-2">Buscar</h1>
      <p className="text-[#7a6b5d] mb-6">Encuentra retiros y centros de bienestar en toda España</p>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a09383]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Yoga en Madrid, retiro detox, spa Murcia..." className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all" />
        </div>
      </div>

      {/* Type toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES_FILTER.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${typeFilter === t ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white border-sand-300 text-[#7a6b5d] hover:border-terracotta-300'}`}>
            {t}
            {t === 'Retiros' && <span className="ml-1 text-xs opacity-70">({retiroCount})</span>}
            {t === 'Centros' && <span className="ml-1 text-xs opacity-70">({centroCount})</span>}
          </button>
        ))}
        <span className="w-px bg-sand-300 mx-1" />
        {CAT_FILTER.map(c => (
          <button key={c} onClick={() => setCatFilter(catFilter === c ? '' : c)} className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${catFilter === c ? 'bg-sage-600 text-white border-sage-600' : 'bg-white border-sand-200 text-[#a09383] hover:border-sage-300 hover:text-sage-600'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-[#a09383] mb-6">{results.length} resultados · {retiroCount} retiros · {centroCount} centros</p>

      {/* Results grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => item.kind === 'retiro' ? (
          <Link key={`r-${item.slug}`} href={`/es/retiro/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-terracotta-600 text-white px-2 py-0.5 rounded-full">Retiro</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{item.category}</span>
                {item.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡</span>}
              </div>
              {item.spots <= 5 && <span className="absolute top-3 right-3 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">🔥 {item.spots} plazas</span>}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2 text-[13px]">
                <span className="text-[#7a6b5d]">📍 {item.location}</span>
                <span className="font-semibold">⭐ {item.rating} <span className="font-normal text-[#a09383]">({item.reviews})</span></span>
              </div>
              <h3 className="font-serif text-lg leading-[1.3] mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-[#a09383] mb-3">{item.duration}</p>
              <div className="flex items-end justify-between pt-3 border-t border-sand-200">
                <div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span><br /><span className="text-xl font-bold">{item.price}€</span> <span className="text-xs text-[#7a6b5d]">/persona</span></div>
              </div>
            </div>
          </Link>
        ) : (
          <Link key={`c-${item.slug}`} href={`/es/centro/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-700 text-white px-2 py-0.5 rounded-full">Centro</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{item.type}</span>
              </div>
              {item.plan === 'featured' && <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">⭐ Destacado</span>}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2 text-[13px]">
                <span className="text-[#7a6b5d]">📍 {item.city}, {item.province}</span>
                <span className="font-semibold">⭐ {item.rating} <span className="font-normal text-[#a09383]">({item.reviews})</span></span>
              </div>
              <h3 className="font-serif text-lg leading-[1.3] mb-2">{item.name}</h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {item.services.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}
              </div>
              <div className="pt-3 border-t border-sand-200">
                <span className="text-sm text-[#7a6b5d]">💰 {item.priceRange}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="font-serif text-xl mb-2">Sin resultados</h3>
          <p className="text-sm text-[#7a6b5d]">Prueba con otros términos o quita algún filtro</p>
        </div>
      )}
    </div>
  );
}
