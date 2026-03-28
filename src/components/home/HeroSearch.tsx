'use client';

import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown, Check, X, Building2, CalendarDays } from 'lucide-react';
import { centerFilterOptionsPublic } from '@/lib/utils';

type SearchMode = 'eventos' | 'centros';

const DESTINATIONS = [
  { slug: '', name: 'Todos los destinos' },
  { slug: 'ibiza', name: 'Ibiza' },
  { slug: 'mallorca', name: 'Mallorca' },
  { slug: 'costa-brava', name: 'Costa Brava' },
  { slug: 'sierra-nevada', name: 'Sierra Nevada' },
  { slug: 'pais-vasco', name: 'País Vasco' },
  { slug: 'lanzarote', name: 'Lanzarote' },
  { slug: 'alpujarras', name: 'Las Alpujarras' },
  { slug: 'priorat', name: 'Priorat' },
];

const CENTER_TYPES = centerFilterOptionsPublic('es').map((o) => ({ slug: o.slug, name: o.label }));

const PROVINCES = [
  { slug: '', name: 'Toda España' },
  { slug: 'madrid', name: 'Madrid' },
  { slug: 'barcelona', name: 'Barcelona' },
  { slug: 'valencia', name: 'Valencia' },
  { slug: 'sevilla', name: 'Sevilla' },
  { slug: 'malaga', name: 'Málaga' },
  { slug: 'baleares', name: 'Baleares' },
  { slug: 'vizcaya', name: 'Vizcaya' },
  { slug: 'granada', name: 'Granada' },
  { slug: 'murcia', name: 'Murcia' },
  { slug: 'asturias', name: 'Asturias' },
  { slug: 'cadiz', name: 'Cádiz' },
  { slug: 'las-palmas', name: 'Las Palmas' },
  { slug: 'navarra', name: 'Navarra' },
  { slug: 'girona', name: 'Girona' },
  { slug: 'tarragona', name: 'Tarragona' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>('eventos');

  // Shared
  const [queryText, setQueryText] = useState('');

  // Events mode
  const [destino, setDestino] = useState(DESTINATIONS[0]);
  const [destOpen, setDestOpen] = useState(false);
  const [rangoFechas, setRangoFechas] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);

  // Centers mode
  const [centerType, setCenterType] = useState(CENTER_TYPES[0]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [province, setProvince] = useState(PROVINCES[0]);
  const [provOpen, setProvOpen] = useState(false);

  const dateLabel = rangoFechas?.from
    ? rangoFechas.to
      ? `${format(rangoFechas.from, 'd MMM', { locale: es })} – ${format(rangoFechas.to, 'd MMM', { locale: es })}`
      : format(rangoFechas.from, 'd MMM yyyy', { locale: es })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (mode === 'eventos') {
      if (queryText.trim()) params.set('q', queryText.trim());
      if (destino.slug) params.set('destino', destino.slug);
      if (rangoFechas?.from) params.set('fechaDesde', format(rangoFechas.from, 'yyyy-MM-dd'));
      if (rangoFechas?.to) params.set('fechaHasta', format(rangoFechas.to, 'yyyy-MM-dd'));
      const qs = params.toString();
      router.push(`/es/retiros-retiru${qs ? `?${qs}` : ''}`);
    } else {
      if (queryText.trim()) params.set('q', queryText.trim());
      if (centerType.slug) params.set('tipo', centerType.slug);
      if (province.slug) params.set('provincia', province.slug);
      const qs = params.toString();
      router.push(`/es/centros-retiru${qs ? `?${qs}` : ''}`);
    }
  };

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-3 bg-sand-200/60 rounded-full p-1 w-fit mx-auto md:mx-0">
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
          Retiros
        </button>
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
          Centros
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
            placeholder={mode === 'eventos' ? 'Yoga, meditación, ayurveda...' : 'Nombre del centro, disciplina...'}
            className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans"
          />
        </div>
        <div className="hidden md:block w-px h-8 bg-sand-200" />

        {mode === 'eventos' ? (
          <>
            {/* Destino */}
            <div className="flex-1 min-w-0">
              <DropdownSelect
                items={DESTINATIONS}
                selected={destino}
                onSelect={(d) => { setDestino(d); setDestOpen(false); }}
                open={destOpen}
                onOpenChange={setDestOpen}
                icon={<MapPin className="w-5 h-5 text-[#a09383] shrink-0" />}
                placeholder="¿Dónde?"
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
                      {dateLabel || '¿Entre qué fechas?'}
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
                      locale={es}
                      disabled={{ before: new Date() }}
                      numberOfMonths={2}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </>
        ) : (
          <>
            {/* Tipo de centro */}
            <div className="flex-1 min-w-0">
              <DropdownSelect
                items={CENTER_TYPES}
                selected={centerType}
                onSelect={(t) => { setCenterType(t); setTypeOpen(false); }}
                open={typeOpen}
                onOpenChange={setTypeOpen}
                icon={<Building2 className="w-5 h-5 text-[#a09383] shrink-0" />}
                placeholder="Tipo de centro"
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-sand-200" />

            {/* Provincia */}
            <div className="flex-1 min-w-0">
              <DropdownSelect
                items={PROVINCES}
                selected={province}
                onSelect={(p) => { setProvince(p); setProvOpen(false); }}
                open={provOpen}
                onOpenChange={setProvOpen}
                icon={<MapPin className="w-5 h-5 text-[#a09383] shrink-0" />}
                placeholder="Toda España"
              />
            </div>
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(200,90,48,0.3)] hover:bg-terracotta-700 transition-all whitespace-nowrap"
        >
          <Search className="w-[18px] h-[18px]" />
          Buscar
        </button>
      </form>
    </div>
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

const calendarCSS = `
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
