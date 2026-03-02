// /en/shop/[slug] — Product detail page (EN)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo';
import { createServerSupabase } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createServerSupabase();
  const { data: p } = await supabase
    .from('shop_products')
    .select('name_en, description_en, slug, category')
    .eq('slug', params.slug)
    .single();

  if (!p) return {};

  return generatePageMetadata({
    title: p.name_en,
    description: p.description_en?.slice(0, 160) || '',
    locale: 'en',
    path: `/en/shop/${p.slug}`,
    altPath: `/es/tienda/${p.slug}`,
    ogType: 'product',
    keywords: [p.category, p.name_en].filter(Boolean),
  });
}

export default async function ProductDetailEN({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase();
  const { data: p } = await supabase
    .from('shop_products')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!p) notFound();

  const images: string[] = Array.isArray(p.images) ? p.images : [];
  const discount = p.compare_price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;

  return (
    <div className="container-wide py-12">
      <Link href="/en/shop" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          {images.length > 0 && (
            <>
              <div className="aspect-square rounded-2xl overflow-hidden bg-sand-50 mb-3">
                <img src={images[0]} alt={p.name_en} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-sand-50 cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-[#a09383] uppercase tracking-wider font-semibold">{p.category}</span>
          </div>
          <h1 className="font-serif text-[clamp(24px,3vw,32px)] text-foreground mb-3">{p.name_en}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold">{p.price.toFixed(2)}€</span>
            {p.compare_price && <>
              <span className="text-lg text-[#a09383] line-through">{p.compare_price.toFixed(2)}€</span>
              <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">-{discount}%</span>
            </>}
          </div>

          <div className="text-sm text-sage-600 mb-6">
            {p.stock_count > 0 ? `✓ In stock (${p.stock_count} available)` : '✗ Out of stock'}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-3 mb-8">
            <div className="flex items-center border border-sand-300 rounded-xl overflow-hidden">
              <button className="w-10 h-12 text-lg text-[#7a6b5d] hover:bg-sand-50 transition-colors">−</button>
              <span className="w-12 h-12 flex items-center justify-center text-sm font-semibold border-x border-sand-300">1</span>
              <button className="w-10 h-12 text-lg text-[#7a6b5d] hover:bg-sand-50 transition-colors">+</button>
            </div>
            <button className="flex-1 bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors shadow-[0_2px_8px_rgba(200,90,48,0.3)]">🛒 Add to cart</button>
          </div>

          <div className="flex gap-4 text-xs text-[#7a6b5d] mb-8">
            <span>🚚 Free shipping over 50€</span>
            <span>↩️ 30-day returns</span>
            <span>🔒 Secure payment (Stripe)</span>
          </div>

          {/* Description */}
          {p.description_en && (
            <div className="mb-6">
              <h2 className="font-serif text-xl mb-3">Description</h2>
              <div className="text-sm text-[#7a6b5d] leading-[1.8] whitespace-pre-line">{p.description_en}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
