import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { blogES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = blogES;

const CATEGORIES = [
  { slug: 'yoga', name: 'Yoga' },
  { slug: 'meditacion', name: 'Meditación' },
  { slug: 'bienestar', name: 'Bienestar' },
  { slug: 'nutricion', name: 'Nutrición' },
  { slug: 'destinos', name: 'Destinos' },
  { slug: 'organizadores', name: 'Para organizadores' },
];

const FEATURED = {
  slug: 'guia-completa-primer-retiro-yoga',
  title: 'Guía completa: cómo elegir tu primer retiro de yoga en España',
  excerpt: 'Todo lo que necesitas saber antes de reservar tu primera experiencia de yoga inmersivo: qué esperar, cómo prepararte, qué preguntar al organizador y los mejores destinos para principiantes.',
  category: 'Yoga',
  date: '24 Feb 2026',
  readTime: '12 min',
  author: { name: 'Equipo Retiru', initials: 'ER' },
  img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
};

const ARTICLES = [
  {
    slug: '10-destinos-retiros-espana-2026',
    title: 'Los 10 mejores destinos para retiros en España en 2026',
    excerpt: 'De Ibiza a Sierra Nevada, pasando por el Priorat y la Costa Brava: los destinos más demandados para desconectar este año.',
    category: 'Destinos',
    date: '18 Feb 2026',
    readTime: '8 min',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  },
  {
    slug: 'beneficios-retiro-detox-ayuno',
    title: 'Beneficios de un retiro detox: qué dice la ciencia sobre el ayuno intermitente',
    excerpt: 'Analizamos la evidencia científica detrás de los retiros de detox y ayuno, y cómo pueden mejorar tu salud física y mental.',
    category: 'Bienestar',
    date: '12 Feb 2026',
    readTime: '10 min',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  },
  {
    slug: 'meditacion-guiada-principiantes',
    title: 'Meditación guiada para principiantes: 5 técnicas que funcionan',
    excerpt: 'No necesitas experiencia previa. Estas cinco técnicas de meditación están diseñadas para quienes nunca han meditado.',
    category: 'Meditación',
    date: '5 Feb 2026',
    readTime: '7 min',
    img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80',
  },
  {
    slug: 'como-publicar-retiro-gratis-retiru',
    title: 'Cómo publicar tu retiro gratis en Retiru: guía paso a paso',
    excerpt: 'Eres organizador y quieres llegar a más personas. Te explicamos cómo crear tu perfil, publicar tu primer retiro y gestionar reservas sin pagar comisión.',
    category: 'Para organizadores',
    date: '28 Ene 2026',
    readTime: '6 min',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
  },
  {
    slug: 'alimentacion-consciente-retiros-gastronomicos',
    title: 'Alimentación consciente: qué esperar de un retiro gastronómico',
    excerpt: 'Los retiros gastronómicos van mucho más allá de comer bien. Descubre cómo la alimentación consciente puede transformar tu relación con la comida.',
    category: 'Nutrición',
    date: '20 Ene 2026',
    readTime: '9 min',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  },
  {
    slug: 'yoga-aéreo-tendencia-2026',
    title: 'Yoga aéreo: la tendencia que está revolucionando los retiros en 2026',
    excerpt: 'Cada vez más retiros incorporan el yoga aéreo en sus programas. Te contamos por qué y dónde encontrar los mejores en España.',
    category: 'Yoga',
    date: '14 Ene 2026',
    readTime: '5 min',
    img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80',
  },
];

export default function BlogPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream-100 to-white">
        <div className="container-wide py-14 md:py-18 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600 mb-3">Blog</span>
          <h1 className="font-serif text-[clamp(32px,5vw,52px)] text-foreground leading-[1.15] mb-3">
            Inspiración y bienestar
          </h1>
          <p className="text-[#7a6b5d] text-lg max-w-xl mx-auto leading-relaxed">
            Guías, consejos y destinos para que cada retiro sea una experiencia transformadora.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <div className="container-wide -mt-2 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link href="/es/blog" className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-terracotta-600 text-white">
            Todos
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/es/blog?categoria=${c.slug}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured article */}
      <section className="container-wide mb-12">
        <Link href={`/es/blog/${FEATURED.slug}`} className="group grid md:grid-cols-2 gap-0 bg-white rounded-3xl border border-sand-200 overflow-hidden hover:shadow-elevated transition-all duration-300">
          <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
            <img
              src={FEATURED.img}
              alt={FEATURED.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700">{FEATURED.category}</span>
              <span className="text-xs text-[#a09383] flex items-center gap-1"><Clock size={12} /> {FEATURED.readTime}</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-[1.25] mb-3 group-hover:text-terracotta-600 transition-colors">
              {FEATURED.title}
            </h2>
            <p className="text-[15px] text-[#7a6b5d] leading-relaxed mb-5 line-clamp-3">
              {FEATURED.excerpt}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">{FEATURED.author.initials}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{FEATURED.author.name}</p>
                  <p className="text-xs text-[#a09383]">{FEATURED.date}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-terracotta-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Leer artículo <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Articles grid */}
      <section className="container-wide mb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/es/blog/${article.slug}`}
              className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sand-200 text-[#7a6b5d]">{article.category}</span>
                  <span className="text-[11px] text-[#a09383] flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                </div>
                <h3 className="font-serif text-lg leading-[1.3] mb-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-[#7a6b5d] leading-relaxed line-clamp-2 mb-3">
                  {article.excerpt}
                </p>
                <p className="text-xs text-[#a09383]">{article.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-sand-100">
        <div className="container-wide py-14">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl mb-3">No te pierdas nada</h2>
            <p className="text-[#7a6b5d] mb-6">Recibe cada semana los mejores artículos sobre bienestar, retiros y destinos directamente en tu email.</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
              />
              <button type="submit" className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors whitespace-nowrap">
                Suscribirme
              </button>
            </form>
            <p className="text-xs text-[#a09383] mt-3">Sin spam. Puedes darte de baja cuando quieras.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
