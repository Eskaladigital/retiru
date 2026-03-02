// /es/retiros-retiru/[slug] — Eventos filtrados por ciudad/destino (ej. murcia, ibiza)
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, CalendarDays, Users } from 'lucide-react';
import EventosSearch from '@/components/home/EventosSearch';

const DESTINATIONS: Record<string, string> = {
  ibiza: 'Ibiza', mallorca: 'Mallorca', murcia: 'Murcia', barcelona: 'Barcelona', granada: 'Granada',
  'costa-brava': 'Costa Brava', 'sierra-nevada': 'Sierra Nevada', 'pais-vasco': 'País Vasco',
  lanzarote: 'Lanzarote', alpujarras: 'Las Alpujarras', priorat: 'Priorat', cadiz: 'Cádiz',
  asturias: 'Asturias', girona: 'Girona', navarra: 'Navarra',
};

const EVENTS = [
  { slug: 'retiro-yoga-ibiza', title: 'Retiro de Yoga y Meditación frente al mar', type: 'Yoga', price: 890, location: 'Ibiza', province: 'Baleares', destinoSlug: 'ibiza', dates: '15–20 Jun 2026', duration: '6 días', rating: 4.9, reviews: 47, spots: 4, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80' },
  { slug: 'escapada-detox-grazalema', title: 'Escapada Detox en Sierra de Grazalema', type: 'Detox & Ayuno', price: 450, location: 'Grazalema', province: 'Cádiz', destinoSlug: 'cadiz', dates: '22–25 Jul 2026', duration: '4 días', rating: 4.7, reviews: 23, spots: 8, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
  { slug: 'retiro-gastronomico-priorat', title: 'Retiro Gastronómico en el Priorat', type: 'Gastronomía', price: 680, location: 'Priorat', province: 'Tarragona', destinoSlug: 'priorat', dates: '5–8 Sep 2026', duration: '4 días', rating: 4.8, reviews: 31, spots: 6, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { slug: 'mindfulness-montserrat', title: 'Mindfulness y Silencio en Montserrat', type: 'Meditación', price: 320, location: 'Montserrat', province: 'Barcelona', destinoSlug: 'barcelona', dates: '10–12 Oct 2026', duration: '3 días', rating: 4.6, reviews: 18, spots: 12, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { slug: 'wellness-lanzarote', title: 'Wellness & Spa en Lanzarote', type: 'Wellness & Spa', price: 1200, location: 'Lanzarote', province: 'Las Palmas', destinoSlug: 'lanzarote', dates: '1–7 Nov 2026', duration: '7 días', rating: 4.9, reviews: 52, spots: 2, spotsLow: true, instant: true, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { slug: 'yoga-mallorca-sunrise', title: 'Yoga al Amanecer en Mallorca', type: 'Yoga', price: 650, location: 'Deià', province: 'Baleares', destinoSlug: 'mallorca', dates: '3–8 Jul 2026', duration: '6 días', rating: 4.8, reviews: 29, spots: 7, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
  { slug: 'aventura-picos-europa', title: 'Aventura y Naturaleza en Picos de Europa', type: 'Aventura', price: 520, location: 'Picos de Europa', province: 'Asturias', destinoSlug: 'asturias', dates: '15–19 Ago 2026', duration: '5 días', rating: 4.7, reviews: 15, spots: 10, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80' },
  { slug: 'creatividad-cadaques', title: 'Retiro de Escritura Creativa en Cadaqués', type: 'Creatividad', price: 580, location: 'Cadaqués', province: 'Girona', destinoSlug: 'girona', dates: '20–24 Sep 2026', duration: '5 días', rating: 4.9, reviews: 11, spots: 8, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80' },
  { slug: 'hatha-yoga-alpujarras', title: 'Hatha Yoga en las Alpujarras', type: 'Yoga', price: 420, location: 'Alpujarras', province: 'Granada', destinoSlug: 'alpujarras', dates: '12–15 May 2026', duration: '4 días', rating: 4.7, reviews: 14, spots: 10, spotsLow: false, instant: false, img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { slug: 'naturaleza-selva-irati', title: 'Baño de Bosque en la Selva de Irati', type: 'Naturaleza', price: 380, location: 'Selva de Irati', province: 'Navarra', destinoSlug: 'navarra', dates: '8–11 Oct 2026', duration: '4 días', rating: 4.8, reviews: 9, spots: 14, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
  { slug: 'yoga-murcia-retiro', title: 'Retiro de Yoga y Meditación en Murcia', type: 'Yoga', price: 350, location: 'Murcia', province: 'Murcia', destinoSlug: 'murcia', dates: '18–21 Sep 2026', duration: '4 días', rating: 4.8, reviews: 12, spots: 6, spotsLow: false, instant: true, img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80' },
];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const destName = DESTINATIONS[params.slug] || params.slug;
  return {
    title: `Retiros y escapadas en ${destName} | Retiru`,
    description: `Descubre retiros de yoga, meditación, naturaleza y bienestar en ${destName}. Reserva tu plaza.`,
  };
}

export default function EventosPorCiudadPage({ params }: { params: { slug: string } }) {
  const destName = DESTINATIONS[params.slug];
  if (!destName) {
    return (
      <div className="container-wide py-12">
        <Link href="/es/retiros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los retiros
        </Link>
        <p className="font-serif text-xl text-foreground">Destino no encontrado</p>
      </div>
    );
  }

  const filtered = EVENTS.filter(e => e.destinoSlug === params.slug);

  return (
    <>
      {/* Hero con buscador */}
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">Retiros en {destName}</h1>
            <p className="text-lg text-[#7a6b5d] mb-6">Retiros y escapadas en {destName}</p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <EventosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <Link href="/es/retiros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los retiros
        </Link>
        <p className="text-sm text-[#a09383] mb-6">{filtered.length} retiro{filtered.length !== 1 ? 's' : ''} en {destName}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay retiros en {destName}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otro destino o explora todos los retiros</p>
            <Link href="/es/retiros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver todos los retiros</Link>
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
                    <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {e.location}, {e.province}</span>
                    <span className="text-[13px] font-semibold flex items-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" /> {e.rating} <span className="font-normal text-[#7a6b5d]">({e.reviews})</span></span>
                  </div>
                  <h3 className="font-serif text-lg leading-[1.3] mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{e.title}</h3>
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
      </div>
    </>
  );
}
