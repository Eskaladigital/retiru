// /es/tienda — Tienda online de productos wellness
import type { Metadata } from 'next';
import Link from 'next/link';
import { shopES } from '@/lib/seo/page-metadata';

export const metadata: Metadata = shopES;

const CATEGORIES = [
  { slug: 'yoga', name: 'Yoga', icon: '🧘' },
  { slug: 'meditacion', name: 'Meditación', icon: '🧠' },
  { slug: 'nutricion', name: 'Nutrición', icon: '🥤' },
  { slug: 'ropa', name: 'Ropa & Accesorios', icon: '👕' },
  { slug: 'bienestar', name: 'Bienestar', icon: '🌿' },
];

const PRODUCTS = [
  { slug: 'esterilla-yoga-pro', name: 'Esterilla de Yoga Pro 6mm', price: 49.90, comparePrice: 69.90, category: 'Yoga', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80', featured: true, rating: 4.8, reviews: 34, badge: 'Bestseller' },
  { slug: 'extractor-zumos-cold-press', name: 'Extractor de Zumos Cold Press', price: 129.00, comparePrice: null, category: 'Nutrición', img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&q=80', featured: true, rating: 4.7, reviews: 21, badge: 'Nuevo' },
  { slug: 'cojin-meditacion-zafu', name: 'Cojín de Meditación Zafu', price: 34.90, comparePrice: null, category: 'Meditación', img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=500&q=80', featured: false, rating: 4.9, reviews: 56, badge: null },
  { slug: 'chandal-algodon-organico', name: 'Chándal Algodón Orgánico', price: 79.90, comparePrice: 99.90, category: 'Ropa', img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=500&q=80', featured: true, rating: 4.6, reviews: 18, badge: '-20%' },
  { slug: 'difusor-aceites-esenciales', name: 'Difusor de Aceites Esenciales', price: 29.90, comparePrice: null, category: 'Bienestar', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80', featured: false, rating: 4.5, reviews: 42, badge: null },
  { slug: 'bloques-yoga-corcho', name: 'Bloques de Yoga en Corcho (x2)', price: 24.90, comparePrice: 32.00, category: 'Yoga', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80', featured: false, rating: 4.7, reviews: 29, badge: null },
  { slug: 'botella-agua-termica', name: 'Botella Térmica Bambú 500ml', price: 19.90, comparePrice: null, category: 'Bienestar', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', featured: false, rating: 4.4, reviews: 15, badge: null },
  { slug: 'set-aceites-esenciales', name: 'Set de 6 Aceites Esenciales', price: 39.90, comparePrice: 49.90, category: 'Bienestar', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80', featured: true, rating: 4.8, reviews: 67, badge: 'Popular' },
];

export default function TiendaPage() {
  return (
    <div className="container-wide py-12">
      <div className="mb-10">
        <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Tienda <span className="text-terracotta-600">wellness</span></h1>
        <p className="text-[#7a6b5d] max-w-xl">Productos seleccionados para acompañarte en tu práctica, tu bienestar y tu día a día</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {PRODUCTS.map(p => (
          <Link key={p.slug} href={`/es/tienda/${p.slug}`} className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-square overflow-hidden bg-sand-50">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {p.badge && (
                <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  p.badge === 'Bestseller' ? 'bg-terracotta-600 text-white' :
                  p.badge === 'Nuevo' ? 'bg-sage-600 text-white' :
                  p.badge === 'Popular' ? 'bg-amber-400 text-amber-900' :
                  'bg-red-500 text-white'
                }`}>{p.badge}</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[11px] text-[#a09383] uppercase tracking-wider font-semibold mb-1">{p.category}</p>
              <h3 className="text-sm font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">{p.name}</h3>
              <div className="flex items-center gap-1 mb-2">
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="text-xs font-semibold">{p.rating}</span>
                <span className="text-xs text-[#a09383]">({p.reviews})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{p.price.toFixed(2).replace('.', ',')}€</span>
                {p.comparePrice && <span className="text-sm text-[#a09383] line-through">{p.comparePrice.toFixed(2).replace('.', ',')}€</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
