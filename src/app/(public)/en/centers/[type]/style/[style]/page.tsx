// /en/centers/[type]/style/[style] — National style landing (Phase 3 #10)
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star } from 'lucide-react';
import { getCentersByStyle, getProvincesForStyle, getStyleProvincePairs } from '@/lib/data';
import { getCenterTypeLabel, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import {
  generatePageMetadata,
  jsonLdItemList,
  jsonLdBreadcrumb,
  jsonLdFAQ,
  jsonLdScript,
} from '@/lib/seo';

// See note in /[province]/page.tsx: force-dynamic because of ISR + cookies in parent layout.
export const dynamic = 'force-dynamic';

const VALID_TYPES = ['yoga', 'meditation', 'ayurveda'] as const;
const MIN_CENTERS_STYLE_NATIONAL = 3;
const MIN_CENTERS_STYLE_PROVINCE = 5;

type Params = Promise<{ type: string; style: string }>;

export async function generateStaticParams() {
  const pairs = await getStyleProvincePairs(MIN_CENTERS_STYLE_PROVINCE);
  const totals = new Map<string, { type: string; style: string; count: number }>();
  for (const p of pairs) {
    const key = `${p.centerType}|${p.styleSlug}`;
    const entry = totals.get(key) || { type: p.centerType, style: p.styleSlug, count: 0 };
    entry.count += p.count;
    totals.set(key, entry);
  }
  return Array.from(totals.values())
    .filter((t) => t.count >= MIN_CENTERS_STYLE_NATIONAL)
    .map(({ type, style }) => ({ type, style }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type, style: styleSlug } = await params;
  if (!(VALID_TYPES as readonly string[]).includes(type)) return {};
  const { style, total } = await getCentersByStyle(styleSlug);
  if (!style || style.center_type !== type || total < MIN_CENTERS_STYLE_NATIONAL) return {};
  const typeLabel = getCenterTypeLabel(type, 'en').toLowerCase();
  const esType = type === 'meditation' ? 'meditacion' : type;
  return generatePageMetadata({
    title: `${style.name_en} in Spain — ${typeLabel} ${style.name_en} centers | Retiru`,
    description: `Verified directory of ${typeLabel} ${style.name_en} centers in Spain. ${style.description_en || ''}`.trim(),
    locale: 'en',
    path: `/en/centers/${type}/style/${styleSlug}`,
    altPath: `/es/centros/${esType}/estilo/${styleSlug}`,
    keywords: [
      style.name_en.toLowerCase(),
      `${style.name_en.toLowerCase()} spain`,
      `${typeLabel} ${style.name_en.toLowerCase()}`,
      'retiru',
    ],
  });
}

export default async function CentersByStylePage({ params }: { params: Params }) {
  const { type, style: styleSlug } = await params;
  if (!(VALID_TYPES as readonly string[]).includes(type)) notFound();

  const [{ centers, total, style }, provinces] = await Promise.all([
    getCentersByStyle(styleSlug, { limit: 50 }),
    getProvincesForStyle(styleSlug, 1),
  ]);
  if (!style || style.center_type !== type || total < MIN_CENTERS_STYLE_NATIONAL) notFound();

  const typeLabel = getCenterTypeLabel(type, 'en');
  const indexableProvinces = provinces.filter((p) => p.count >= MIN_CENTERS_STYLE_PROVINCE);

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  const itemListLd = jsonLdItemList(
    centers.slice(0, 20).map((c, i) => ({
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
  ]);

  const faqItems = [
    {
      question: `What is ${style.name_en}?`,
      answer: style.description_en || `${style.name_en} is a style of ${typeLabel.toLowerCase()}.`,
    },
    {
      question: `Where can I practice ${style.name_en} in Spain?`,
      answer: `There are ${typeLabel.toLowerCase()} ${style.name_en} centers in ${provinces.length} Spanish provinces. Top ones: ${provinces.slice(0, 5).map((p) => p.name).join(', ')}.`,
    },
    {
      question: `How to choose a ${style.name_en} center?`,
      answer: `Check teacher training, methodology and real reviews. All Retiru centers are verified with up-to-date contact information.`,
    },
  ];
  const faqLd = jsonLdFAQ(faqItems);

  return (
    <>
      <section className="relative pt-[120px] pb-10 md:pt-[140px] md:pb-16 bg-gradient-to-br from-sage-50 via-cream-50 to-sand-50">
        <div className="container-wide relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Link href={`/en/centers/${type}`} className="hover:underline">{typeLabel} centers</Link>
              <span>/</span>
              <span>{style.name_en}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {typeLabel} <span className="text-terracotta-600">{style.name_en}</span> centers in Spain
            </h1>
            {style.description_en && (
              <p className="text-base md:text-lg text-[#7a6b5d] leading-relaxed mb-5">
                {style.description_en}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {total} verified {total === 1 ? 'center' : 'centers'} · {provinces.length} {provinces.length === 1 ? 'province' : 'provinces'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide">
          {indexableProvinces.length > 1 && (
            <div className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">
                {style.name_en} by province
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {indexableProvinces.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/en/centers/${type}/style/${styleSlug}/${p.slug}`}
                    className="px-4 py-3 rounded-xl border border-sand-200 bg-white hover:bg-sand-50 hover:border-terracotta-300 transition text-sm font-medium flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-[#a09383]">{p.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">
            Top {style.name_en} centers
          </h2>
          <div className="space-y-4">
            {centers.map((c, idx) => {
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

          <section className="mt-12">
            <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqItems.map((f) => (
                <details key={f.question} className="group rounded-xl border border-sand-200 bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-foreground list-none">{f.question}</summary>
                  <p className="mt-3 text-sm text-[#7a6b5d] leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqLd) }} />
    </>
  );
}
