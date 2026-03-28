// /es/tienda — Tienda (yoga, meditación, ayurveda)
import type { Metadata } from 'next';
import Link from 'next/link';
import { shopES } from '@/lib/seo/page-metadata';
import { createServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = shopES;

const CATEGORIES = [
  { slug: 'yoga', name: 'Yoga', icon: '🧘' },
  { slug: 'meditacion', name: 'Meditación', icon: '🧠' },
  { slug: 'ayurveda', name: 'Ayurveda', icon: '🌿' },
];

export default async function TiendaPage() {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from('shop_products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container-wide py-12">
      <div className="mb-10">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Tienda <span className="text-terracotta-600">Retiru</span></h1>
        <p className="text-[#7a6b5d] max-w-xl">Productos para tu práctica de yoga, meditación y ayurveda</p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button className="px-4 py-2 rounded-full text-sm font-medium bg-terracotta-600 text-white border border-terracotta-600">Todos</button>
        {CATEGORIES.map(c => (
          <button key={c.slug} className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 transition-colors">
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Featured banner */}
      <div className="bg-gradient-to-r from-terracotta-50 to-sand-100 border border-terracotta-200 rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-terracotta-600">Envío gratis a partir de 50€</span>
          <h2 className="font-serif text-2xl mt-2">Equipamiento esencial para tu práctica</h2>
          <p className="text-sm text-[#7a6b5d] mt-2">Esterillas, cojines, bloques y todo lo que necesitas. Calidad premium a precios justos.</p>
        </div>
        <div className="text-6xl">🧘‍♀️</div>
      </div>

      {/* Products grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((p: any) => {
            const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
            return (
              <Link key={p.id} href={`/es/tienda/${p.slug}`} className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all">
                <div className="relative aspect-square overflow-hidden bg-sand-50">
                  {img && <img src={img} alt={p.name_es} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500 text-white">
                      -{Math.round((1 - p.price / p.compare_price) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-[#a09383] uppercase tracking-wider font-semibold mb-1">{p.category}</p>
                  <h3 className="text-sm font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{p.name_es}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{p.price.toFixed(2).replace('.', ',')}€</span>
                    {p.compare_price && <span className="text-sm text-[#a09383] line-through">{p.compare_price.toFixed(2).replace('.', ',')}€</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-[#7a6b5d]">No hay productos disponibles en este momento.</p>
          <p className="text-sm text-[#a09383] mt-2">Vuelve pronto, estamos preparando novedades.</p>
        </div>
      )}
    </div>
  );
}
