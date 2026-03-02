// /es/destinos/[slug] — Retiros en un destino
import Link from 'next/link';

const MOCK = [
  { slug: 'retiro-yoga-ibiza', title: 'Retiro de Yoga y Meditación frente al mar', price: 790, dates: '15–20 Jun 2026 · 6 días', rating: 4.9, reviews: 23, spots: 3, spotsLow: true, instant: true, category: 'Yoga', img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80' },
  { slug: 'wellness-ibiza-spa', title: 'Wellness & Spa en Ibiza', price: 1100, dates: '1–7 Aug 2026 · 7 días', rating: 4.9, reviews: 31, spots: 2, spotsLow: true, instant: true, category: 'Wellness', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
];

export default function DestinoDetailPage({ params }: { params: { slug: string } }) {
  const name = params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return (
    <div className="container-wide py-12">
      <Link href="/es/destinos" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Todos los destinos
      </Link>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Retiros en {name}</h1>
      <p className="text-[#7a6b5d] mb-10">{MOCK.length} retiros disponibles</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK.map((e) => (
          <Link key={e.slug} href={`/es/retiro/${e.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{e.category}</span>
                {e.instant && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white">⚡ Inmediata</span>}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-serif text-xl leading-[1.3] mb-2 line-clamp-2">{e.title}</h3>
              <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-1.5">
                <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {e.dates}
              </div>
              <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                <div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span><br/><span className="text-2xl font-bold">{e.price}€</span> <span className="text-sm text-[#7a6b5d]">/persona</span></div>
                <span className={`text-[13px] font-medium ${e.spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>{e.spotsLow ? '🔥' : ''} {e.spots} plazas</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
