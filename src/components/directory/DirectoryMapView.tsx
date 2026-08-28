'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Filter, List, Locate, Map as MapIcon, MapPin, RotateCcw, Search, Star, X } from 'lucide-react';
import {
  CENTER_TYPE_META,
  PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS,
  VALID_CENTER_TYPE_SLUGS,
  generateSlug,
  getCenterTypeColor,
  getCenterTypeIcon,
  getCenterTypeLabel,
  getSearchTokens,
  isGenericDescription,
  matchesAllTokens,
  matchesPlaceSlug,
  stripMarkdownForPreview,
} from '@/lib/utils';
import DirectoryLeafletMap, { type DirectoryCenter } from './DirectoryLeafletMap';

const LIST_LIMIT = 50;

const COPY = {
  es: {
    h1: 'Directorio de centros',
    search: 'Buscar centro, ciudad…',
    mapSearch: '¿A dónde ir?',
    type: 'Categoría',
    allTypes: 'Todos',
    legend: 'Leyenda',
    province: 'Provincia',
    allProvinces: 'Todas',
    rating: 'Valoración',
    anyRating: 'Todas',
    sort: 'Ordenar',
    sortRating: 'Mejor valorados',
    sortReviews: 'Más reseñas',
    sortName: 'Nombre A–Z',
    sortNear: 'Proximidad',
    clear: 'Limpiar filtros',
    results: (n: number) => `${n} centro${n === 1 ? '' : 's'}`,
    showing: (a: number, b: number) => `Mostrando ${a} de ${b}`,
    empty: 'No se encontraron centros',
    emptyHint: 'Prueba a cambiar los filtros',
    map: 'Mapa',
    filters: 'Filtros',
    list: 'Lista',
    locate: 'Ver ubicación',
    resetZoom: 'Restablecer zoom',
    see: 'Ver ficha',
    noGps: 'Sin coordenadas',
    apply: (n: number) => `Ver resultados (${n})`,
  },
  en: {
    h1: 'Centers directory',
    search: 'Search center, city…',
    mapSearch: 'Where to go?',
    type: 'Category',
    allTypes: 'All',
    legend: 'Legend',
    province: 'Province',
    allProvinces: 'All',
    rating: 'Rating',
    anyRating: 'Any',
    sort: 'Sort',
    sortRating: 'Top rated',
    sortReviews: 'Most reviews',
    sortName: 'Name A–Z',
    sortNear: 'Nearby',
    clear: 'Clear filters',
    results: (n: number) => `${n} center${n === 1 ? '' : 's'}`,
    showing: (a: number, b: number) => `Showing ${a} of ${b}`,
    empty: 'No centers found',
    emptyHint: 'Try changing the filters',
    map: 'Map',
    filters: 'Filters',
    list: 'List',
    locate: 'Show location',
    resetZoom: 'Reset zoom',
    see: 'View profile',
    noGps: 'No coordinates',
    apply: (n: number) => `See results (${n})`,
  },
} as const;

type Locale = 'es' | 'en';
type MobileView = 'map' | 'filters' | 'list';

const CLOSE_THRESHOLD = 100;

