// /es/destinos/[slug] — Retiros en un destino (Supabase)
import Link from 'next/link';
import type { Metadata } from 'next';
import { Flame, Zap } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getDestinationBySlug, getDestinationSlugs, getPublishedRetreats } from '@/lib/data';
import { generatePageMetadata } from '@/lib/seo';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

export async function generateStaticParams() {
  const slugs = await getDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  
  if (!destination) {
    return generatePageMetadata({
      title: 'Destino no encontrado',
      description: '',
      locale: 'es',
      path: `/es/destinos/${slug}`,
    });
  }

  return generatePageMetadata({
    title: `Retiros de yoga y meditación en ${destination.name_es} | Retiru`,
    description: `Descubre los mejores retiros y escapadas de bienestar en ${destination.name_es}. Compara fechas, precios y reserva con confirmación inmediata.`,
    locale: 'es',
    path: `/es/destinos/${slug}`,
    altPath: `/en/destinations/${slug}`,
    keywords: ['retiros', destination.name_es, 'yoga', 'meditación', 'españa'],
  });
}

function formatDates(start: string, end: string, days: number): string {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${d1.toLocaleDateString('es-ES', opts)} – ${d2.toLocaleDateString('es-ES', opts)} · ${days} días`;
}

export default async function DestinoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [destination, { retreats }] = await Promise.all([
    getDestinationBySlug(slug),
    getPublishedRetreats({ destinationSlug: slug, limit: 24 }),
  ]);

  if (!destination) notFound();

  const name = destination.name_es;

  return (
    <div className="container-wide py-12">
      <Link href="/es/destinos" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Todos los destinos
      </Link>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Retiros en {name}</h1>
      <p className="text-[#7a6b5d] mb-10">{retreats.length} retiros disponibles</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {retreats.map((r) => {
          const img = r.images?.find((i) => i.is_cover)?.url || r.images?.[0]?.url || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80';
          const category = r.categories?.[0]?.name_es || 'Retiro';
          const dates = formatDates(r.start_date, r.end_date, r.duration_days);
          const spotsLow = r.available_spots <= 5;
          const instant = r.confirmation_type === 'automatic';
          return (
            <Link key={r.id} href={`/es/retiro/${r.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-sand-200 transition-all duration-[350ms] hover:shadow-elevated hover:-translate-y-1">
              <div className="relative aspect-[16/10] overflow-hidden">
                <ImageWithFallback src={img} alt={r.title_es} className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">{category}</span>
                  {instant && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgba(92,127,96,0.9)] text-white inline-flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                      Inmediata
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl leading-[1.3] mb-2 line-clamp-2">{r.title_es}</h3>
                <div className="text-sm text-[#7a6b5d] mb-4 flex items-center gap-1.5">
                  <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {dates}
                </div>
                <div className="flex items-end justify-between pt-4 border-t border-sand-200">
                  <div><span className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Desde</span><br/><span className="text-2xl font-bold">{r.total_price}€</span> <span className="text-sm text-[#7a6b5d]">/persona</span></div>
                  <span className={`text-[13px] font-medium inline-flex items-center gap-1 ${spotsLow ? 'text-terracotta-600' : 'text-sage-600'}`}>
                    {spotsLow && <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                    {r.available_spots} plazas
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
