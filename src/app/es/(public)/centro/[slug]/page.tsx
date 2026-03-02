// /es/centro/[slug] — Ficha individual del centro
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // TODO: fetch from Supabase by slug
  return generatePageMetadata({
    title: `Yoga Sala Madrid — Centro de yoga en Madrid`,
    description: 'Estudio de yoga en el centro de Madrid con profesores certificados internacionalmente. Hatha, Vinyasa, Ashtanga, Meditación.',
    locale: 'es',
    path: `/es/centro/${params.slug}`,
    altPath: `/en/center/${params.slug}`,
    ogType: 'website',
    keywords: ['centro yoga madrid', 'yoga sala madrid', 'clases yoga madrid'],
  });
}

const C = {
  slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', plan: 'featured' as const,
  description: 'Yoga Sala Madrid es un estudio de yoga ubicado en el corazón de Madrid, en el barrio de Malasaña. Contamos con un equipo de profesores certificados internacionalmente en diferentes estilos de yoga. Nuestro espacio luminoso y acogedor está diseñado para que puedas desconectar del ruido de la ciudad y conectar contigo mismo.\n\nOfrecemos clases para todos los niveles, desde principiantes absolutos hasta practicantes avanzados. También organizamos talleres, retiros y formaciones de profesores certificadas por Yoga Alliance.',
  city: 'Madrid', province: 'Madrid', address: 'Calle San Vicente Ferrer 42, 28004 Madrid',
  phone: '+34 910 123 456', email: 'info@yogasala.es', website: 'https://yogasala.es', instagram: '@yogasalamadrid',
  rating: 4.9, reviews: 87,
  services: ['Hatha Yoga', 'Vinyasa Flow', 'Ashtanga', 'Yin Yoga', 'Yoga Restaurativo', 'Meditación', 'Pranayama', 'Talleres especiales'],
  schedule: 'Lunes a Viernes 7:00–21:00 · Sábados 9:00–14:00 · Domingos cerrado',
  priceRange: 'Clase suelta 14€ · Bono 5 clases 60€ · Bono 10 clases 110€ · Tarifa plana 89€/mes',
  images: [
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  ],
  reviewsList: [
    { name: 'Ana R.', rating: 5, date: 'Feb 2026', text: 'El mejor estudio de yoga en Madrid. Los profesores son increíbles y el espacio es precioso.' },
    { name: 'Miguel P.', rating: 5, date: 'Ene 2026', text: 'Llevo 2 años y sigo encantado. Las clases de Ashtanga de Laura son espectaculares.' },
    { name: 'Sara K.', rating: 4, date: 'Dic 2025', text: 'Great studio! Very welcoming atmosphere and excellent teachers.' },
  ],
};

export default function CentroDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container-wide py-12">
      <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Directorio de centros
      </Link>

      {/* Image gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
        <div className="md:col-span-2 aspect-[16/10]">
          <img src={C.images[0]} alt={C.name} className="w-full h-full object-cover" />
        </div>
        <div className="hidden md:flex flex-col gap-3">
          {C.images.slice(1, 3).map((img, i) => (
            <div key={i} className="flex-1"><img src={img} alt="" className="w-full h-full object-cover" /></div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="font-serif text-[clamp(24px,3vw,36px)] text-foreground">{C.name}</h1>
            {C.plan === 'featured' && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full mt-2 shrink-0">⭐ Destacado</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#7a6b5d] mb-6">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">{C.type}</span>
            <span>📍 {C.city}, {C.province}</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span className="font-semibold text-foreground">{C.rating}</span> ({C.reviews} reseñas)
            </span>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="font-serif text-xl mb-3">Sobre el centro</h2>
            <div className="text-[15px] text-[#7a6b5d] leading-[1.8] whitespace-pre-line">{C.description}</div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="font-serif text-xl mb-3">Servicios y disciplinas</h2>
            <div className="flex flex-wrap gap-2">
              {C.services.map((s) => (
                <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-foreground">{s}</span>
              ))}
            </div>
          </div>

          {/* Schedule & Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-2">🕐 Horarios</h3>
              <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.schedule}</p>
            </div>
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-2">💰 Precios</h3>
              <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.priceRange}</p>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-serif text-xl mb-4">Reseñas ({C.reviews})</h2>
            <div className="space-y-4">
              {C.reviewsList.map((r, i) => (
                <div key={i} className="bg-white border border-sand-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">{r.name[0]}</div>
                      <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-[#a09383]">{r.date}</p></div>
                    </div>
                    <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <svg key={j} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
                  </div>
                  <p className="text-sm text-[#7a6b5d]">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sticky top-24">
            <h3 className="font-serif text-lg mb-4">Información de contacto</h3>
            <div className="space-y-3">
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Dirección</span><p className="text-foreground">{C.address}</p></div>
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Teléfono</span><a href={`tel:${C.phone}`} className="text-terracotta-600 hover:underline">{C.phone}</a></div>
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Email</span><a href={`mailto:${C.email}`} className="text-terracotta-600 hover:underline">{C.email}</a></div>
              {C.website && <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Web</span><a href={C.website} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.website.replace('https://', '')}</a></div>}
              {C.instagram && <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Instagram</span><a href={`https://instagram.com/${C.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.instagram}</a></div>}
            </div>
            <a href={C.website || '#'} target="_blank" rel="noopener" className="mt-5 w-full inline-flex justify-center bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
              Visitar web del centro
            </a>
          </div>

          {/* Map placeholder */}
          <div className="bg-sand-100 border border-sand-200 rounded-2xl h-48 flex items-center justify-center text-sm text-[#a09383]">
            📍 Mapa (Google Maps)
          </div>
        </div>
      </div>
    </div>
  );
}
