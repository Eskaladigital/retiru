// /en/center/[slug] — Center detail page (EN)
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Yoga Sala Madrid — Yoga center in Madrid',
    description: 'Yoga studio in central Madrid with internationally certified teachers. Hatha, Vinyasa, Ashtanga, Meditation.',
    locale: 'en',
    path: `/en/center/${params.slug}`,
    altPath: `/es/centro/${params.slug}`,
    keywords: ['yoga center madrid', 'yoga classes madrid'],
  });
}

const C = {
  slug: 'yoga-sala-madrid', name: 'Yoga Sala Madrid', type: 'Yoga', plan: 'featured' as const,
  description: 'Yoga Sala Madrid is a yoga studio located in the heart of Madrid, in the Malasaña neighborhood. We have a team of internationally certified teachers in different yoga styles. Our bright, welcoming space is designed so you can disconnect from the city noise and connect with yourself.\n\nWe offer classes for all levels, from absolute beginners to advanced practitioners. We also organize workshops, retreats and Yoga Alliance certified teacher trainings.',
  city: 'Madrid', province: 'Madrid', address: 'Calle San Vicente Ferrer 42, 28004 Madrid',
  phone: '+34 910 123 456', email: 'info@yogasala.es', website: 'https://yogasala.es', instagram: '@yogasalamadrid',
  rating: 4.9, reviews: 87,
  services: ['Hatha Yoga', 'Vinyasa Flow', 'Ashtanga', 'Yin Yoga', 'Restorative Yoga', 'Meditation', 'Pranayama', 'Special workshops'],
  schedule: 'Monday to Friday 7:00–21:00 · Saturdays 9:00–14:00 · Sundays closed',
  priceRange: 'Drop-in 14€ · 5-class pass 60€ · 10-class pass 110€ · Unlimited 89€/month',
  images: [
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  ],
  reviewsList: [
    { name: 'Ana R.', rating: 5, date: 'Feb 2026', text: 'The best yoga studio in Madrid. Teachers are incredible and the space is beautiful.' },
    { name: 'Miguel P.', rating: 5, date: 'Jan 2026', text: 'Been coming for 2 years and still love it. Laura\'s Ashtanga classes are spectacular.' },
    { name: 'Sara K.', rating: 4, date: 'Dec 2025', text: 'Great studio! Very welcoming atmosphere and excellent teachers.' },
  ],
};

export default function CenterDetailEN({ params }: { params: { slug: string } }) {
  return (
    <div className="container-wide py-12">
      <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">← Centers directory</Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
        <div className="md:col-span-2 aspect-[16/10]"><img src={C.images[0]} alt={C.name} className="w-full h-full object-cover" /></div>
        <div className="hidden md:flex flex-col gap-3">{C.images.slice(1, 3).map((img, i) => <div key={i} className="flex-1"><img src={img} alt="" className="w-full h-full object-cover" /></div>)}</div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="font-serif text-[clamp(24px,3vw,36px)] text-foreground">{C.name}</h1>
            {C.plan === 'featured' && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full mt-2 shrink-0">⭐ Featured</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#7a6b5d] mb-6">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">{C.type}</span>
            <span>📍 {C.city}, {C.province}</span>
            <span>⭐ <span className="font-semibold text-foreground">{C.rating}</span> ({C.reviews} reviews)</span>
          </div>

          <div className="mb-8"><h2 className="font-serif text-xl mb-3">About</h2><div className="text-[15px] text-[#7a6b5d] leading-[1.8] whitespace-pre-line">{C.description}</div></div>

          <div className="mb-8"><h2 className="font-serif text-xl mb-3">Services & disciplines</h2><div className="flex flex-wrap gap-2">{C.services.map(s => <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-foreground">{s}</span>)}</div></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-5"><h3 className="font-semibold text-sm mb-2">🕐 Schedule</h3><p className="text-sm text-[#7a6b5d]">{C.schedule}</p></div>
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-5"><h3 className="font-semibold text-sm mb-2">💰 Prices</h3><p className="text-sm text-[#7a6b5d]">{C.priceRange}</p></div>
          </div>

          <div><h2 className="font-serif text-xl mb-4">Reviews ({C.reviews})</h2><div className="space-y-4">{C.reviewsList.map((r, i) => (
            <div key={i} className="bg-white border border-sand-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">{r.name[0]}</div><div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-[#a09383]">{r.date}</p></div></div>
                <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <svg key={j} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              </div>
              <p className="text-sm text-[#7a6b5d]">{r.text}</p>
            </div>
          ))}</div></div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sticky top-24">
            <h3 className="font-serif text-lg mb-4">Contact information</h3>
            <div className="space-y-3">
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Address</span><p>{C.address}</p></div>
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Phone</span><a href={`tel:${C.phone}`} className="text-terracotta-600 hover:underline">{C.phone}</a></div>
              <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Email</span><a href={`mailto:${C.email}`} className="text-terracotta-600 hover:underline">{C.email}</a></div>
              {C.website && <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Web</span><a href={C.website} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.website.replace('https://', '')}</a></div>}
              {C.instagram && <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Instagram</span><a href={`https://instagram.com/${C.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.instagram}</a></div>}
            </div>
            <a href={C.website || '#'} target="_blank" rel="noopener" className="mt-5 w-full inline-flex justify-center bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">Visit center website</a>
          </div>
          <div className="bg-sand-100 border border-sand-200 rounded-2xl h-48 flex items-center justify-center text-sm text-[#a09383]">📍 Map (Google Maps)</div>
        </div>
      </div>
    </div>
  );
}
