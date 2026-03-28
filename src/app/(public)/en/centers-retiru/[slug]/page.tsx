// /en/centers-retiru/[slug] — Centers filtered by province (real Supabase data)
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { getCenterProvinces, getCentersByProvince } from '@/lib/data';
import { getCenterTypeLabel } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
  const provinces = await getCenterProvinces();
  return provinces.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { provinceName } = await getCentersByProvince(slug);
  const name = provinceName || slug;
  return {
    title: `Yoga, meditation & ayurveda centers in ${name} | Retiru`,
    description: `Find yoga, meditation and ayurveda centers in ${name}. Verified directory with real reviews.`,
    alternates: { languages: { es: `/es/centros-retiru/${slug}`, en: `/en/centers-retiru/${slug}` } },
  };
}

export default async function CentersByProvincePageEN({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { centers, provinceName } = await getCentersByProvince(slug);

  if (!provinceName) {
    return (
      <div className="container-wide py-12">
        <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Centers directory
        </Link>
        <p className="font-serif text-xl text-foreground">Province not found</p>
      </div>
    );
  }

  return (
    <div className="container-wide py-10">
      <Link href="/en/centers-retiru" className="inline-flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        All centers
      </Link>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] text-foreground mb-2">Centers in {provinceName}</h1>
      <p className="text-sm text-[#a09383] mb-6">{centers.length} center{centers.length !== 1 ? 's' : ''} in {provinceName}</p>

      {centers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-foreground mb-2">No centers in {provinceName}</p>
          <Link href="/en/centers-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">View full directory</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {centers.map(c => {
            const img = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
            return (
              <Link
                key={c.id}
                href={`/en/center/${c.slug}`}
                className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
              >
                <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative bg-sand-100">
                  {img ? (
                    <img src={img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-sand-300">🏢</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h2 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        {c.type && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{getCenterTypeLabel(c.type, 'en')}</span>
                        )}
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1"><MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}</span>
                        {(c.google_maps_url || c.google_place_id) && (
                          <a href={c.google_maps_url || `https://www.google.com/maps/place/?q=place_id:${c.google_place_id}`} target="_blank" rel="noopener" className="text-[11px] text-terracotta-600 hover:underline flex items-center gap-0.5">Maps</a>
                        )}
                      </div>
                    </div>
                    {(c.avg_rating ?? 0) > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={15} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{c.avg_rating}</span>
                        {(c.review_count ?? 0) > 0 && <span className="text-xs text-[#a09383]">({c.review_count})</span>}
                      </div>
                    )}
                  </div>
                  {c.description_en && (
                    <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{c.description_en}</p>
                  )}
                  {Array.isArray(c.categories) && c.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {c.categories.slice(0, 4).map((cat: string) => (
                        <span key={cat} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-[#7a6b5d]">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
