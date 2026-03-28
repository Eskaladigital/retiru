'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ChevronDown, Check, Building2 } from 'lucide-react';
import { centerFilterOptionsPublic } from '@/lib/utils';

const CENTER_TYPE_OPTIONS = centerFilterOptionsPublic('es');

const CITIES = [
  { slug: '', name: 'Toda España' },
  { slug: 'madrid', name: 'Madrid' },
  { slug: 'barcelona', name: 'Barcelona' },
  { slug: 'valencia', name: 'Valencia' },
  { slug: 'sevilla', name: 'Sevilla' },
  { slug: 'murcia', name: 'Murcia' },
  { slug: 'malaga', name: 'Málaga' },
  { slug: 'bilbao', name: 'Bilbao' },
  { slug: 'granada', name: 'Granada' },
];

export default function CentrosSearch() {
  const router = useRouter();
  const [queryText, setQueryText] = useState('');
  const [centerType, setCenterType] = useState(CENTER_TYPE_OPTIONS[0]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [city, setCity] = useState(CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.slug && !queryText.trim() && !centerType.slug) {
      router.push(`/es/centros-retiru/${city.slug}`);
      return;
    }
    const params = new URLSearchParams();
    if (queryText.trim()) params.set('q', queryText.trim());
    if (centerType.slug) params.set('tipo', centerType.slug);
    if (city.slug) params.set('ciudad', city.slug);
    const qs = params.toString();
    router.push(`/es/centros-retiru${qs ? `?${qs}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors">
        <Search className="w-5 h-5 text-[#a09383] shrink-0" />
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Nombre del centro, disciplina..."
          className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-[#a09383] font-sans"
        />
      </div>
      <div className="hidden md:block w-px h-8 bg-sand-200" />
      <div className="flex-1 min-w-0">
        <Popover.Root open={typeOpen} onOpenChange={setTypeOpen}>
          <Popover.Trigger asChild>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left">
              <Building2 className="w-5 h-5 text-[#a09383] shrink-0" />
              <span className={`flex-1 text-[15px] font-sans truncate ${centerType.slug ? 'text-foreground' : 'text-[#a09383]'}`}>{centerType.slug ? centerType.label : 'Tipo'}</span>
              <ChevronDown className={`w-4 h-4 text-[#a09383] shrink-0 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="z-50 rounded-2xl border border-sand-200 bg-white shadow-elevated w-[220px] max-h-[300px] overflow-y-auto" side="bottom" align="start" sideOffset={2}>
              <div className="p-1.5">
                {CENTER_TYPE_OPTIONS.map((t) => (
                  <button key={t.slug || '__all__'} type="button" onClick={() => { setCenterType(t); setTypeOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] ${centerType.slug === t.slug ? 'bg-sage-50 text-sage-700 font-semibold' : 'text-foreground hover:bg-sand-50'}`}>
                    {centerType.slug === t.slug && <Check className="w-3.5 h-3.5 text-sage-600 shrink-0" />}
                    {centerType.slug !== t.slug && <span className="w-3.5 shrink-0" />}
                    {t.label}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <div className="hidden md:block w-px h-8 bg-sand-200" />
      <div className="flex-1 min-w-0">
        <Popover.Root open={cityOpen} onOpenChange={setCityOpen}>
          <Popover.Trigger asChild>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left">
              <MapPin className="w-5 h-5 text-[#a09383] shrink-0" />
              <span className={`flex-1 text-[15px] font-sans truncate ${city.slug ? 'text-foreground' : 'text-[#a09383]'}`}>{city.slug ? city.name : '¿Ciudad?'}</span>
              <ChevronDown className={`w-4 h-4 text-[#a09383] shrink-0 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="z-50 rounded-2xl border border-sand-200 bg-white shadow-elevated w-[220px] max-h-[300px] overflow-y-auto" side="bottom" align="start" sideOffset={2}>
              <div className="p-1.5">
                {CITIES.map((c) => (
                  <button key={c.slug || '__all__'} type="button" onClick={() => { setCity(c); setCityOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] ${city.slug === c.slug ? 'bg-sage-50 text-sage-700 font-semibold' : 'text-foreground hover:bg-sand-50'}`}>
                    {city.slug === c.slug && <Check className="w-3.5 h-3.5 text-sage-600 shrink-0" />}
                    {city.slug !== c.slug && <span className="w-3.5 shrink-0" />}
                    {c.name}
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <button type="submit" className="flex items-center justify-center gap-2 bg-sage-700 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_2px_8px_rgba(92,127,96,0.3)] hover:bg-sage-800 transition-all whitespace-nowrap">
        <Search className="w-[18px] h-[18px]" /> Buscar
      </button>
    </form>
  );
}
