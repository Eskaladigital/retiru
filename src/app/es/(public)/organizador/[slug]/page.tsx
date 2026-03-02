// /es/organizador/[slug] — Perfil público del organizador
import Link from 'next/link';

const ORG = {
  name: 'Ibiza Yoga Retreats', slug: 'ibiza-yoga-retreats', verified: true,
  bio: 'Organizamos retiros de yoga y meditación en las mejores villas de Ibiza desde 2018. Nuestro equipo de instructores certificados crea experiencias transformadoras para todos los niveles.',
  rating: 4.8, reviews: 124, events: 12, location: 'Ibiza, Baleares',
  languages: ['Español', 'Inglés'],
  eventsList: [
    { slug: 'retiro-yoga-ibiza', title: 'Retiro de Yoga y Meditación frente al mar', price: 790, dates: '15–20 Jun 2026', rating: 4.9, reviews: 23, img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80' },
    { slug: 'wellness-ibiza-spa', title: 'Wellness & Spa Retreat en Ibiza', price: 1100, dates: '1–7 Jul 2026', rating: 4.8, reviews: 18, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  ],
  reviewsList: [
    { name: 'Laura M.', date: 'May 2025', rating: 5, text: 'Una experiencia increíble. Los instructores son maravillosos.' },
    { name: 'Javier P.', date: 'Abr 2025', rating: 5, text: 'Superó todas mis expectativas. Volveré seguro.' },
  ],
};

export default function OrganizadorPage({ params }: { params: { slug: string } }) {
  const o = ORG;
  return (
    <div className="container-wide py-12">
      {/* Header organizador */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
        <div className="w-24 h-24 bg-sage-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-sage-700 font-serif shrink-0">
          {o.name[0]}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-3xl text-foreground">{o.name}</h1>
            {o.verified && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">✓ Verificado</span>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#7a6b5d] mb-4">
            <span>📍 {o.location}</span>
            <span>⭐ {o.rating} ({o.reviews} reseñas)</span>
            <span>📅 {o.events} retiros publicados</span>
            <span>🌐 {o.languages.join(', ')}</span>
          </div>
          <p className="text-[15px] text-[#7a6b5d] leading-[1.7] max-w-2xl">{o.bio}</p>
        </div>
      </div>

      {/* Retiros del organizador */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-6">Retiros de {o.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {o.eventsList.map((e) => (
            <Link key={e.slug} href={`/es/retiro/${e.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg leading-[1.3] mb-2">{e.title}</h3>
                <p className="text-sm text-[#7a6b5d] mb-3">📅 {e.dates} · ⭐ {e.rating} ({e.reviews})</p>
                <div className="pt-3 border-t border-sand-200">
                  <span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span>
                  <span className="ml-2 text-xl font-bold">{e.price}€</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Reseñas */}
      <section>
        <h2 className="font-serif text-2xl mb-6">Reseñas</h2>
        <div className="space-y-4">
          {o.reviewsList.map((r, i) => (
            <div key={i} className="bg-white border border-sand-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">{r.name[0]}</div>
                  <div><p className="font-semibold text-sm">{r.name}</p><p className="text-xs text-[#a09383]">{r.date}</p></div>
                </div>
                <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <svg key={j} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              </div>
              <p className="text-sm text-[#7a6b5d] leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
