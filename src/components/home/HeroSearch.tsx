'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown, Check, X, Building2, CalendarDays } from 'lucide-react';
import {
  CENTER_QUALITY_MEDAL_SLUGS,
  CENTER_QUALITY_TIERS,
  CENTER_TYPE_META,
  PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS,
  getCenterTypeLabel,
} from '@/lib/utils';

type SearchMode = 'eventos' | 'centros';

const DESTINATIONS_BASE = [
  { slug: 'ibiza', name: 'Ibiza' },
  { slug: 'mallorca', name: 'Mallorca' },
  { slug: 'costa-brava', name: 'Costa Brava' },
  { slug: 'sierra-nevada', name: 'Sierra Nevada' },
  { slug: 'pais-vasco', name: 'País Vasco' },
  { slug: 'lanzarote', name: 'Lanzarote' },
  { slug: 'alpujarras', name: 'Las Alpujarras' },
  { slug: 'priorat', name: 'Priorat' },
];

const COPY = {
  es: {
    centers: 'Centros',
    events: 'Retiros y clases',
    eventsPh: 'Clase de yoga, retiro, taller...',
    centersPh: 'Nombre del centro, ciudad…',
    where: '¿Dónde?',
    dates: '¿Entre qué fechas?',
    search: 'Buscar',
    openMap: 'Abrir el mapa',
    mapAlt: 'Vista de España con los centros de Retiru',
    quality: 'Valoración',
    mapPath: '/es/centros-retiru',
    eventsPath: '/es/retiros-retiru',
    typeParam: 'tipo',
    qualityParam: 'calidad',
    destParam: 'destino',
    fromParam: 'fechaDesde',
    toParam: 'fechaHasta',
  },
  en: {
    centers: 'Centers',
    events: 'Retreats & classes',
    eventsPh: 'Yoga class, retreat, workshop...',
    centersPh: 'Center name, city…',
    where: 'Where?',
    dates: 'When?',
    search: 'Search',
    openMap: 'Open the map',
    mapAlt: 'Spain overview of Retiru centers',
    quality: 'Rating',
    mapPath: '/en/centers-retiru',
    eventsPath: '/en/retreats-retiru',
    typeParam: 'type',
    qualityParam: 'quality',
    destParam: 'destination',
    fromParam: 'dateFrom',
    toParam: 'dateTo',
  },
} as const;

