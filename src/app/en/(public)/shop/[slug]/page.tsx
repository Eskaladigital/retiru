// /en/shop/[slug] — Product detail page (EN)
import type { Metadata } from 'next';
import Link from 'next/link';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Pro Yoga Mat 6mm',
    description: 'Premium 6mm eco-friendly TPE yoga mat, non-slip, with alignment lines. Includes carry strap.',
    locale: 'en',
    path: `/en/shop/${params.slug}`,
    altPath: `/es/tienda/${params.slug}`,
    ogType: 'product',
    keywords: ['yoga mat', 'pro yoga mat', 'TPE mat', 'eco yoga mat'],
  });
}

const P = {
  slug: 'pro-yoga-mat', name: 'Pro Yoga Mat 6mm', price: 49.90, comparePrice: 69.90,
  category: 'Yoga', badge: 'Bestseller', rating: 4.8, reviews: 34, stock: 23, sku: 'RET-YOG-001',
  description: 'Our premium 6mm yoga mat offers the perfect combination of cushioning and stability. Made from eco-friendly TPE, non-slip on both sides, with engraved alignment lines. Ideal for Hatha, Vinyasa and any yoga style.\n\nDimensions: 183 x 66 cm · Weight: 1.2 kg · Material: Eco-friendly TPE · Includes: carry strap.',
  features: ['6mm extra comfort thickness', 'Eco-friendly TPE, PVC-free', 'Non-slip on both sides', 'Engraved alignment lines', 'Carry strap included', 'Colors: Terracotta, Sage, Sand'],
  images: [
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
  ],
  reviewsList: [
    { name: 'Laura M.', rating: 5, date: 'Feb 2026', text: 'Incredible quality. Very comfortable and doesn\'t slip at all.' },
    { name: 'Carlos R.', rating: 5, date: 'Jan 2026', text: 'Much better than my previous mat. Thickness is perfect.' },
    { name: 'Ana S.', rating: 4, date: 'Dec 2025', text: 'Great value for money. The terracotta color is gorgeous.' },
  ],
};

export default function ProductDetailEN({ params }: { params: { slug: string } }) {
  const discount = P.comparePrice ? Math.round((1 - P.price / P.comparePrice) * 100) : 0;
  return (
    <div className="container-wide py-12">
      <Link href="/en/shop" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-sand-50 mb-3"><img src={P.images[0]} alt={P.name} className="w-full h-full object-cover" /></div>
          <div className="grid grid-cols-3 gap-3">{P.images.map((img, i) => <div key={i} className="aspect-square rounded-xl overflow-hidden bg-sand-50 cursor-pointer hover:opacity-80 transition-opacity"><img src={img} alt="" className="w-full h-full object-cover" /></div>)}</div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-[#a09383] uppercase tracking-wider font-semibold">{P.category}</span>
            {P.badge && <span className="text-[10px] font-bold uppercase tracking-wider bg-terracotta-600 text-white px-2 py-0.5 rounded-full">{P.badge}</span>}
          </div>
          <h1 className="font-serif text-[clamp(24px,3vw,32px)] text-foreground mb-3">{P.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <svg key={i} className={`w-4 h-4 ${i < Math.floor(P.rating) ? 'text-amber-400' : 'text-sand-300'}`} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
            <span className="text-sm font-semibold">{P.rating}</span>
            <span className="text-sm text-[#a09383]">({P.reviews} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold">{P.price.toFixed(2)}€</span>
            {P.comparePrice && <><span className="text-lg text-[#a09383] line-through">{P.comparePrice.toFixed(2)}€</span><span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">-{discount}%</span></>}
          </div>

          <div className="text-sm text-sage-600 mb-6">{P.stock > 0 ? `✓ In stock (${P.stock} available)` : '✗ Out of stock'}</div>

          <div className="flex gap-3 mb-8">
            <div className="flex items-center border border-sand-300 rounded-xl overflow-hidden">
              <button className="w-10 h-12 text-lg text-[#7a6b5d] hover:bg-sand-50 transition-colors">−</button>
              <span className="w-12 h-12 flex items-center justify-center text-sm font-semibold border-x border-sand-300">1</span>
              <button className="w-10 h-12 text-lg text-[#7a6b5d] hover:bg-sand-50 transition-colors">+</button>
            </div>
            <button className="flex-1 bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)]">🛒 Add to cart</button>
          </div>

          <div className="flex gap-4 text-xs text-[#7a6b5d] mb-8">
            <span>🚚 Free shipping over 50€</span><span>↩️ 30-day returns</span><span>🔒 Secure payment (Stripe)</span>
          </div>

          <div className="mb-6"><h2 className="font-serif text-xl mb-3">Description</h2><div className="text-sm text-[#7a6b5d] leading-[1.8] whitespace-pre-line">{P.description}</div></div>

          <div className="mb-6"><h2 className="font-serif text-xl mb-3">Features</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{P.features.map((f, i) => <div key={i} className="flex items-start gap-2 text-sm text-[#7a6b5d]"><span className="text-sage-600 mt-0.5">✓</span> {f}</div>)}</div></div>
        </div>
      </div>

      <div className="mt-12"><h2 className="font-serif text-2xl mb-6">Reviews ({P.reviews})</h2><div className="grid gap-4 md:grid-cols-3">{P.reviewsList.map((r, i) => (
        <div key={i} className="bg-white border border-sand-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">{r.name[0]}</div><div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-[#a09383]">{r.date}</p></div></div><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <svg key={j} className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div></div>
          <p className="text-sm text-[#7a6b5d]">{r.text}</p>
        </div>
      ))}</div></div>
    </div>
  );
}
