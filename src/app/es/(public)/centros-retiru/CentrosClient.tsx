'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays } from 'lucide-react';

const CENTERS = [
  { slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', province: 'Madrid', rating: 4.9, reviews: 87, featured: true, services: ['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Meditación'], schedule: 'L-V 7:00-21:00 · S 9:00-14:00', priceRange: 'Desde 14€/clase', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80', desc: 'Estudio de yoga en el centro de Madrid con profesores certificados internacionalmente.' },
  { slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditación', city: 'Barcelona', province: 'Barcelona', rating: 4.8, reviews: 63, featured: true, services: ['Meditación Zen', 'Mindfulness', 'Talleres de silencio'], schedule: 'L-S 8:00-20:00', priceRange: 'Desde 10€/sesión', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80', desc: 'Centro especializado en meditación y mindfulness con más de 15 años de experiencia.' },
  { slug: 'bienestar-integral-valencia', name: 'Bienestar Integral', type: 'Wellness', city: 'Valencia', province: 'Valencia', rating: 4.7, reviews: 41, featured: false, services: ['Yoga', 'Pilates', 'Nutrición', 'Masajes'], schedule: 'L-V 8:00-21:00', priceRange: 'Desde 12€/clase', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', desc: 'Centro de bienestar integral que combina yoga, pilates, nutrición y terapias corporales.' },
  { slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Sevilla', province: 'Sevilla', rating: 4.9, reviews: 112, featured: true, services: ['Kundalini', 'Hatha', 'Yoga restaurativo', 'Formación profesores'], schedule: 'L-S 7:30-21:30', priceRange: 'Desde 15€/clase', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', desc: 'El estudio de yoga más grande de Sevilla. Formación certificada por Yoga Alliance.' },
  { slug: 'spa-termal-murcia', name: 'Spa Termal Murcia', type: 'Spa', city: 'Murcia', province: 'Murcia', rating: 4.6, reviews: 34, featured: false, services: ['Circuito termal', 'Masajes', 'Tratamientos faciales', 'Flotación'], schedule: 'L-D 10:00-22:00', priceRange: 'Desde 25€/circuito', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&q=80', desc: 'Spa urbano con aguas termales naturales y amplia carta de tratamientos.' },
  { slug: 'shala-yoga-malaga', name: 'Shala Yoga Málaga', type: 'Yoga', city: 'Málaga', province: 'Málaga', rating: 4.8, reviews: 58, featured: false, services: ['Ashtanga', 'Yin Yoga', 'Meditación', 'Talleres'], schedule: 'L-V 7:00-20:30 · S 9:00-13:00', priceRange: 'Desde 12€/clase', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80', desc: 'Shala íntima dedicada a la práctica de Ashtanga yoga en Málaga centro.' },
  { slug: 'pilates-studio-bilbao', name: 'Pilates Studio Bilbao', type: 'Pilates', city: 'Bilbao', province: 'Vizcaya', rating: 4.7, reviews: 29, featured: false, services: ['Pilates Mat', 'Pilates Reformer', 'Pilates embarazadas'], schedule: 'L-V 8:00-21:00', priceRange: 'Desde 18€/clase', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', desc: 'Estudio de pilates con máquinas Reformer y clases personalizadas en Bilbao.' },
  { slug: 'centro-ayurveda-granada', name: 'Centro Ayurveda Granada', type: 'Wellness', city: 'Granada', province: 'Granada', rating: 4.5, reviews: 22, featured: false, services: ['Ayurveda', 'Masaje Abhyanga', 'Consulta nutricional', 'Panchakarma'], schedule: 'L-V 9:00-19:00', priceRange: 'Desde 45€/sesión', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80', desc: 'Centro especializado en medicina ayurvédica con terapeutas formados en India.' },
];

const TYPES = ['Todos', 'Yoga', 'Meditación', 'Pilates', 'Wellness', 'Spa'];
const PROVINCES = ['Todas', ...Array.from(new Set(CENTERS.map(c => c.province))).sort()];
const CIUDAD_SLUG_TO_NAME: Record<string, string> = {
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia', sevilla: 'Sevilla',
  murcia: 'Murcia', malaga: 'Málaga', bilbao: 'Bilbao', granada: 'Granada',
};
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'reviews', label: 'Más reseñas' },
  { value: 'name', label: 'Nombre A-Z' },
];
const RATING_OPTIONS = [
  { value: 0, label: 'Cualquier valoración' },
  { value: 4, label: '4+ estrellas' },
  { value: 4.5, label: '4.5+ estrellas' },
  { value: 4.8, label: '4.8+ estrellas' },
];

export default function CentrosClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const tipoParam = searchParams.get('tipo');
    const provParam = searchParams.get('provincia');
    const ciudadParam = searchParams.get('ciudad');
    if (qParam) setQuery(qParam);
    if (tipoParam) {
      const match = TYPES.find(t => t.toLowerCase() === tipoParam.toLowerCase());
      if (match) setSelectedType(match);
    }
    if (provParam) {
      const match = PROVINCES.find(p => p !== 'Todas' && p.toLowerCase().replace(/\s/g, '-') === provParam.toLowerCase());
      if (match) { setSelectedProvince(match); setShowFilters(true); }
    }
    if (ciudadParam) {
      const cityName = CIUDAD_SLUG_TO_NAME[ciudadParam.toLowerCase()];
      if (cityName) { setSelectedCity(cityName); setShowFilters(true); }
    } else {
      setSelectedCity(null);
    }
    if (qParam || tipoParam || provParam || ciudadParam) setShowFilters(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let results = CENTERS.filter(c => {
      const q = query.toLowerCase();
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.services.some(s => s.toLowerCase().includes(q));
      const matchesType = selectedType === 'Todos' || c.type === selectedType;
      const matchesProvince = selectedProvince === 'Todas' || c.province === selectedProvince;
      const matchesCity = !selectedCity || c.city === selectedCity;
      const matchesRating = c.rating >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesCity && matchesRating;
    });

    switch (sortBy) {
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'reviews': results.sort((a, b) => b.reviews - a.reviews); break;
      case 'name': results.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return results;
  }, [query, selectedType, selectedProvince, selectedCity, minRating, sortBy]);

  const hasActiveFilters = selectedType !== 'Todos' || selectedProvince !== 'Todas' || selectedCity || minRating > 0 || query;

  function clearFilters() {
    setQuery('');
    setSelectedType('Todos');
    setSelectedProvince('Todas');
    setSelectedCity(null);
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
            placeholder="Buscar por nombre, ciudad, disciplina..."
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
            <label className="block text-xs font-semibold text-[#a09383] uppercase tracking-wider mb-2">Tipo de centro</label>
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
          {selectedCity && <span className="inline-flex items-center gap-1 text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-medium">{selectedCity} <button onClick={() => setSelectedCity(null)}><X size={12} /></button></span>}
          {minRating > 0 && <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">{minRating}+ estrellas <button onClick={() => setMinRating(0)}><X size={12} /></button></span>}
          <button onClick={clearFilters} className="text-xs text-terracotta-600 hover:underline font-medium">Limpiar todo</button>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[#a09383] mb-6">{filtered.length} centro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>

      {/* Results list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No se encontraron centros</p>
          <p className="text-sm text-[#7a6b5d] mb-6">Prueba a cambiar los filtros o ampliar tu búsqueda</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Limpiar filtros</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <Link
              key={c.slug}
              href={`/es/centro/${c.slug}`}
              className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
            >
              <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {c.featured && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Destacado</span>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{c.type}</span>
                      <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1">
                        <MapPin size={13} /> {c.city}, {c.province}
                      </span>
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
                  {c.services.slice(0, 4).map(s => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>
                  ))}
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

      {/* Cross-sell → Eventos */}
      <div className="mt-12 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta-500 mb-2">También te puede interesar</p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">¿Tu centro organiza retiros o escapadas?</h3>
          <p className="text-sm text-[#7a6b5d] leading-relaxed max-w-lg">
            Si además de estar en el directorio quieres publicar retiros, escapadas o talleres, 
            puedes hacerlo gratis desde tu perfil. Llegarás a miles de personas que ya buscan experiencias como las tuyas.
          </p>
        </div>
        <Link
          href="/es/retiros-retiru"
          className="shrink-0 inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm"
        >
          <CalendarDays size={16} />
          Ver retiros publicados
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-6 bg-gradient-to-br from-sage-800 to-sage-900 rounded-2xl p-8 md:p-10 text-white text-center">
        <h2 className="font-serif text-2xl mb-3">¿Tienes un centro de yoga, meditación o wellness?</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-6">Aparece en el directorio más visitado de España. Miles de personas buscan centros cerca de ellos cada mes.</p>
        <Link href="/es/para-organizadores#centros" className="inline-flex bg-white text-sage-800 font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all text-sm">
          Quiero aparecer en el directorio
        </Link>
      </div>
    </div>
  );
}