export default function HeroSearch({ locale = 'es' }: { locale?: 'es' | 'en' }) {
  const router = useRouter();
  const t = COPY[locale];
  const dateLocale = locale === 'en' ? enUS : es;
  const [mode, setMode] = useState<SearchMode>('centros');

  const [queryText, setQueryText] = useState('');

  const destinations = [
    { slug: '', name: locale === 'en' ? 'All destinations' : 'Todos los destinos' },
    ...DESTINATIONS_BASE,
  ];
  const [destino, setDestino] = useState(destinations[0]);
  const [destOpen, setDestOpen] = useState(false);
  const [rangoFechas, setRangoFechas] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);

  const dateLabel = rangoFechas?.from
    ? rangoFechas.to
      ? `${format(rangoFechas.from, 'd MMM', { locale: dateLocale })} – ${format(rangoFechas.to, 'd MMM', { locale: dateLocale })}`
      : format(rangoFechas.from, 'd MMM yyyy', { locale: dateLocale })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (queryText.trim()) params.set('q', queryText.trim());

    if (mode === 'eventos') {
      if (destino.slug) params.set(t.destParam, destino.slug);
      if (rangoFechas?.from) params.set(t.fromParam, format(rangoFechas.from, 'yyyy-MM-dd'));
      if (rangoFechas?.to) params.set(t.toParam, format(rangoFechas.to, 'yyyy-MM-dd'));
      const qs = params.toString();
      router.push(`${t.eventsPath}${qs ? `?${qs}` : ''}`);
      return;
    }
    const qs = params.toString();
    router.push(`${t.mapPath}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-3 bg-sand-200/60 rounded-full p-1 w-fit mx-auto md:mx-0">
        <button
          type="button"
          onClick={() => setMode('centros')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'centros'
              ? 'bg-white text-sage-700 shadow-sm'
              : 'text-[#7a6b5d] hover:text-foreground'
          }`}
        >
          <Building2 size={15} />
          {t.centers}
        </button>
        <button
          type="button"
          onClick={() => setMode('eventos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'eventos'
              ? 'bg-white text-terracotta-700 shadow-sm'
              : 'text-[#7a6b5d] hover:text-foreground'
          }`}
        >
          <CalendarDays size={15} />
          {t.events}
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-2">
        {/* Text input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors">
          <Search className="w-5 h-5 text-[#a09383] shrink-0" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={mode === 'eventos' ? t.eventsPh : t.centersPh}
            className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans"
          />
        </div>
        <div className="hidden md:block w-px h-8 bg-sand-200" />

        {mode === 'eventos' ? (
          <>
            {/* Destino */}
            <div className="flex-1 min-w-0">
              <DropdownSelect
                items={destinations}
                selected={destino}
                onSelect={(d) => { setDestino(d); setDestOpen(false); }}
                open={destOpen}
                onOpenChange={setDestOpen}
                icon={<MapPin className="w-5 h-5 text-[#a09383] shrink-0" />}
                placeholder={t.where}
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-sand-200" />

            {/* Fechas */}
            <div className="flex-1 min-w-0">
              <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left"
                  >
                    <svg className="w-5 h-5 text-[#a09383] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span className={`flex-1 text-[15px] font-sans truncate ${dateLabel ? 'text-foreground' : 'text-[#a09383]'}`}>
                      {dateLabel || t.dates}
                    </span>
                    {dateLabel && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRangoFechas(undefined); }}
                        className="p-0.5 rounded-full hover:bg-sand-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-[#a09383]" />
                      </button>
                    )}
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-50 rounded-2xl border border-sand-200 bg-white shadow-elevated animate-[scaleIn_0.15s_ease-out]"
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    avoidCollisions={false}
                  >
                    <style>{calendarCSS}</style>
                    <DayPicker
                      className="retiru-calendar"
                      mode="range"
                      selected={rangoFechas}
                      onSelect={(range) => {
                        setRangoFechas(range);
                        if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                          setTimeout(() => setDateOpen(false), 2000);
                        }
                      }}
                      locale={dateLocale}
                      disabled={{ before: new Date() }}
                      numberOfMonths={2}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </>
        ) : null}

        {mode === 'eventos' ? (
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(200,90,48,0.3)] hover:bg-terracotta-700 transition-all whitespace-nowrap"
          >
            <Search className="w-[18px] h-[18px]" />
            {t.search}
          </button>
        ) : (
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(200,90,48,0.3)] hover:bg-terracotta-700 transition-all whitespace-nowrap"
          >
            <Search className="w-[18px] h-[18px]" />
            {t.openMap}
          </button>
        )}
      </form>

      {mode === 'centros' ? (
        <div className="px-1 pt-3 pb-1">
          <div className="flex flex-wrap gap-2">
            {PUBLIC_DIRECTORY_CENTER_TYPE_SLUGS.map((slug) => {
              const meta = CENTER_TYPE_META[slug];
              return (
                <Link
                  key={slug}
                  href={`${t.mapPath}?${t.typeParam}=${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-sand-50"
                  style={{ borderColor: `${meta.color}55`, color: meta.color }}
                >
                  <span aria-hidden>{meta.icon}</span>
                  {getCenterTypeLabel(slug, locale)}
                </Link>
              );
            })}
          </div>
          <p className="mt-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#a09383]">{t.quality}</p>
          <div className="flex flex-wrap gap-2">
            {CENTER_QUALITY_MEDAL_SLUGS.map((tier) => {
              const meta = CENTER_QUALITY_TIERS[tier];
              return (
                <Link
                  key={tier}
                  href={`${t.mapPath}?${t.qualityParam}=${tier}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-sand-300 hover:bg-sand-50"
                >
                  <span aria-hidden>{meta.icon}</span>
                  {meta[locale].name}
                </Link>
              );
            })}
          </div>
          <MapPreview href={t.mapPath} cta={t.openMap} alt={t.mapAlt} />
        </div>
      ) : null}
    </div>
  );
}

function MapPreview({ href, cta, alt }: { href: string; cta: string; alt: string }) {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const src = key
    ? `https://api.maptiler.com/maps/streets-v2/static/-3.7,40.4,5.5/800x280@2x.png?key=${encodeURIComponent(key)}&language=es`
    : null;
  return (
    <Link href={href} className="relative mt-3 block h-36 overflow-hidden rounded-xl md:h-40 group">
      {src ? (
        // MapTiler estático: no pasa por next/image (LCP del hero no es esta foto)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-sage-100 via-sand-100 to-terracotta-50" aria-hidden />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[#2d2319]/55 to-transparent" aria-hidden />
      <span className="absolute bottom-3 left-3 right-3 inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(200,90,48,0.3)] transition-colors group-hover:bg-terracotta-700">
        <MapPin className="h-4 w-4" />
        {cta}
      </span>
    </Link>
  );
}

/* ─── Dropdown helper ────────────────────────────────────────── */

interface DropdownItem { slug: string; name: string }

function DropdownSelect({
  items, selected, onSelect, open, onOpenChange, icon, placeholder,
}: {
  items: DropdownItem[];
  selected: DropdownItem;
  onSelect: (item: DropdownItem) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  placeholder: string;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left"
        >
          {icon}
          <span className={`flex-1 text-[15px] font-sans truncate ${selected.slug ? 'text-foreground' : 'text-[#a09383]'}`}>
            {selected.slug ? selected.name : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#a09383] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-2xl border border-sand-200 bg-white shadow-elevated w-[220px] max-h-[300px] overflow-y-auto animate-[scaleIn_0.15s_ease-out]"
          side="bottom"
          align="start"
          sideOffset={2}
        >
          <div className="p-1.5">
            {items.map((d) => {
              const isActive = selected.slug === d.slug;
              return (
                <button
                  key={d.slug || '__all__'}
                  type="button"
                  onClick={() => onSelect(d)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors
                    ${isActive
                      ? 'bg-terracotta-50 text-terracotta-700 font-semibold'
                      : 'text-foreground hover:bg-sand-50'
                    }
                  `}
                >
                  {isActive && <Check className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />}
                  {!isActive && <span className="w-3.5 shrink-0" />}
                  {d.name}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ─── Calendar CSS ───────────────────────────────────────────── */

export const calendarCSS = `
  .retiru-calendar {
    --rdp-accent-color: #c85a30;
    --rdp-accent-background-color: rgba(200, 90, 48, 0.12);
    --rdp-range_start-color: white;
    --rdp-range_start-background: none;
    --rdp-range_start-date-background-color: #c85a30;
    --rdp-range_end-color: white;
    --rdp-range_end-background: none;
    --rdp-range_end-date-background-color: #c85a30;
    --rdp-range_middle-background-color: rgba(200, 90, 48, 0.12);
    --rdp-range_middle-color: #2d2319;
    --rdp-selected-font: 600 12px/1 'DM Sans', system-ui, sans-serif;
    --rdp-day-width: 36px;
    --rdp-day-height: 32px;
    --rdp-outside-opacity: 0.25;
    font-family: 'DM Sans', system-ui, sans-serif;
    padding: 16px 20px;
    font-size: 12px;
  }
  .retiru-calendar .rdp-months {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  @media (max-width: 640px) {
    .retiru-calendar .rdp-months {
      flex-direction: column !important;
      gap: 16px;
    }
  }
  .retiru-calendar .rdp-month_caption {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 14px;
    color: #2d2319;
    padding-bottom: 6px;
  }
  .retiru-calendar .rdp-day_button {
    font-size: 13px;
    width: 36px;
    height: 32px;
  }
  .retiru-calendar .rdp-day_button:hover {
    background: #f9f5ed;
    border-radius: 6px;
  }
  .retiru-calendar .rdp-range_start .rdp-day_button,
  .retiru-calendar .rdp-range_end .rdp-day_button {
    background: #c85a30 !important;
    color: white !important;
    border-radius: 8px !important;
    font-weight: 700;
  }
  .retiru-calendar .rdp-range_middle {
    background: rgba(200, 90, 48, 0.12);
  }
  .retiru-calendar .rdp-range_middle .rdp-day_button {
    color: #853a26;
    font-weight: 500;
  }
  .retiru-calendar .rdp-weekday {
    font-size: 11px;
    color: #a09383;
    font-weight: 600;
    width: 36px;
  }
  .retiru-calendar .rdp-weekday:nth-child(6),
  .retiru-calendar .rdp-weekday:nth-child(7) {
    color: #d0a876;
  }
  .retiru-calendar .rdp-day:nth-child(6) .rdp-day_button,
  .retiru-calendar .rdp-day:nth-child(7) .rdp-day_button {
    color: #a09383;
  }
  .retiru-calendar .rdp-range_start.rdp-day:nth-child(6) .rdp-day_button,
  .retiru-calendar .rdp-range_start.rdp-day:nth-child(7) .rdp-day_button,
  .retiru-calendar .rdp-range_end.rdp-day:nth-child(6) .rdp-day_button,
  .retiru-calendar .rdp-range_end.rdp-day:nth-child(7) .rdp-day_button {
    color: white !important;
  }
  .retiru-calendar .rdp-nav {
    display: flex;
    gap: 4px;
  }
  .retiru-calendar .rdp-nav button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid #f2e9d6;
    background: white;
    color: #7a6b5d;
    transition: all 0.15s;
  }
  .retiru-calendar .rdp-nav button:hover {
    background: #c85a30;
    border-color: #c85a30;
    color: white;
  }
  .retiru-calendar .rdp-nav button svg {
    width: 14px;
    height: 14px;
  }
  .retiru-calendar .rdp-today .rdp-day_button {
    font-weight: 700;
    color: #c85a30;
  }
  .retiru-calendar .rdp-disabled .rdp-day_button {
    color: #e8d7b8;
  }
`;
