// /es/destinos — Lista de destinos
import type { Metadata } from 'next';
import Link from 'next/link';
import { destinationsES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = destinationsES;

const DESTS = [
  { slug: 'ibiza', name: 'Ibiza', count: 34, desc: 'La isla de la calma: retiros frente al Mediterráneo.', img: 'https://images.unsplash.com/photo-1534766555764-ce878a4e947d?w=600&q=80' },
  { slug: 'mallorca', name: 'Mallorca', count: 28, desc: 'Sierra de Tramuntana, calas y bienestar.', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80' },
  { slug: 'costa-brava', name: 'Costa Brava', count: 19, desc: 'Acantilados, pueblos medievales y naturaleza.', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
  { slug: 'sierra-nevada', name: 'Sierra Nevada', count: 15, desc: 'Montaña, aire puro y desconexión total.', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { slug: 'pais-vasco', name: 'País Vasco', count: 12, desc: 'Gastronomía, verde y tradición.', img: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80' },
  { slug: 'lanzarote', name: 'Lanzarote', count: 18, desc: 'Paisajes volcánicos y wellness.', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80' },
  { slug: 'alpujarras', name: 'Las Alpujarras', count: 9, desc: 'Pueblos blancos entre montañas.', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80' },
  { slug: 'priorat', name: 'Priorat', count: 7, desc: 'Viñedos, vino y gastronomía.', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
];

export default function DestinosPage() {
  return (
    <div className="container-wide py-12">
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Destinos</h1>
      <p className="text-[#7a6b5d] mb-10 max-w-lg">Los rincones más especiales de España para tu próximo retiro</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {DESTS.map((d) => (
          <Link key={d.slug} href={`/es/destinos/${d.slug}`} className="group rounded-2xl overflow-hidden relative cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="aspect-[4/3] relative">
              <img src={d.img} alt={d.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.7)] to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="font-serif text-xl text-white">{d.name}</h2>
                <p className="text-[13px] text-white/80 mt-0.5">{d.count} retiros</p>
              </div>
            </div>
            <div className="bg-white border border-t-0 border-sand-200 rounded-b-2xl p-4">
              <p className="text-sm text-[#7a6b5d]">{d.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
