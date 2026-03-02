'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, MapPin, Star, ChevronDown, CalendarDays } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'reviews', label: 'Más reseñas' },
  { value: 'name', label: 'Nombre A-Z' },
];
const PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 0, label: 'Todos' },
];
const RATING_OPTIONS = [
  { value: 0, label: 'Cualquier valoración' },
  { value: 4, label: '4+ estrellas' },
  { value: 4.5, label: '4.5+ estrellas' },
  { value: 4.8, label: '4.8+ estrellas' },
];

interface CentrosClientProps {
  centers: any[];
}

export default function CentrosClient({ centers }: CentrosClientProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const TYPES = useMemo(() => {
    const types = Array.from(new Set(centers.map(c => c.type).filter(Boolean))).sort();
    return ['Todos', ...types];
  }, [centers]);

  const PROVINCES = useMemo(() => {
    const provinces = Array.from(new Set(centers.map(c => c.province).filter(Boolean))).sort();
    return ['Todas', ...provinces];
  }, [centers]);

  const CIUDAD_SLUG_TO_NAME: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    centers.forEach(c => {
      if (c.city) {
        const slug = c.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        map[slug] = c.city;
      }
    });
    return map;
  }, [centers]);

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
  }, [searchParams, TYPES, PROVINCES, CIUDAD_SLUG_TO_NAME]);

  const filtered = useMemo(() => {
    let results = centers.filter(c => {
      const q = query.toLowerCase();
      const services = Array.isArray(c.services_es) ? c.services_es : [];
      const matchesQuery = !q || c.name?.toLowerCase().includes(q) || c.description_es?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || services.some((s: string) => s.toLowerCase().includes(q));
      const matchesType = selectedType === 'Todos' || c.type === selectedType;
      const matchesProvince = selectedProvince === 'Todas' || c.province === selectedProvince;
      const matchesCity = !selectedCity || c.city === selectedCity;
      const matchesRating = (c.avg_rating || 0) >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesCity && matchesRating;
    });

    switch (sortBy) {
      case 'rating': results.sort((a: any, b: any) => (b.avg_rating || 0) - (a.avg_rating || 0)); break;
      case 'reviews': results.sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0)); break;
      case 'name': results.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')); break;
      default: results.sort((a: any, b: any) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }
    return results;
  }, [centers, query, selectedType, selectedProvince, selectedCity, minRating, sortBy]);

  const totalFiltered = filtered.length;
  const pageSize = perPage === 0 ? totalFiltered : perPage;
  const totalPages = perPage === 0 ? 1 : Math.ceil(totalFiltered / perPage);
  const startIdx = (currentPage - 1) * (perPage || totalFiltered);
  const paginated = perPage === 0 ? filtered : filtered.slice(startIdx, startIdx + perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedType, selectedProvince, selectedCity, minRating, sortBy, perPage]);

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
        <>
          <div className="space-y-4">
            {paginated.map((c: any) => {
            const services: string[] = Array.isArray(c.services_es) ? c.services_es : [];
            const imgSrc = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
            return (
              <Link
                key={c.slug}
                href={`/es/centro/${c.slug}`}
                className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
              >
                <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative">
                  {imgSrc ? (
                    <img src={imgSrc} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-sand-100 flex items-center justify-center text-[#a09383] text-sm">Sin imagen</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        {c.type && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{c.type}</span>}
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1">
                          <MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={15} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{c.avg_rating ?? '–'}</span>
                      <span className="text-xs text-[#a09383]">({c.review_count ?? 0})</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{c.description_es}</p>
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {services.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>
                      ))}
                      {services.length > 4 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#a09383]">+{services.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#a09383]">
                    {c.schedule_summary_es && <span>🕐 {c.schedule_summary_es}</span>}
                    {c.price_range_es && <span>💰 {c.price_range_es}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
          </div>

          {/* Pagination */}
          {perPage > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-sand-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50 transition-colors"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum ? 'bg-terracotta-600 text-white' : 'border border-sand-200 hover:bg-sand-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-sand-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sand-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
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
