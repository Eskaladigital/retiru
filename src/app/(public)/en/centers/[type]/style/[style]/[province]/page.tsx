// /en/centers/[type]/style/[style]/[province] — Province-level style landing (Phase 3 #10)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import { getCentersByStyle, getStyleProvincePairs } from '@/lib/data';
import { getCenterTypeLabel, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import {
  generatePageMetadata,
  jsonLdItemList,
  jsonLdBreadcrumb,
  jsonLdScript,
} from '@/lib/seo';

// Dynamic landing under (public)/layout (uses cookies via getCurrentUserForHeader).
// ISR + cookies in layout → Next 14 marked SSG as failed (DYNAMIC_SERVER_USAGE)
// and served 500 after build. Force-dynamic avoids it (layout already dynamic anyway).
export const dynamic = 'force-dynamic';

const VALID_TYPES = ['yoga', 'meditation', 'ayurveda'] as const;
const MIN_CENTERS_STYLE_PROVINCE = 5;

type Params = Promise<{ type: string; style: string; province: string }>;

export async function generateStaticParams() {
  const pairs = await getStyleProvincePairs(MIN_CENTERS_STYLE_PROVINCE);
  return pairs.map((p) => ({
    type: p.centerType,
    style: p.styleSlug,
    province: p.provinceSlug,
  }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type, style: styleSlug, province } = await params;
  if (!(VALID_TYPES as readonly string[]).includes(type)) return {};
  const { style, centers } = await getCentersByStyle(styleSlug, { limit: 200 });
  if (!style || style.center_type !== type) return {};

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const matches = centers.filter((c) => c.province && normalize(c.province) === province);
  if (matches.length < MIN_CENTERS_STYLE_PROVINCE) return {};

  const provinceName = matches[0].province;
  const typeLabel = getCenterTypeLabel(type, 'en').toLowerCase();
  const esType = type === 'meditation' ? 'meditacion' : type;
  return generatePageMetadata({
    title: `${style.name_en} in ${provinceName} — ${matches.length} ${typeLabel} centers | Retiru`,
    description: `${typeLabel} ${style.name_en} centers in ${provinceName}. ${matches.length} verified options with real reviews.`,
    locale: 'en',
    path: `/en/centers/${type}/style/${styleSlug}/${province}`,
    altPath: `/es/centros/${esType}/estilo/${styleSlug}/${province}`,
    keywords: [
      `${style.name_en.toLowerCase()} ${provinceName?.toLowerCase()}`,
      `${typeLabel} ${provinceName?.toLowerCase()}`,
      'retiru',
    ],
  });
}

export default async function CentersStyleProvincePage({ params }: { params: Params }) {
  const { type, style: styleSlug, province } = await params;
  if (!(VALID_TYPES as readonly string[]).includes(type)) notFound();

  const { style, centers } = await getCentersByStyle(styleSlug, { limit: 300 });
  if (!style || style.center_type !== type) notFound();

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const provinceCenters = centers.filter((c) => c.province && normalize(c.province) === province);
  if (provinceCenters.length < MIN_CENTERS_STYLE_PROVINCE) notFound();

  const provinceName = provinceCenters[0].province;
  const typeLabel = getCenterTypeLabel(type, 'en');

  const itemListLd = jsonLdItemList(
    provinceCenters.slice(0, 20).map((c, i) => ({
      name: c.name,
      url: `/en/center/${c.slug}`,
      image: c.cover_url || (Array.isArray(c.images) && c.images[0]) || undefined,
      position: i + 1,
    })),
  );
  const breadcrumbLd = jsonLdBreadcrumb([
    { name: 'Retiru', url: '/en' },
    { name: `${typeLabel} centers`, url: `/en/centers/${type}` },
    { name: style.name_en, url: `/en/centers/${type}/style/${styleSlug}` },
    { name: provinceName, url: `/en/centers/${type}/style/${styleSlug}/${province}` },
  ]);

  return (
    <>
      <section className="relative pt-[120px] pb-10 md:pt-[140px] md:pb-16 bg-gradient-to-br from-sage-50 via-cream-50 to-sand-50">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Link href={`/en/centers/${type}`} className="hover:underline">{typeLabel} centers</Link>
              <span>/</span>
              <Link href={`/en/centers/${type}/style/${styleSlug}`} className="hover:underline">{style.name_en}</Link>
              <span>/</span>
              <span>{provinceName}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {style.name_en} in <span className="text-terracotta-600">{provinceName}</span>
            </h1>
            <p className="text-base md:text-lg text-[#7a6b5d] leading-relaxed mb-5">
              {provinceCenters.length} verified {typeLabel.toLowerCase()} {style.name_en} centers in {provinceName}.
              {style.description_en && ` ${style.description_en}`}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide">
          <div className="space-y-4">
            {provinceCenters.map((c, idx) => {
              const imgSrc = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
              const rawDesc = c.description_en || '';
              const clean = rawDesc && !isGenericDescription(rawDesc) ? stripMarkdownForPreview(rawDesc) : '';
              return (
                <Link
                  key={c.slug}
                  href={`/en/center/${c.slug}`}
                  className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
                >
                  <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative bg-sand-100">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={c.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 208px"
                        {...(idx < 3 ? { priority: true } : { loading: 'lazy' as const })}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a09383] text-sm">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="font-serif text-lg leading-tight group-hover:text-terracotta-600 transition-colors">{c.name}</h3>
                        <span className="text-[13px] text-[#7a6b5d] flex items-center gap-1 mt-1.5">
                          <MapPin size={13} /> {c.city}{c.province ? `, ${c.province}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={15} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{c.avg_rating ?? '–'}</span>
                        <span className="text-xs text-[#a09383]">({c.review_count ?? 0})</span>
                      </div>
                    </div>
                    {clean && <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{clean}</p>}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-sand-50 border border-sand-200 text-sm leading-relaxed text-[#7a6b5d]">
            Looking for {style.name_en} outside {provinceName}? Discover{' '}
            <Link href={`/en/centers/${type}/style/${styleSlug}`} className="text-terracotta-600 font-semibold underline">
              all {style.name_en} centers in Spain
            </Link>{' '}
            or browse{' '}
            <Link href={`/en/centers/${type}`} className="text-terracotta-600 font-semibold underline">
              {typeLabel.toLowerCase()} centers in Spain
            </Link>.
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
    </>
  );
}
