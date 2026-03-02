'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays, Users } from 'lucide-react';

const EVENTS = [
  { slug: 'retiro-yoga-ibiza', title: 'Retiro de Yoga y Meditación frente al mar', type: 'Yoga', price: 890, location: 'Ibiza', province: 'Baleares', dates: '15–20 Jun 2026', duration: '6 días', rating: 4.9, reviews: 47, spots: 4, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80', desc: 'Reconecta con tu cuerpo y mente en un retiro de yoga frente al Mediterráneo con sesiones al amanecer.' },
  { slug: 'escapada-detox-grazalema', title: 'Escapada Detox en Sierra de Grazalema', type: 'Detox & Ayuno', price: 450, location: 'Grazalema', province: 'Cádiz', dates: '22–25 Jul 2026', duration: '4 días', rating: 4.7, reviews: 23, spots: 8, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', desc: 'Limpieza corporal con zumos, ayuno intermitente, senderismo y talleres de nutrición consciente.' },
  { slug: 'retiro-gastronomico-priorat', title: 'Retiro Gastronómico en el Priorat', type: 'Gastronomía', price: 680, location: 'Priorat', province: 'Tarragona', dates: '5–8 Sep 2026', duration: '4 días', rating: 4.8, reviews: 31, spots: 6, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', desc: 'Cocina entre viñedos: catas de vino, talleres de cocina mediterránea y visitas a bodegas del Priorat.' },
  { slug: 'mindfulness-montserrat', title: 'Mindfulness y Silencio en Montserrat', type: 'Meditación', price: 320, location: 'Montserrat', province: 'Barcelona', dates: '10–12 Oct 2026', duration: '3 días', rating: 4.6, reviews: 18, spots: 12, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', desc: 'Retiro de silencio con meditaciones guiadas, paseos contemplativos y desconexión digital total.' },
  { slug: 'wellness-lanzarote', title: 'Wellness & Spa en Lanzarote', type: 'Wellness & Spa', price: 1200, location: 'Lanzarote', province: 'Las Palmas', dates: '1–7 Nov 2026', duration: '7 días', rating: 4.9, reviews: 52, spots: 2, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', desc: 'Una semana de relax total con masajes, yoga, piscina termal y gastronomía km0 en Lanzarote.' },
  { slug: 'yoga-mallorca-sunrise', title: 'Yoga al Amanecer en Mallorca', type: 'Yoga', price: 650, location: 'Deià', province: 'Baleares', dates: '3–8 Jul 2026', duration: '6 días', rating: 4.8, reviews: 29, spots: 7, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80', desc: 'Despierta con yoga al amanecer en la Serra de Tramuntana. Incluye senderismo y baños en calas.' },
  { slug: 'aventura-picos-europa', title: 'Aventura y Naturaleza en Picos de Europa', type: 'Aventura', price: 520, location: 'Picos de Europa', province: 'Asturias', dates: '15–19 Ago 2026', duration: '5 días', rating: 4.7, reviews: 15, spots: 10, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80', desc: 'Rutas de montaña, barranquismo, kayak y noches de astronomía en los Picos de Europa.' },
  { slug: 'creatividad-cadaques', title: 'Retiro de Escritura Creativa en Cadaqués', type: 'Creatividad', price: 580, location: 'Cadaqués', province: 'Girona', dates: '20–24 Sep 2026', duration: '5 días', rating: 4.9, reviews: 11, spots: 8, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80', desc: 'Talleres de escritura, paseos inspiradores por el pueblo de Dalí y tiempo para crear.' },
  { slug: 'hatha-yoga-alpujarras', title: 'Hatha Yoga en las Alpujarras', type: 'Yoga', price: 420, location: 'Alpujarras', province: 'Granada', dates: '12–15 May 2026', duration: '4 días', rating: 4.7, reviews: 14, spots: 10, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', desc: 'Retiro tradicional de Hatha Yoga en cortijo rural con vistas a Sierra Nevada.' },
  { slug: 'naturaleza-selva-irati', title: 'Baño de Bosque en la Selva de Irati', type: 'Naturaleza', price: 380, location: 'Selva de Irati', province: 'Navarra', dates: '8–11 Oct 2026', duration: '4 días', rating: 4.8, reviews: 9, spots: 14, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', desc: 'Shinrin-yoku guiado, senderismo consciente y noche en cabaña en uno de los hayedos más grandes de Europa.' },
];

const TYPES = ['Todos', 'Yoga', 'Meditación', 'Naturaleza', 'Gastronomía', 'Detox & Ayuno', 'Aventura', 'Wellness & Spa', 'Creatividad'];
const PROVINCES = ['Todas', ...Array.from(new Set(EVENTS.map(e => e.province))).sort()];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'date', label: 'Fecha más próxima' },
];
const RATING_OPTIONS = [
  { value: 0, label: 'Cualquier valoración' },
  { value: 4, label: '4+ estrellas' },
  { value: 4.5, label: '4.5+ estrellas' },
  { value: 4.8, label: '4.8+ estrellas' },
];
const TIPO_SLUG_TO_NAME: Record<string, string> = {
  yoga: 'Yoga', meditacion: 'Meditación', naturaleza: 'Naturaleza', detox: 'Detox & Ayuno',
  gastronomia: 'Gastronomía', aventura: 'Aventura', wellness: 'Wellness & Spa', creatividad: 'Creatividad',
};

export default function EventosClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const destParam = searchParams.get('destino');
    const tipoParam = searchParams.get('tipo');
    if (qParam) setQuery(qParam);
    if (destParam) {
      const match = PROVINCES.find(p => p !== 'Todas' && p.toLowerCase().replace(/\s/g, '-') === destParam.toLowerCase());
      if (match) { setSelectedProvince(match); setShowFilters(true); }
    }
    if (tipoParam) {
      const typeName = TIPO_SLUG_TO_NAME[tipoParam.toLowerCase()] || TYPES.find(t => t.toLowerCase() === tipoParam.toLowerCase());
      if (typeName) { setSelectedType(typeName); setShowFilters(true); }
    }
    if (qParam || destParam || tipoParam) setShowFilters(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let results = EVENTS.filter(e => {
      const q = query.toLowerCase();
      const matchesQuery = !q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
      const matchesType = selectedType === 'Todos' || e.type === selectedType;
      const matchesProvince = selectedProvince === 'Todas' || e.province === selectedProvince;
      const matchesRating = e.rating >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesRating;
    });

    switch (sortBy) {
      case 'price_asc': results.sort((a, b) => a.price - b.price); break;
      case 'price_desc': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'date': break;
      default: results.sort((a, b) => b.reviews - a.reviews);
    }
    return results;
  }, [query, selectedType, selectedProvince, minRating, sortBy]);

  const hasActiveFilters = selectedType !== 'Todos' || selectedProvince !== 'Todas' || minRating > 0 || query;

  function clearFilters() {
    setQuery('');
    setSelectedType('Todos');
    setSelectedProvince('Todas');
    setMinRating(0);
    setSortBy('relevance');
  }

  return (
    <div className="container-wide py-10">
      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a09383]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, destino, tipo de retiro..."
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
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-terracotta-400" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Tipo de retiro</label>
            <div className="relative">
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Provincia</label>
            <div className="relative">
              <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Valoración mínima</label>
            <div className="relative">
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09383] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Ordenar por</label>
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
                <X size={14} /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {query && <span className="inline-flex items-center gap-1 text-xs bg-terracotta-100 text-terracotta-700 px-3 py-1.5 rounded-full font-medium">&ldquo;{query}&rdquo; <button onClick={() => setQuery('')}><X size={12} /></button></span>}
          {selectedType !== 'Todos' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedType} <button onClick={() => setSelectedType('Todos')}><X size={12} /></button></span>}
          {selectedProvince !== 'Todas' && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedProvince} <button onClick={() => setSelectedProvince('Todas')}><X size={12} /></button></span>}
          {minRating > 0 && <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">{minRating}+ estrellas <button onClick={() => setMinRating(0)}><X size={12} /></button></span>}
          <button onClick={clearFilters} className="text-xs text-terracotta-600 hover:underline font-medium">Limpiar todo</button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[#a09383] mb-6">{filtered.length} retiro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No se encontraron retiros</p>
          <p className="text-sm text-[#7a6b5d] mb-6">Prueba a cambiar los filtros o ampliar tu búsqueda</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Limpiar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(e => (
            <Link
              key={e.slug}
              href={`/es/retiro/${e.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1 hover:border-sand-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground">{e.type}</span>
                  {e.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡ Inmediata</span>}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1">
                    <MapPin size={13} /> {e.location}, {e.province}
                  </span>
                  <span className="text-[13px] font-semibold flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    {e.rating} <span className="font-normal text-[#7a6b5d]">({e.reviews})</span>
                  </span>
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
                    <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span>
                    <span className="text-2xl font-bold leading-none mt-0.5">{e.price}€ <span className="text-sm font-normal text-[#7a6b5d]">/persona</span></span>
                  </div>
                  <span className={`text-[13px] font-medium flex items-center gap-1 ${e.spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                    <Users size={14} />
                    {e.spotsLow ? '🔥 ' : ''}{e.spots} plazas
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Cross-sell → Centros */}
      <div className="mt-12 rounded-2xl border border-sage-200 bg-sage-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-sage-600 mb-2">También te puede interesar</p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">¿Tienes un centro de bienestar?</h3>
          <p className="text-sm text-[#7a6b5d] leading-relaxed max-w-lg">
            Si además de organizar retiros tienes un centro de yoga, meditación, wellness o spa,
            puedes aparecer en nuestro directorio para que miles de personas te encuentren.
          </p>
        </div>
        <Link
          href="/es/centros-retiru"
          className="shrink-0 inline-flex items-center gap-2 bg-sage-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sage-800 transition-colors text-sm"
        >
          <MapPin size={16} />
          Ver directorio de centros
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-6 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 md:p-10 text-white text-center">
        <h2 className="font-serif text-2xl mb-3">¿Organizas retiros o escapadas?</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">Publica tus retiros gratis en Retiru. Panel de gestión completo, sin comisiones.</p>
        <Link href="/es/para-organizadores#organizadores" className="inline-flex bg-white text-terracotta-700 font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all text-sm">
          Empieza gratis
        </Link>
      </div>
    </div>
  );
}
