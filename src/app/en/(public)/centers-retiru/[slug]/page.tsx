// /en/centers-retiru/[slug] — Centers filtered by city (e.g. murcia)
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';

const CITIES: Record<string, string> = {
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia', sevilla: 'Seville',
  murcia: 'Murcia', malaga: 'Málaga', bilbao: 'Bilbao', granada: 'Granada',
};

const CENTERS = [
  { slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', city: 'Madrid', province: 'Madrid', rating: 4.9, reviews: 87, featured: true, services: ['Hatha Yoga', 'Vinyasa', 'Ashtanga', 'Meditation'], schedule: 'Mon-Fri 7:00-21:00 · Sat 9:00-14:00', priceRange: 'From 14€/class', img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80', desc: 'Yoga studio in central Madrid with internationally certified teachers.' },
  { slug: 'espacio-zen-barcelona', name: 'Espacio Zen Barcelona', type: 'Meditation', city: 'Barcelona', province: 'Barcelona', rating: 4.8, reviews: 63, featured: true, services: ['Zen Meditation', 'Mindfulness', 'Silent workshops'], schedule: 'Mon-Sat 8:00-20:00', priceRange: 'From 10€/session', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80', desc: 'Meditation center specializing in mindfulness with over 15 years of experience.' },
  { slug: 'bienestar-integral-valencia', name: 'Bienestar Integral', type: 'Wellness', city: 'Valencia', province: 'Valencia', rating: 4.7, reviews: 41, featured: false, services: ['Yoga', 'Pilates', 'Nutrition', 'Massage'], schedule: 'Mon-Fri 8:00-21:00', priceRange: 'From 12€/class', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', desc: 'Wellness center combining yoga, pilates, nutrition and body therapies.' },
  { slug: 'om-yoga-sevilla', name: 'Om Yoga Sevilla', type: 'Yoga', city: 'Seville', province: 'Seville', rating: 4.9, reviews: 112, featured: true, services: ['Kundalini', 'Hatha', 'Restorative yoga', 'Teacher training'], schedule: 'Mon-Sat 7:30-21:30', priceRange: 'From 15€/class', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', desc: 'The largest yoga studio in Seville. Yoga Alliance certified teacher training.' },
  { slug: 'spa-termal-murcia', name: 'Spa Termal Murcia', type: 'Spa', city: 'Murcia', province: 'Murcia', rating: 4.6, reviews: 34, featured: false, services: ['Thermal circuit', 'Massages', 'Facials', 'Flotation'], schedule: 'Mon-Sun 10:00-22:00', priceRange: 'From 25€/circuit', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&q=80', desc: 'Urban spa with natural thermal waters and extensive treatment menu.' },
  { slug: 'shala-yoga-malaga', name: 'Shala Yoga Málaga', type: 'Yoga', city: 'Málaga', province: 'Málaga', rating: 4.8, reviews: 58, featured: false, services: ['Ashtanga', 'Yin Yoga', 'Meditation', 'Workshops'], schedule: 'Mon-Fri 7:00-20:30 · Sat 9:00-13:00', priceRange: 'From 12€/class', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80', desc: 'Intimate shala dedicated to Ashtanga yoga practice in central Málaga.' },
  { slug: 'pilates-studio-bilbao', name: 'Pilates Studio Bilbao', type: 'Pilates', city: 'Bilbao', province: 'Biscay', rating: 4.7, reviews: 29, featured: false, services: ['Pilates Mat', 'Pilates Reformer', 'Prenatal Pilates'], schedule: 'Mon-Fri 8:00-21:00', priceRange: 'From 18€/class', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', desc: 'Pilates studio with Reformer machines and personalized classes in Bilbao.' },
  { slug: 'centro-ayurveda-granada', name: 'Centro Ayurveda Granada', type: 'Wellness', city: 'Granada', province: 'Granada', rating: 4.5, reviews: 22, featured: false, services: ['Ayurveda', 'Abhyanga massage', 'Nutritional consultation', 'Panchakarma'], schedule: 'Mon-Fri 9:00-19:00', priceRange: 'From 45€/session', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80', desc: 'Center specialized in Ayurvedic medicine with therapists trained in India.' },
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
    title: `Wellness centers in ${cityName} | Retiru`,
    description: `Find yoga, meditation, wellness and spa centers in ${cityName}. Verified directory.`,
  };
}

export default async function CentersByCityPageEN({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cityName = CITIES[slug];
  if (!cityName) {
    return (
      <div className="container-wide py-12">
        <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Centers directory
        </Link>
        <p className="font-serif text-xl text-foreground">City not found</p>
      </div>
    );
  }

  const filtered = CENTERS.filter(c => citySlug(c.city) === slug);

  return (
    <div className="container-wide py-10">
      <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        All centers
      </Link>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Centers in {cityName}</h1>
      <p className="text-sm text-[#a09383] mb-6">{filtered.length} center{filtered.length !== 1 ? 's' : ''} in {cityName}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No centers in {cityName}</p>
          <Link href="/en/centers-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">View full directory</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <Link
              key={c.slug}
              href={`/en/center/${c.slug}`}
              className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
            >
              <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {c.featured && <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Featured</span>}
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
  );
}
