// /en/center/[slug] — Center detail page (EN)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { CenterMap } from '@/components/ui/center-map';
import { ClaimCenterButton } from '@/components/ui/claim-center-button';
import { generatePageMetadata } from '@/lib/seo';
import { getCenterBySlug, getCenterSlugs } from '@/lib/data';
import { getCenterTypeLabel } from '@/lib/utils';

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
      title: 'Center not found',
      description: '',
      locale: 'en',
      path: `/en/center/${slug}`,
    });
  }
  return generatePageMetadata({
    title: `${center.name} — ${center.type ? `${getCenterTypeLabel(center.type, 'en')} center` : 'Center'} in ${center.city || ''}`,
    description:
      center.description_en?.slice(0, 160) ||
      `${center.name} — yoga, meditation or ayurveda center${center.city ? ` in ${center.city}` : ''}${center.province ? `, ${center.province}` : ''}.`,
    locale: 'en',
    path: `/en/center/${slug}`,
    altPath: `/es/centro/${slug}`,
    ogType: 'website',
    keywords: [center.name, center.type, center.city, center.province].filter(Boolean) as string[],
  });
}

export default async function CenterDetailEN({ params }: Props) {
  const { slug } = await params;
  const C = await getCenterBySlug(slug);
  if (!C) notFound();

  const services: string[] = Array.isArray(C.services_en) ? C.services_en : [];
  const images: string[] = Array.isArray(C.images) ? C.images : [];
  const mainImage = C.cover_url || images[0] || '';
  const galleryImages = C.cover_url ? images : images.slice(1);

  return (
    <div className="container-wide py-12">
      <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Centers directory
      </Link>

      {mainImage && (
        <div className="mb-8 space-y-3">
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden">
            <img src={mainImage} alt={C.name} className="w-full h-full object-cover" />
          </div>
          {galleryImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.slice(0, 4).map((img: string, i: number) => (
                <div key={i} className="w-32 h-24 rounded-xl overflow-hidden shrink-0">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
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
            {C.type && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage-100 text-sage-700">{getCenterTypeLabel(C.type, 'en')}</span>}
            {(C.city || C.province) && <span>📍 {C.city}{C.province ? `, ${C.province}` : ''}</span>}
            {C.avg_rating != null && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="font-semibold text-foreground">{C.avg_rating}</span> ({C.review_count ?? 0} reviews)
              </span>
            )}
          </div>

          {/* Description */}
          {(C.description_en || C.description_es) && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">About</h2>
              {C.description_en ? (
                <MarkdownContent content={C.description_en} />
              ) : (
                <div className="rounded-xl border border-sand-200 bg-sand-50/80 p-5 text-sm text-[#7a6b5d] leading-relaxed">
                  <p className="mb-3">We are adding an English description for this center.</p>
                  <Link href={`/es/centro/${slug}`} className="font-semibold text-terracotta-600 hover:text-terracotta-700">
                    Read this profile in Spanish
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">Services &amp; disciplines</h2>
              <div className="flex flex-wrap gap-2">
                {services.map((s: string) => (
                  <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-foreground">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule & Prices (solo EN — la traducción automática rellena estos campos) */}
          {(C.schedule_summary_en || C.price_range_en) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {C.schedule_summary_en && (
                <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">🕐 Schedule</h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.schedule_summary_en}</p>
                </div>
              )}
              {C.price_range_en && (
                <div className="bg-sand-50 border border-sand-200 rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">💰 Prices</h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{C.price_range_en}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white border border-sand-200 rounded-2xl p-6 sticky top-24">
            <h3 className="font-serif text-lg mb-4">Contact information</h3>
            <div className="space-y-3">
              {C.address && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Address</span><p className="text-foreground">{C.address}</p></div>
              )}
              {C.phone && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Phone</span><a href={`tel:${C.phone}`} className="text-foreground hover:text-terracotta-600 transition-colors">{C.phone}</a></div>
              )}
              {C.email && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Email</span><a href={`mailto:${C.email}`} className="text-foreground hover:text-terracotta-600 transition-colors break-all">{C.email}</a></div>
              )}
              {C.instagram && (
                <div className="text-sm"><span className="text-[#a09383] block text-xs uppercase tracking-wider font-semibold mb-0.5">Instagram</span><a href={`https://instagram.com/${C.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="text-foreground hover:text-terracotta-600 transition-colors">{C.instagram}</a></div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 mt-5">
              {(C.google_maps_url || C.google_place_id) && (
                <a
                  href={C.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${C.google_place_id}`}
                  target="_blank"
                  rel="noopener"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-sand-300 text-foreground font-semibold py-3 rounded-xl hover:bg-sand-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  View on Google Maps
                </a>
              )}
              {(C.latitude && C.longitude) && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${C.latitude},${C.longitude}`}
                  target="_blank"
                  rel="noopener"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-sand-300 text-foreground font-semibold py-3 rounded-xl hover:bg-sand-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  Get directions
                </a>
              )}
              {C.website && (
                <a href={C.website} target="_blank" rel="noopener" className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-600 text-white font-semibold py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Visit website
                </a>
              )}
              {C.phone && (
                <a href={`tel:${C.phone}`} className="w-full inline-flex items-center justify-center gap-2 bg-sage-600 text-white font-semibold py-3 rounded-xl hover:bg-sage-700 transition-colors text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </a>
              )}
            </div>

            <div className="mt-5 rounded-xl overflow-hidden">
              <CenterMap
                latitude={C.latitude}
                longitude={C.longitude}
                name={C.name}
                address={C.address}
                className="h-48"
              />
            </div>
          </div>
        </div>
      </div>

      <ClaimCenterButton
        centerId={C.id}
        centerSlug={slug}
        claimedBy={C.claimed_by}
        locale="en"
      />
    </div>
  );
}
