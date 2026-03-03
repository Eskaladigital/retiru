// /es/centro/[slug] — Ficha individual del centro
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo';
import { getCenterBySlug, getCenterSlugs } from '@/lib/data';
import { MarkdownContent } from '@/components/ui/markdown-content';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getCenterSlugs();
  return slugs.map((slug) => ({ slug })).filter((p) => p.slug && p.slug.length > 0);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const center = await getCenterBySlug(slug);
  if (!center) {
    return generatePageMetadata({
      title: 'Centro no encontrado',
      description: '',
      locale: 'es',
      path: `/es/centro/${slug}`,
    });
  }
  return generatePageMetadata({
    title: `${center.name} — ${center.type ? `Centro de ${center.type}` : 'Centro'} en ${center.city || ''}`,
    description: center.description_es?.slice(0, 160) || `${center.name}: centro de bienestar en ${center.city}, ${center.province}.`,
    locale: 'es',
    path: `/es/centro/${slug}`,
    altPath: `/en/center/${slug}`,
    ogType: 'website',
    keywords: [center.name, center.type, center.city, center.province].filter(Boolean) as string[],
  });
}

export default async function CentroDetailPage({ params }: Props) {
  const { slug } = await params;
  const C = await getCenterBySlug(slug);
  if (!C) notFound();

  const services: string[] = Array.isArray(C.services_es) ? C.services_es : [];
  const images: string[] = Array.isArray(C.images) ? C.images : [];
  const mainImage = C.cover_url || images[0] || '';
  const galleryImages = C.cover_url ? images : images.slice(1);

  return (
    <div className="container-wide py-12">
      <Link href="/es/centros-retiru" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Directorio de centros
      </Link>

      {/* Image gallery */}
      {mainImage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
          <div className="md:col-span-2 aspect-[16/10]">
            <img src={mainImage} alt={C.name} className="w-full h-full object-cover" />
          </div>
          {galleryImages.length > 0 && (
            <div className="hidden md:flex flex-col gap-3">
              {galleryImages.slice(0, 2).map((img: string, i: number) => (
                <div key={i} className="flex-1"><img src={img} alt="" className="w-full h-full object-cover" /></div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="font-serif text-[clamp(24px,3vw,36px)] text-foreground">{C.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#7a6b5d] mb-6">
            {C.type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">{C.type}</span>}
            {(C.city || C.province) && <span>📍 {C.city}{C.province ? `, ${C.province}` : ''}</span>}
            {C.avg_rating != null && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="font-semibold text-foreground">{C.avg_rating}</span> ({C.review_count ?? 0} reseñas)
              </span>
            )}
          </div>

          {/* Description */}
          {C.description_es && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">Sobre el centro</h2>
              <MarkdownContent content={C.description_es} />
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">Servicios y disciplinas</h2>
              <div className="flex flex-wrap gap-2">
                {services.map((s: string) => (
                  <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-foreground">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule & Prices */}
          {(C.schedule_summary_es || C.price_range_es) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {C.schedule_summary_es && (
                <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">🕐 Horarios</h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.schedule_summary_es}</p>
                </div>
              )}
              {C.price_range_es && (
                <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">💰 Precios</h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.price_range_es}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sticky top-24">
            <h3 className="font-serif text-lg mb-4">Información de contacto</h3>
            <div className="space-y-3">
              {C.address && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Dirección</span><p className="text-foreground">{C.address}</p></div>
              )}
              {C.phone && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Teléfono</span><a href={`tel:${C.phone}`} className="text-terracotta-600 hover:underline">{C.phone}</a></div>
              )}
              {C.email && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Email</span><a href={`mailto:${C.email}`} className="text-terracotta-600 hover:underline">{C.email}</a></div>
              )}
              {C.website && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Web</span><a href={C.website} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.website.replace('https://', '').replace('http://', '')}</a></div>
              )}
              {C.instagram && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Instagram</span><a href={`https://instagram.com/${C.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{C.instagram}</a></div>
              )}
            </div>
            {C.website && (
              <a href={C.website} target="_blank" rel="noopener" className="mt-5 w-full inline-flex justify-center bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
                Visitar web del centro
              </a>
            )}
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
