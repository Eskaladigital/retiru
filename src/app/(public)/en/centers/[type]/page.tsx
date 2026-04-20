// /en/centers/[type] — Centers by type (yoga / meditation / ayurveda)
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import CentrosSearch from '@/components/home/CentrosSearch';
import { getActiveCenters, getCategoryBySlug, getProvincesForCenterType } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCenterTypeLabel, CATEGORY_SLUG_EN, stripMarkdownForPreview, isGenericDescription } from '@/lib/utils';
import { generatePageMetadata, jsonLdItemList, jsonLdBreadcrumb, jsonLdFAQ, jsonLdScript } from '@/lib/seo';
import {
  STYLES_BY_TYPE,
  HOW_TO_CHOOSE_BY_TYPE,
  EXTRA_FAQS_BY_TYPE,
  centerTypeKey,
} from '@/lib/center-type-editorial';

export const revalidate = 3600;

const TYPE_ES_SLUG: Record<string, string> = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };
const VALID_TYPES = ['yoga', 'meditation', 'ayurveda'] as const;

export async function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) return {};
  const label = getCenterTypeLabel(type, 'en');
  const esSlug = TYPE_ES_SLUG[type] || type;
  return generatePageMetadata({
    title: `${label} Centers in Spain — Verified Directory | Retiru`,
    description: `Find ${label.toLowerCase()} centers across Spain. Directory with real reviews, location and services. Find your ideal center on Retiru.`,
    locale: 'en',
    path: `/en/centers/${type}`,
    altPath: `/es/centros/${esSlug}`,
    keywords: [`${label.toLowerCase()} centers`, `${label.toLowerCase()} spain`, `${label.toLowerCase()} directory`, 'retiru'],
  });
}