function DirectorySheet({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else {
      document.body.style.overflow = '';
      setDragY(0);
      dragStartRef.current = null;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    setDragY(Math.max(0, e.clientY - dragStartRef.current));
  };
  const endDrag = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    if (dragY > CLOSE_THRESHOLD) onClose();
    setDragY(0);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl transform transition-transform duration-300 z-50 md:hidden flex flex-col h-[90dvh] pb-[env(safe-area-inset-bottom)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="w-12 h-1.5 bg-sand-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-sand-200 flex-shrink-0">
          <h2 className="font-serif text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-sand-100 rounded-full" aria-label="Cerrar">
            <X size={18} className="text-[#7a6b5d]" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-4">{children}</div>
      </div>
    </>
  );
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function FilterFields({
  query,
  setQuery,
  selectedType,
  setSelectedType,
  selectedProvince,
  setSelectedProvince,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  provinces,
  hasActive,
  onClear,
  t,
  locale,
}: {
  query: string;
  setQuery: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedProvince: string;
  setSelectedProvince: (v: string) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  provinces: string[];
  hasActive: boolean;
  onClear: () => void;
  t: (typeof COPY)[Locale];
  locale: Locale;
}) {
  const selectClass =
    'w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300';
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09383]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a09383]">
            <X size={14} />
          </button>
        ) : null}
      </div>
      <div>
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#a09383] mb-1.5">{t.type}</span>
        <div className="space-y-2">
          {PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS.map((slug) => {
            const activo = selectedType === slug;
            const color = getCenterTypeColor(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedType(activo ? '' : slug)}
                aria-pressed={activo}
                className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                  activo ? 'shadow-sm' : 'border-sand-200 bg-white hover:border-sand-300'
                }`}
                style={activo ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base"
                  style={{ backgroundColor: `${color}22` }}
                  aria-hidden
                >
                  {getCenterTypeIcon(slug)}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{getCenterTypeLabel(slug, locale)}</span>
                {activo ? <Check className="w-5 h-5 shrink-0" style={{ color }} /> : null}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#a09383] mb-1.5">{t.province}</span>
        <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className={selectClass}>
          <option value="">{t.allProvinces}</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#a09383] mb-1.5">{t.rating}</span>
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className={selectClass}>
          <option value={0}>{t.anyRating}</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
          <option value={4.8}>4.8+</option>
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#a09383] mb-1.5">{t.sort}</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
          <option value="rating">{t.sortRating}</option>
          <option value="reviews">{t.sortReviews}</option>
          <option value="name">{t.sortName}</option>
          <option value="near">{t.sortNear}</option>
        </select>
      </label>
      {hasActive ? (
        <button type="button" onClick={onClear} className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700 inline-flex items-center gap-1">
          <X size={14} /> {t.clear}
        </button>
      ) : null}
    </div>
  );
}

function CenterCard({
  c,
  locale,
  selected,
  onPick,
  t,
}: {
  c: DirectoryCenter;
  locale: Locale;
  selected: boolean;
  onPick: () => void;
  t: (typeof COPY)[Locale];
}) {
  const href = locale === 'es' ? `/es/centro/${c.slug}` : `/en/center/${c.slug}`;
  const img = c.cover_url || (Array.isArray(c.images) ? c.images[0] : '') || '';
  const descRaw = locale === 'es' ? c.description_es : c.description_en;
  const desc =
    descRaw && !isGenericDescription(descRaw) ? stripMarkdownForPreview(descRaw) : '';
  return (
    <article
      className={`flex gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
        selected ? 'border-terracotta-400 bg-terracotta-50' : 'border-sand-200 bg-white hover:border-sand-300'
      }`}
      onClick={onPick}
    >
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-sand-100">
        {img ? (
          <Image src={img} alt="" fill sizes="80px" className="object-cover" unoptimized={!img.includes('supabase.co')} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#a09383]">
            <MapPin size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-serif text-[15px] leading-tight hover:text-terracotta-600 line-clamp-2" onClick={(e) => e.stopPropagation()}>
          {c.name}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {c.type ? (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ backgroundColor: `${getCenterTypeColor(c.type)}22`, color: getCenterTypeColor(c.type) }}
            >
              <span aria-hidden>{getCenterTypeIcon(c.type)}</span>
              {getCenterTypeLabel(c.type, locale)}
            </span>
          ) : null}
          <span className="text-[12px] text-[#7a6b5d] truncate">
            {[c.city, c.province].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold">{c.avg_rating ?? '–'}</span>
          <span className="text-[11px] text-[#a09383]">({c.review_count ?? 0})</span>
        </div>
        {desc ? <p className="text-[11px] text-[#7a6b5d] line-clamp-1 mt-0.5">{desc}</p> : null}
        <Link href={href} className="text-[11px] font-semibold text-terracotta-600 hover:underline mt-1 inline-block" onClick={(e) => e.stopPropagation()}>
          {t.see}
        </Link>
      </div>
    </article>
  );
}

export default function DirectoryMapView({
  locale,
  centers,
}: {
  locale: Locale;
  centers: DirectoryCenter[];
}) {
  const t = COPY[locale];
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [placeSlug, setPlaceSlug] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const [legendOpen, setLegendOpen] = useState(false);
  const [locateToken, setLocateToken] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [openMapSearch, setOpenMapSearch] = useState(false);
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);

  const spainCenters = useMemo(
    () => centers.filter((c) => !c.country || c.country === 'España'),
    [centers],
  );

  const provinces = useMemo(
    () =>
      Array.from(new Set(spainCenters.map((c) => c.province).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, locale === 'es' ? 'es' : 'en'),
      ),
    [spainCenters, locale],
  );

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const tipo = searchParams.get(locale === 'en' ? 'type' : 'tipo') || searchParams.get('tipo') || '';
    const prov = searchParams.get(locale === 'en' ? 'province' : 'provincia') || searchParams.get('provincia') || '';
    const city = searchParams.get(locale === 'en' ? 'city' : 'ciudad') || searchParams.get('ciudad') || '';
    if (q) setQuery(q);
    if (tipo && VALID_CENTER_TYPE_SLUGS.includes(tipo as (typeof VALID_CENTER_TYPE_SLUGS)[number])) {
      setSelectedType(tipo);
    }
    if (prov) {
      const match = provinces.find((p) => generateSlug(p) === generateSlug(prov) || p.toLowerCase().replace(/\s/g, '-') === prov.toLowerCase());
      if (match) setSelectedProvince(match);
    }
    setPlaceSlug(city ? generateSlug(city) : null);
  }, [searchParams, locale, provinces]);

  const tokens = useMemo(
    () => getSearchTokens(query, locale === 'es' ? ['centro', 'centros'] : ['center', 'centers']),
    [query, locale],
  );

  const filtered = useMemo(() => {
    const results = spainCenters.filter((c) => {
      const services = locale === 'es' ? c.services_es : c.services_en;
      const list = Array.isArray(services) ? services : [];
      const matchesQuery = matchesAllTokens(tokens, [
        c.name,
        locale === 'es' ? c.description_es : c.description_en,
        c.city,
        c.province,
        c.type,
        getCenterTypeLabel(c.type, locale),
        ...list,
      ]);
      const matchesType = !selectedType || c.type === selectedType;
      const matchesProvince = !selectedProvince || c.province === selectedProvince;
      const matchesCity = !placeSlug || matchesPlaceSlug(placeSlug, c.city, c.province);
      const matchesRating = (c.avg_rating || 0) >= minRating;
      return matchesQuery && matchesType && matchesProvince && matchesCity && matchesRating;
    });

    results.sort((a, b) => {
      if (sortBy === 'reviews') return (b.review_count || 0) - (a.review_count || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', locale === 'es' ? 'es' : 'en');
      if (sortBy === 'near' && userGeo) {
        const da =
          a.latitude != null && a.longitude != null
            ? haversine(userGeo.lat, userGeo.lng, Number(a.latitude), Number(a.longitude))
            : 9e6;
        const db =
          b.latitude != null && b.longitude != null
            ? haversine(userGeo.lat, userGeo.lng, Number(b.latitude), Number(b.longitude))
            : 9e6;
        return da - db;
      }
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });
    return results;
  }, [spainCenters, tokens, selectedType, selectedProvince, placeSlug, minRating, sortBy, userGeo, locale]);

  const mapped = useMemo(
    () => filtered.filter((c) => c.latitude != null && c.longitude != null),
    [filtered],
  );

  const fitToken = selectedProvince || placeSlug ? `${selectedProvince}|${placeSlug || ''}` : '';
  const listed = filtered.slice(0, LIST_LIMIT);
  const selected = filtered.find((c) => c.id === selectedId) || null;
  const hasActive = Boolean(query || selectedType || selectedProvince || placeSlug || minRating);
  const filterCount = [query, selectedType, selectedProvince, placeSlug, minRating || ''].filter(Boolean).length;

  const mapSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as { type: 'center' | 'city'; label: string; sublabel: string; id?: string; city?: string }[];
    const cities = new Set<string>();
    const out: { type: 'center' | 'city'; label: string; sublabel: string; id?: string; city?: string }[] = [];
    for (const c of spainCenters) {
      const city = c.city || '';
      if (city && city.toLowerCase().startsWith(q) && !cities.has(city.toLowerCase())) {
        cities.add(city.toLowerCase());
        out.push({ type: 'city', label: city, sublabel: c.province || '', city });
      }
      if (c.name.toLowerCase().includes(q) && out.filter((x) => x.type === 'center').length < 6) {
        out.push({
          type: 'center',
          label: c.name,
          sublabel: [c.city, c.province].filter(Boolean).join(', '),
          id: c.id,
        });
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [query, spainCenters]);

  function clearFilters() {
    setQuery('');
    setSelectedType('');
    setSelectedProvince('');
    setPlaceSlug(null);
    setMinRating(0);
    setSortBy('rating');
  }

  function locate() {
    setLocateToken((n) => n + 1);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('near');
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-sand-50">
      <h1 className="sr-only">{t.h1}</h1>

      <div className="flex-1 flex overflow-hidden relative pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <aside className="hidden md:flex md:w-72 lg:w-80 shrink-0 flex-col bg-white border-r border-sand-200">
          <div className="px-4 pt-4 pb-2 border-b border-sand-100">
            <p className="font-serif text-lg leading-tight">{t.h1}</p>
            <p className="text-xs text-[#a09383] mt-1">{t.results(filtered.length)}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterFields
              query={query}
              setQuery={setQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedProvince={selectedProvince}
              setSelectedProvince={setSelectedProvince}
              minRating={minRating}
              setMinRating={setMinRating}
              sortBy={sortBy}
              setSortBy={setSortBy}
              provinces={provinces}
              hasActive={hasActive}
              onClear={clearFilters}
              t={t}
              locale={locale}
            />
          </div>
        </aside>

        <div className="flex-1 relative min-w-0 bg-[#e8e4dc]">
          <DirectoryLeafletMap
            centers={mapped}
            selectedId={selectedId}
            onSelect={(c) => setSelectedId(c.id)}
            fitToken={fitToken}
            locateToken={locateToken}
            resetToken={resetToken}
            resetToFilter={Boolean(selectedProvince || placeSlug)}
            locateLabel={t.locate}
          />
          <div className="absolute top-3 left-3 z-[500] flex flex-col items-start gap-2">
            <span className="bg-white/95 backdrop-blur border border-sand-200 text-sm font-semibold px-3 py-1.5 rounded-full shadow-soft">
              {t.results(filtered.length)}
            </span>
            <button
              type="button"
              onClick={() => setLegendOpen((v) => !v)}
              className="w-11 h-11 bg-white/95 backdrop-blur border border-sand-200 rounded-full shadow-soft flex items-center justify-center text-lg"
              aria-label={t.legend}
              aria-expanded={legendOpen}
            >
              {getCenterTypeIcon('yoga')}
            </button>
            {legendOpen ? (
              <div className="bg-white/95 backdrop-blur border border-sand-200 rounded-2xl p-3 shadow-soft w-52">
                <p className="text-xs font-semibold mb-2">{t.legend}</p>
                <div className="space-y-1.5">
                  {PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS.map((slug) => (
                    <div key={slug} className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: CENTER_TYPE_META[slug].color }}
                        aria-hidden
                      >
                        {CENTER_TYPE_META[slug].icon}
                      </span>
                      <span className="text-xs font-semibold">{getCenterTypeLabel(slug, locale)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="absolute top-3 left-3 right-14 md:top-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-80 z-[500] pointer-events-none">
            <div className="flex justify-end md:block">
              {!openMapSearch && !query ? (
                <button
                  type="button"
                  onClick={() => setOpenMapSearch(true)}
                  className="md:hidden pointer-events-auto w-11 h-11 bg-white/95 backdrop-blur border border-sand-200 rounded-full shadow-soft flex items-center justify-center"
                  aria-label={t.mapSearch}
                >
                  <Search className="w-5 h-5 text-[#7a6b5d]" />
                </button>
              ) : null}
              <div className={`relative pointer-events-auto ${openMapSearch || query ? 'block w-full' : 'hidden md:block'}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a09383] pointer-events-none" />
                <input
                  type="search"
                  placeholder={t.mapSearch}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setOpenMapSearch(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!query) setOpenMapSearch(false);
                    }, 150);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-white/95 backdrop-blur border-0 rounded-full shadow-soft ring-1 ring-sand-200 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setPlaceSlug(null);
                      setOpenMapSearch(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#a09383]"
                    aria-label={t.clear}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                {openMapSearch && mapSuggestions.length > 0 ? (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-soft ring-1 ring-sand-200 overflow-hidden">
                    {mapSuggestions.map((s, i) => (
                      <button
                        key={`${s.type}-${s.label}-${i}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (s.type === 'city' && s.city) {
                            setPlaceSlug(generateSlug(s.city));
                            setQuery('');
                          } else if (s.id) {
                            setSelectedId(s.id);
                            setQuery('');
                          }
                          setOpenMapSearch(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-sand-50 border-b border-sand-100 last:border-b-0"
                      >
                        <MapPin className={`h-4 w-4 shrink-0 ${s.type === 'city' ? 'text-terracotta-600' : 'text-[#a09383]'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.label}</p>
                          {s.sublabel ? <p className="text-xs text-[#a09383] truncate">{s.sublabel}</p> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={locate}
            className="absolute left-3 bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-20 z-[500] bg-white/95 backdrop-blur p-3 md:px-4 md:py-2 rounded-full shadow-soft border border-sand-200 font-semibold text-[#2d2319] hover:border-terracotta-300 flex items-center md:gap-2"
            aria-label={t.locate}
          >
            <Locate className="w-5 h-5" />
            <span className="hidden md:inline text-sm">{t.locate}</span>
          </button>
          <button
            type="button"
            onClick={() => setResetToken((n) => n + 1)}
            className="absolute left-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-6 z-[500] bg-white/95 backdrop-blur p-3 md:px-4 md:py-2 rounded-full shadow-soft border border-sand-200 font-semibold text-[#2d2319] hover:border-terracotta-300 flex items-center md:gap-2"
            aria-label={t.resetZoom}
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden md:inline text-sm">{t.resetZoom}</span>
          </button>

          {selected ? (
            <div className="absolute bottom-[calc(12.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 md:bottom-3 md:left-3 md:right-auto md:w-[340px] z-[500]">
              <CenterCard
                c={selected}
                locale={locale}
                selected
                onPick={() => undefined}
                t={t}
              />
            </div>
          ) : null}
        </div>

        <aside className="hidden md:flex md:w-80 lg:w-96 shrink-0 flex-col bg-white border-l border-sand-200">
          <div className="px-4 py-3 border-b border-sand-100 flex items-center justify-between">
            <p className="text-sm font-semibold">{t.results(filtered.length)}</p>
            {filtered.length > LIST_LIMIT ? (
              <p className="text-[11px] text-[#a09383]">{t.showing(listed.length, filtered.length)}</p>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {listed.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="font-serif text-lg mb-1">{t.empty}</p>
                <p className="text-sm text-[#7a6b5d] mb-3">{t.emptyHint}</p>
                <button type="button" onClick={clearFilters} className="text-sm font-semibold text-terracotta-600">
                  {t.clear}
                </button>
              </div>
            ) : (
              listed.map((c) => (
                <CenterCard
                  key={c.id}
                  c={c}
                  locale={locale}
                  selected={c.id === selectedId}
                  onPick={() => setSelectedId(c.id)}
                  t={t}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-sand-200 shadow-[0_-4px_16px_rgba(45,35,25,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 px-3">
          {(
            [
              ['map', MapIcon, t.map],
              ['filters', Filter, t.filters],
              ['list', List, t.list],
            ] as const
          ).map(([view, Icon, label]) => {
            const active = mobileView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 ${
                  active ? 'text-terracotta-600' : 'text-[#7a6b5d]'
                }`}
              >
                <span className={`relative px-4 py-1 rounded-full ${active ? 'bg-terracotta-50' : ''}`}>
                  <Icon size={22} />
                  {view === 'filters' && filterCount > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-terracotta-600 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {filterCount}
                    </span>
                  ) : null}
                  {view === 'list' && filtered.length > 0 ? (
                    <span className="absolute -top-1.5 -right-3 bg-terracotta-600 text-white text-[10px] min-w-[20px] px-1.5 py-px rounded-full font-bold text-center">
                      {filtered.length > 99 ? '99+' : filtered.length}
                    </span>
                  ) : null}
                </span>
                <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <DirectorySheet isOpen={mobileView === 'filters'} onClose={() => setMobileView('map')} title={t.filters}>
        <div className="py-2 space-y-3">
          <FilterFields
            query={query}
            setQuery={setQuery}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            minRating={minRating}
            setMinRating={setMinRating}
            sortBy={sortBy}
            setSortBy={setSortBy}
            provinces={provinces}
            hasActive={hasActive}
            onClear={clearFilters}
            t={t}
            locale={locale}
          />
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className="w-full bg-terracotta-600 text-white font-semibold py-3 rounded-xl"
          >
            {t.apply(filtered.length)}
          </button>
        </div>
      </DirectorySheet>

      <DirectorySheet isOpen={mobileView === 'list'} onClose={() => setMobileView('map')} title={t.results(filtered.length)}>
        <div className="space-y-2 py-2">
          <div className="sticky top-0 bg-white pb-3 border-b border-sand-100 z-10">
            <label className="block text-sm font-medium text-[#7a6b5d] mb-2">{t.sort}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-sand-50 border border-sand-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="rating">{t.sortRating}</option>
              <option value="reviews">{t.sortReviews}</option>
              <option value="name">{t.sortName}</option>
              <option value="near">{t.sortNear}</option>
            </select>
          </div>
          {filtered.length > LIST_LIMIT ? (
            <p className="text-xs text-center text-[#7a6b5d] py-1">{t.showing(listed.length, filtered.length)}</p>
          ) : null}
          {listed.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-serif text-lg mb-1">{t.empty}</p>
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-terracotta-600">
                {t.clear}
              </button>
            </div>
          ) : (
            listed.map((c) => (
              <CenterCard
                key={c.id}
                c={c}
                locale={locale}
                selected={c.id === selectedId}
                onPick={() => {
                  setSelectedId(c.id);
                  if (c.latitude != null) setMobileView('map');
                }}
                t={t}
              />
            ))
          )}
        </div>
      </DirectorySheet>
    </div>
  );
}
