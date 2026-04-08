// /en/shop — Shop (yoga, meditation, ayurveda)
import type { Metadata } from 'next';
import Link from 'next/link';
import { shopEN } from '@/lib/seo/page-metadata';
import { createServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = shopEN;

const CATEGORIES = [
  { slug: 'yoga', name: 'Yoga' },
  { slug: 'meditation', name: 'Meditation' },
  { slug: 'ayurveda', name: 'Ayurveda' },
];

export default async function ShopPageEN() {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from('shop_products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container-wide py-12">
      <div className="mb-10">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Retiru <span className="text-terracotta-600">Shop</span></h1>
        <p className="text-[#7a6b5d] max-w-xl">Products for your yoga, meditation and ayurveda practice</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button className="px-4 py-2 rounded-full text-sm font-medium bg-terracotta-600 text-white border border-terracotta-600">All</button>
        {CATEGORIES.map(c => (
          <button key={c.slug} className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 transition-colors">
            {c.name}
          </button>
        ))}
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((p: any) => {
            const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
            return (
              <Link key={p.id} href={`/en/shop/${p.slug}`} className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all">
                <div className="relative aspect-square overflow-hidden bg-sand-50">
                  {img && <img src={img} alt={p.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500 text-white">
                      -{Math.round((1 - p.price / p.compare_price) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-[#a09383] uppercase tracking-wider font-semibold mb-1">{p.category}</p>
                  <h3 className="text-sm font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{p.name_en}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{p.price.toFixed(2)}€</span>
                    {p.compare_price && <span className="text-sm text-[#a09383] line-through">{p.compare_price.toFixed(2)}€</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <section className="py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-terracotta-600 mb-4">Retiru Shop</span>
            <h2 className="font-serif text-[clamp(26px,3.5vw,38px)] text-foreground leading-tight mb-5">Coming soon</h2>
            <div className="w-12 h-px bg-terracotta-300 mx-auto mb-6" />
            <p className="text-[#7a6b5d] text-base md:text-lg leading-relaxed mb-4">
              We&apos;re curating a selection of products for your practice: mats, cushions, blocks,
              oils and everything you need to take your wellbeing to the next level.
            </p>
            <p className="text-[#a09383] text-sm leading-relaxed mb-10">
              Premium quality, fair prices and free shipping on orders over 50€. Very soon right here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/en/retreats"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors"
              >
                Explore retreats
              </Link>
              <Link
                href="/en/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