export default async function CentersByTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) notFound();
  const label = getCenterTypeLabel(type, 'en');
  const catSlug = type === 'meditation' ? 'meditacion' : type;

  const [{ centers, total }, provinces, cat] = await Promise.all([
    getActiveCenters({ type, limit: 50 }),
    getProvincesForCenterType(type),
    getCategoryBySlug(catSlug),
  ]);

  const topProvinces = [...provinces].sort((a, b) => b.count - a.count).slice(0, 6);
  const typeKey = centerTypeKey(type);
  const styles = typeKey ? STYLES_BY_TYPE[typeKey] : [];
  const tips = typeKey ? HOW_TO_CHOOSE_BY_TYPE[typeKey] : [];
  const extraFaqs = typeKey ? EXTRA_FAQS_BY_TYPE[typeKey] : [];

  const supabase = await createServerSupabase();
  const { data: relatedBlog } = await supabase
    .from('blog_articles')
    .select('id, slug, slug_en, title_es, title_en, excerpt_es, excerpt_en, cover_image_url, published_at, blog_categories!inner(slug)')
    .eq('is_published', true)
    .eq('blog_categories.slug', catSlug)
    .order('published_at', { ascending: false })
    .limit(3);

  const catFaqs = Array.isArray(cat?.faq) ? cat.faq.filter((q) => q?.question && q?.answer) : [];
  const mergedFaqs: { question: string; answer: string }[] = [...catFaqs];
  for (const extra of extraFaqs) {
    if (mergedFaqs.length >= 10) break;
    if (!mergedFaqs.some((f) => f.question.trim().toLowerCase() === extra.question_en.trim().toLowerCase())) {
      mergedFaqs.push({ question: extra.question_en, answer: extra.answer_en });
    }
  }

  return (
    <>
      <section className="relative min-h-[50vh] flex items-center pt-[72px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {cat?.cover_image_url ? (
            <>
              <Image src={cat.cover_image_url} alt={`${label} Centers`} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(254,253,251,0.95)] via-[rgba(254,253,251,0.85)] to-[rgba(254,253,251,0.2)] max-md:bg-gradient-to-b max-md:from-[rgba(254,253,251,0.93)] max-md:to-[rgba(254,253,251,0.4)]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage-100 via-cream-100 to-sand-100" />
          )}
        </div>
        <div className="container-wide relative z-10 py-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(32px,5vw,48px)] text-foreground mb-4">
              {label} Centers in Spain
            </h1>
            <p className="text-lg text-[#7a6b5d] mb-6">
              {total} {label.toLowerCase()} center{total !== 1 ? 's' : ''} in our directory
            </p>
            <div className="bg-white border border-sand-300 rounded-2xl p-2 shadow-elevated max-w-2xl">
              <CentrosSearch locale="en" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <nav className="flex items-center gap-1.5 text-sm text-[#7a6b5d] mb-8">
          <Link href="/en" className="hover:text-terracotta-600">Home</Link>
          <span>/</span>
          <Link href="/en/centers-retiru" className="hover:text-terracotta-600">Centers</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{label} Centers</span>
        </nav>

        {cat?.intro_en && (
          <div className="prose prose-sand max-w-3xl mb-10">
            <div dangerouslySetInnerHTML={{ __html: cat.intro_en.replace(/\n/g, '<br/>') }} />
          </div>
        )}

        {topProvinces.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl text-foreground mb-5">
              Top provinces with {label.toLowerCase()} centers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {topProvinces.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/en/centers/${type}/${p.slug}`}
                  className="group relative p-4 bg-gradient-to-br from-sand-50 to-white border border-sand-200 rounded-2xl hover:border-terracotta-300 hover:shadow-soft transition-all"
                >
                  <span className="absolute top-2 right-3 text-xs text-[#a09383] font-semibold">#{i + 1}</span>
                  <MapPin size={18} className="text-terracotta-600 mb-2" />
                  <p className="font-serif text-base text-foreground group-hover:text-terracotta-600 transition-colors leading-tight">{p.name}</p>
                  <p className="text-xs text-[#7a6b5d] mt-1">{p.count} center{p.count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {provinces.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-xl text-foreground mb-4">
              Explore {label.toLowerCase()} by province ({provinces.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {provinces.map((p) => (
                <Link
                  key={p.slug}
                  href={`/en/centers/${type}/${p.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-sand-200 rounded-full text-sm hover:border-terracotta-300 hover:text-terracotta-600 transition-colors"
                >
                  <MapPin size={13} />
                  {p.name}
                  <span className="text-xs text-[#a09383]">({p.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {centers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-foreground mb-2">No {label.toLowerCase()} centers available</p>
            <p className="text-sm text-[#7a6b5d] mb-6">Browse the full directory</p>
            <Link href="/en/centers-retiru" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">View full directory</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {centers.map((c) => {
              const img = c.cover_url || (Array.isArray(c.images) && c.images[0]) || '';
              return (
                <Link
                  key={c.id}
                  href={`/en/center/${c.slug}`}
                  className="group flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
                >
                  <div className="w-full md:w-52 h-40 rounded-xl overflow-hidden shrink-0 relative bg-sand-100">
                    {img ? (
                      <Image src={img} alt={c.name} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 208px" />
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
                    {(() => {
                      const raw = c.description_en;
                      if (!raw || isGenericDescription(raw)) return null;
                      const clean = stripMarkdownForPreview(raw);
                      if (!clean) return null;
                      return <p className="text-sm text-[#7a6b5d] leading-relaxed mt-2 line-clamp-2">{clean}</p>;
                    })()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <section className="mt-12 p-6 bg-sand-50 border border-sand-200 rounded-2xl">
          <h2 className="font-serif text-xl text-foreground mb-2">
            {label} Retreats in Spain
          </h2>
          <p className="text-sm text-[#7a6b5d] mb-4">
            Discover {label.toLowerCase()} retreats and getaways across Spain with transparent pricing.
          </p>
          <Link
            href={`/en/retreats-${CATEGORY_SLUG_EN[catSlug] || catSlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
          >
            Browse {label.toLowerCase()} retreats →
          </Link>
        </section>

        {styles.length > 0 && (
          <section className="mt-16 max-w-5xl">
            <h2 className="font-serif text-2xl text-foreground mb-5">
              Most practiced {label.toLowerCase()} styles in Spain
            </h2>
            <p className="text-sm text-[#7a6b5d] mb-6 max-w-3xl">
              Not every center teaches the same styles. These are the variants you will find most often:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {styles.map((s) => (
                <div key={s.name} className="bg-white border border-sand-200 rounded-2xl p-5">
                  <p className="font-serif text-lg text-foreground mb-1">{s.name}</p>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed">{s.description_en}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tips.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-5">
              How to choose a {label.toLowerCase()} center
            </h2>
            <ol className="space-y-4">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 font-semibold flex items-center justify-center text-sm">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-foreground mb-1">{t.title_en}</p>
                    <p className="text-sm text-[#7a6b5d] leading-relaxed">{t.body_en}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {Array.isArray(relatedBlog) && relatedBlog.length > 0 && (
          <section className="mt-14 max-w-5xl">
            <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
              <h2 className="font-serif text-2xl text-foreground">
                Blog guides about {label.toLowerCase()}
              </h2>
              <Link href="/en/blog" className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700">
                View blog →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedBlog.map((b: any) => {
                const href = `/en/blog/${b.slug_en || b.slug}`;
                const title = b.title_en || b.title_es;
                const excerpt = b.excerpt_en || b.excerpt_es;
                return (
                  <Link
                    key={b.id}
                    href={href}
                    className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-sand-300 transition-all"
                  >
                    <div className="relative w-full h-36 bg-sand-100">
                      {b.cover_image_url ? (
                        <Image src={b.cover_image_url} alt={title} fill loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-sand-300">📖</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-sm leading-tight group-hover:text-terracotta-600 transition-colors mb-1.5 line-clamp-2">{title}</h3>
                      {excerpt && <p className="text-xs text-[#7a6b5d] line-clamp-2">{excerpt}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {mergedFaqs.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="font-serif text-2xl text-foreground mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {mergedFaqs.map((item, i) => (
                <details key={i} className="group bg-white border border-sand-200 rounded-xl">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-foreground">
                    {item.question}
                    <svg className="w-5 h-5 text-[#a09383] shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[#7a6b5d] leading-relaxed">{item.answer}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {centers.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdScript(jsonLdItemList(centers.map((c, i) => ({
                name: c.name,
                url: `/en/center/${c.slug}`,
                image: c.cover_url || (Array.isArray(c.images) && c.images[0]) || undefined,
                position: i + 1,
              })))),
            }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(jsonLdBreadcrumb([
              { name: 'Home', url: '/en' },
              { name: 'Centers', url: '/en/centers-retiru' },
              { name: `${label} Centers`, url: `/en/centers/${type}` },
            ])),
          }}
        />
        {mergedFaqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFAQ(mergedFaqs)) }}
          />
        )}
      </div>
    </>
  );
}
