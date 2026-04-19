'use client';

import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { calendarCSS } from './HeroSearch';

const DESTINATIONS = [
  { slug: '', name: 'Todos los destinos' },
  { slug: 'ibiza', name: 'Ibiza' },
  { slug: 'mallorca', name: 'Mallorca' },
  { slug: 'murcia', name: 'Murcia' },
  { slug: 'barcelona', name: 'Barcelona' },
  { slug: 'granada', name: 'Granada' },
  { slug: 'costa-brava', name: 'Costa Brava' },
  { slug: 'sierra-nevada', name: 'Sierra Nevada' },
  { slug: 'pais-vasco', name: 'País Vasco' },
  { slug: 'lanzarote', name: 'Lanzarote' },
  { slug: 'alpujarras', name: 'Las Alpujarras' },
  { slug: 'priorat', name: 'Priorat' },
  { slug: 'cadiz', name: 'Cádiz' },
  { slug: 'asturias', name: 'Asturias' },
  { slug: 'girona', name: 'Girona' },
  { slug: 'navarra', name: 'Navarra' },
];

export default function EventosSearch() {
  const router = useRouter();
  const [queryText, setQueryText] = useState('');
  const [destino, setDestino] = useState(DESTINATIONS[0]);
  const [destOpen, setDestOpen] = useState(false);
  const [rangoFechas, setRangoFechas] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);

  const dateLabel = rangoFechas?.from
    ? rangoFechas.to
      ? `${format(rangoFechas.from, 'd MMM', { locale: es })} – ${format(rangoFechas.to, 'd MMM', { locale: es })}`
      : format(rangoFechas.from, 'd MMM yyyy', { locale: es })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destino.slug && !queryText.trim() && !rangoFechas?.from) {
      router.push(`/es/retiros-retiru/${destino.slug}`);
      return;
    }
    const params = new URLSearchParams();
    if (queryText.trim()) params.set('q', queryText.trim());
    if (destino.slug) params.set('destino', destino.slug);
    if (rangoFechas?.from) params.set('fechaDesde', format(rangoFechas.from, 'yyyy-MM-dd'));
    if (rangoFechas?.to) params.set('fechaHasta', format(rangoFechas.to, 'yyyy-MM-dd'));
    const qs = params.toString();
    router.push(`/es/retiros-retiru${qs ? `?${qs}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors">
        <Search className="w-5 h-5 text-[#a09383] shrink-0" />
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Yoga, meditación, ayurveda..."
          className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans"
        />
      </div>
      <div className="hidden md:block w-px h-8 bg-sand-200" />
      <div className="flex-1 min-w-0">
        <Popover.Root open={destOpen} onOpenChange={setDestOpen}>
          <Popover.Trigger asChild>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left">
              <MapPin className="w-5 h-5 text-[#a09383] shrink-0" />
              <span className={`flex-1 text-[15px] font-sans truncate ${destino.slug ? 'text-foreground' : 'text-[#a09383]'}`}>{destino.slug ? destino.name : '¿Dónde?'}</span>
              <ChevronDown className={`w-4 h-4 text-[#a09383] shrink-0 transition-transform ${destOpen ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="z-50 rounded-2xl border border-sand-200 bg-white shadow-elevated w-[220px] max-h-[300px] overflow-y-auto" side="bottom" align="start" sideOffset={2}>
              <div className="p-1.5">
                {DESTINATIONS.map((d) => (
                  <button key={d.slug || '__all__'} type="button" onClick={() => { setDestino(d); setDestOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] ${destino.slug === d.slug ? 'bg-terracotta-50 text-terracotta-700 font-semibold' : 'text-foreground hover:bg-sand-50'}`}>
                    {destino.slug === d.slug && <Check className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />}
                    {destino.slug !== d.slug && <span className="w-3.5 shrink-0" />}
                    {d.name}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <div className="hidden md:block w-px h-8 bg-sand-200" />
      <div className="flex-1 min-w-0">
        <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
          <Popover.Trigger asChild>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left">
              <svg className="w-5 h-5 text-[#a09383] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              <span className={`flex-1 text-[15px] font-sans truncate ${dateLabel ? 'text-foreground' : 'text-[#a09383]'}`}>{dateLabel || '¿Entre qué fechas?'}</span>
              {dateLabel && <button type="button" onClick={(e) => { e.stopPropagation(); setRangoFechas(undefined); }} className="p-0.5 rounded-full hover:bg-sand-200"><X className="w-3.5 h-3.5 text-[#a09383]" /></button>}
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
                onSelect={(r) => {
                  setRangoFechas(r);
                  if (r?.from && r?.to && r.from.getTime() !== r.to.getTime()) {
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
      <button type="submit" className="flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(200,90,48,0.3)] hover:bg-terracotta-700 transition-all whitespace-nowrap">
        <Search className="w-[18px] h-[18px]" /> Buscar
      </button>
    </form>
  );
}
