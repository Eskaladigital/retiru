'use client';

// ============================================================================
// RETIRU · BÚSQUEDA UNIFICADA — /es/buscar  (Retiros + Centros)
// ============================================================================

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { getCenterTypeLabel } from '@/lib/utils';

const TYPES_FILTER = ['Todos', 'Retiros', 'Centros'];
const CAT_FILTER = ['Yoga', 'Meditación', 'Wellness', 'Spa', 'Detox', 'Gastronomía', 'Aventura', 'Naturaleza'];

export default function BuscarPage() {
  return <Suspense fallback={<div className="container-wide py-8 text-[#a09383]">Cargando...</div>}><BuscarContent /></Suspense>;
}

function BuscarContent() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [catFilter, setCatFilter] = useState('');
  const [retiros, setRetiros] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [retRes, cenRes] = await Promise.all([
          fetch('/api/retreats?limit=50'),
          fetch('/api/centers?limit=50'),
        ]);
        const retJson = await retRes.json();
        const cenJson = await cenRes.json();
        setRetiros(
          (retJson.retreats || []).map((r: any) => ({ ...r, kind: 'retiro' as const }))
        );
        setCentros(
          (cenJson.centers || []).map((c: any) => ({ ...c, kind: 'centro' as const }))
        );
      } catch (err) {
        console.error('Error loading search data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const results = useMemo(() => {
    let items: any[] = [];
    if (typeFilter === 'Todos' || typeFilter === 'Retiros') items.push(...retiros);
    if (typeFilter === 'Todos' || typeFilter === 'Centros') items.push(...centros);

    const q = query.toLowerCase().trim();
    if (q) {
      items = items.filter((item) => {
        if (item.kind === 'retiro') {
          return (item.title_es || '').toLowerCase().includes(q)
            || (item.destination?.name_es || '').toLowerCase().includes(q)
            || (item.categories || []).some((cat: any) => (cat.name_es || '').toLowerCase().includes(q));
        }
        return (item.name || '').toLowerCase().includes(q)
          || (item.type || '').toLowerCase().includes(q)
          || (item.city || '').toLowerCase().includes(q);
      });
    }

    if (catFilter) {
      items = items.filter((item) => {
        if (item.kind === 'retiro') {
          return (item.categories || []).some((cat: any) => (cat.name_es || '').toLowerCase().includes(catFilter.toLowerCase()));
        }
        const services: string[] = Array.isArray(item.services_es) ? item.services_es : [];
        return (item.type || '').toLowerCase().includes(catFilter.toLowerCase())
          || services.some((s: string) => s.toLowerCase().includes(catFilter.toLowerCase()));
      });
    }

    items.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    return items;
  }, [query, typeFilter, catFilter, retiros, centros]);

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
      {loading ? (
        <p className="text-sm text-[#a09383] mb-6">Cargando resultados...</p>
      ) : (
        <p className="text-sm text-[#a09383] mb-6">{results.length} resultados · {retiroCount} retiros · {centroCount} centros</p>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-sand-200 overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-sand-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-sand-100 rounded w-3/4" />
                <div className="h-5 bg-sand-100 rounded w-full" />
                <div className="h-3 bg-sand-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => item.kind === 'retiro' ? (
            <RetiroCard key={`r-${item.slug}`} item={item} />
          ) : (
            <CentroCard key={`c-${item.slug}`} item={item} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="font-serif text-xl mb-2">Sin resultados</h3>
          <p className="text-sm text-[#7a6b5d]">Prueba con otros términos o quita algún filtro</p>
        </div>
      )}
    </div>
  );
}

function RetiroCard({ item }: { item: any }) {
  const coverImage = item.images?.find((img: any) => img.is_cover)?.url
    || item.images?.[0]?.url || '';
  const categoryName = item.categories?.[0]?.name_es || '';
  const locationName = item.destination?.name_es || '';

  return (
    <Link href={`/es/retiro/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={item.title_es} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-sand-100 flex items-center justify-center text-[#a09383] text-sm">Sin imagen</div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-terracotta-600 text-white px-2 py-0.5 rounded-full">Retiro</span>
          {categoryName && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{categoryName}</span>}
          {item.confirmation_type === 'automatic' && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡</span>}
        </div>
        {item.available_spots != null && item.available_spots <= 5 && (
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">🔥 {item.available_spots} plazas</span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2 text-[13px]">
          {locationName && <span className="text-[#7a6b5d]">📍 {locationName}</span>}
          {item.avg_rating != null && (
            <span className="font-semibold">⭐ {item.avg_rating} <span className="font-normal text-[#a09383]">({item.review_count ?? 0})</span></span>
          )}
        </div>
        <h3 className="font-serif text-lg leading-[1.3] mb-1 line-clamp-2">{item.title_es}</h3>
        {item.duration_days && <p className="text-xs text-[#a09383] mb-3">{item.duration_days} días</p>}
        <div className="flex items-end justify-between pt-3 border-t border-sand-200">
          {item.total_price != null && (
            <div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span><br /><span className="text-xl font-bold">{item.total_price}€</span> <span className="text-xs text-[#7a6b5d]">/persona</span></div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CentroCard({ item }: { item: any }) {
  const imgSrc = item.cover_url || (Array.isArray(item.images) && item.images[0]) || '';
  const services: string[] = Array.isArray(item.services_es) ? item.services_es : [];

  return (
    <Link href={`/es/centro/${item.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-sand-100 flex items-center justify-center text-[#a09383] text-sm">Sin imagen</div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-sage-700 text-white px-2 py-0.5 rounded-full">Centro</span>
          {item.type && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{getCenterTypeLabel(item.type)}</span>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2 text-[13px]">
          <span className="text-[#7a6b5d]">📍 {item.city}{item.province ? `, ${item.province}` : ''}</span>
          {item.avg_rating != null && (
            <span className="font-semibold">⭐ {item.avg_rating} <span className="font-normal text-[#a09383]">({item.review_count ?? 0})</span></span>
          )}
        </div>
        <h3 className="font-serif text-lg leading-[1.3] mb-2">{item.name}</h3>
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {services.slice(0, 3).map((s: string) => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}
            {services.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-[#a09383]">+{services.length - 3}</span>}
          </div>
        )}
        {item.price_range_es && (
          <div className="pt-3 border-t border-sand-200">
            <span className="text-sm text-[#7a6b5d]">💰 {item.price_range_es}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
