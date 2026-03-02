// /es/centros-retiru/[slug] — Centros filtrados por ciudad (ej. murcia)
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';

const CITIES: Record<string, string> = {
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia', sevilla: 'Sevilla',
  murcia: 'Murcia', malaga: 'Málaga', bilbao: 'Bilbao', granada: 'Granada',
};

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

function citySlug(city: string): string {
  return city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '-');
}

export async function generateStaticParams() {
  return Object.keys(CITIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cityName = CITIES[slug] || slug;
  return {
    title: `Centros de bienestar en ${cityName} | Retiru`,
    description: `Encuentra centros de yoga, meditación, wellness y spa en ${cityName}. Directorio verificado.`,
  };
}

export default async function CentrosPorCiudadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cityName = CITIES[slug];
  if (!cityName) {
    return (
      <div className="container-wide py-12">
        <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Directorio de centros
        </Link>
        <p className="font-serif text-xl text-foreground">Ciudad no encontrada</p>
      </div>
    );
  }

  const filtered = CENTERS.filter(c => citySlug(c.city) === slug);

  return (
    <>
      {/* Hero con buscador */}
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1545389336-cf090694435e?w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">Centros en {cityName}</h1>
            <p className="text-lg text-[#7a6b5d] mb-6">Yoga, meditación, wellness y spa en {cityName}</p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Todos los centros
        </Link>
        <p className="text-sm text-[#a09383] mb-6">{filtered.length} centro{filtered.length !== 1 ? 's' : ''} en {cityName}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No hay centros en {cityName}</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Prueba otra ciudad o explora el directorio completo</p>
            <Link href="/es/centros-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">Ver directorio completo</Link>
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
                  {c.featured && <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Destacado</span>}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{c.type}</span>
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {c.city}, {c.province}</span>
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
                    {c.services.slice(0, 4).map(s => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{s}</span>)}
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
      </div>
    </>
  );
}
