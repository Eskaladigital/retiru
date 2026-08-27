import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { applyPublicBlogFilters, filterPublicBlogArticles } from '@/lib/blog-visible';
import { blogEN } from '@/lib/seo/page-metadata';
import { createStaticSupabase } from '@/lib/supabase/server';

export const revalidate = 60;
export const metadata: Metadata = blogEN;

function normalizeForSearch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function blogListHrefEn(opts: { q?: string; category?: string }): string {
  const p = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) p.set('q', q);
  if (opts.category) p.set('category', opts.category);
  const qs = p.toString();
  return qs ? `/en/blog?${qs}` : '/en/blog';
}

type SearchParams = { q?: string; category?: string };

export default async function BlogPageEN({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = createStaticSupabase();

  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name_en, name_es, slug')
    .order('sort_order');

  const { data: articlesRaw } = await applyPublicBlogFilters(
    supabase
      .from('blog_articles')
      .select('id, title_en, title_es, slug, slug_en, excerpt_en, excerpt_es, cover_image_url, read_time_min, published_at, category_id, blog_categories(name_en, name_es)'),
  ).order('published_at', { ascending: false });

  const qRaw = (sp.q ?? '').trim();
  const categorySlug = (sp.category ?? '').trim();

  let list = filterPublicBlogArticles(articlesRaw);
  if (categorySlug && categories?.length) {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) list = list.filter((a) => a.category_id === cat.id);
  }

  if (qRaw) {
    const needle = normalizeForSearch(qRaw);
    list = list.filter((a) => {
      const tit = `${a.title_en ?? ''} ${a.title_es ?? ''}`;
      const ex = `${a.excerpt_en ?? ''} ${a.excerpt_es ?? ''}`;
      const blob = normalizeForSearch(`${tit} ${ex}`);
      return blob.includes(needle);
    });
  }

  const featured = list[0];
  const rest = list.slice(1);
  const hasActiveFilters = !!(qRaw || categorySlug);
  const poolEmpty = !articlesRaw || articlesRaw.length === 0;
  const filteredEmpty = !poolEmpty && list.length === 0;

  type ArticleRow = (typeof list)[number];

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function title(a: ArticleRow) {
    return a.title_en || a.title_es;
  }
  function excerpt(a: ArticleRow) {
    return a.excerpt_en || a.excerpt_es;
  }
  function catName(a: ArticleRow) {
    const bc = a.blog_categories as { name_en?: string; name_es?: string } | null;
    return bc?.name_en || bc?.name_es || 'General';
  }
  function enSlug(a: ArticleRow) {
    return a.slug_en || a.slug;
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-cream-100 to-white">
        <div className="container-wide py-14 md:py-18 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600 mb-3">Blog</span>
          <h1 className="font-serif text-[clamp(32px,5vw,52px)] text-foreground leading-[1.15] mb-3">
            Yoga, meditation &amp; ayurveda
          </h1>
          <p className="text-[#7a6b5d] text-lg max-w-xl mx-auto leading-relaxed">
            Guides and ideas for your practice and your retreats.
          </p>
        </div>
      </section>

      <div className="container-wide mb-8">
        <form action="/en/blog" method="get" className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto items-stretch sm:items-center">
          {categorySlug ? <input type="hidden" name="category" value={categorySlug} /> : null}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a09383]" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={qRaw}
              placeholder="Search by title..."
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
            />
          </div>
          <button type="submit" className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors whitespace-nowrap shrink-0">
            Search
          </button>
          {hasActiveFilters && (
            <Link href="/en/blog" className="text-center text-sm font-semibold text-[#7a6b5d] hover:text-terracotta-600 py-2 sm:self-center">
              Clear filters
            </Link>
          )}
        </form>
      </div>

      <div className="container-wide -mt-2 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href={blogListHrefEn({ q: qRaw })}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !categorySlug ? 'bg-terracotta-600 text-white' : 'border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 hover:bg-terracotta-50 font-medium'
            }`}
          >
            All
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              href={blogListHrefEn({ category: c.slug, q: qRaw })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                categorySlug === c.slug
                  ? 'bg-terracotta-600 text-white border-terracotta-600'
                  : 'border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 hover:bg-terracotta-50'
              }`}
            >
              {(c as { name_en?: string; name_es?: string }).name_en || (c as { name_en?: string; name_es?: string }).name_es}
            </Link>
          ))}
        </div>
      </div>

      {featured && (
        <section className="container-wide mb-12">
          <Link href={`/en/blog/${enSlug(featured)}`} className="group grid md:grid-cols-2 gap-0 bg-white rounded-3xl border border-sand-200 overflow-hidden hover:shadow-elevated transition-all duration-300">
            <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
              <img
                src={featured.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80'}
                alt={title(featured)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700">
                  {catName(featured)}
                </span>
                <span className="text-xs text-[#a09383] flex items-center gap-1"><Clock size={12} /> {featured.read_time_min} min</span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-[1.25] mb-3 group-hover:text-terracotta-600 transition-colors">
                {title(featured)}
              </h2>
              <p className="text-[15px] text-[#7a6b5d] leading-relaxed mb-5 line-clamp-3">
                {excerpt(featured)}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">RT</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Retiru Team</p>
                    <p className="text-xs text-[#a09383]">{formatDate(featured.published_at)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-terracotta-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read article <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section className="container-wide mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <Link
                key={article.id}
                href={`/en/blog/${enSlug(article)}`}
                className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={article.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80'}
                    alt={title(article)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sand-200 text-[#7a6b5d]">
                      {catName(article)}
                    </span>
                    <span className="text-[11px] text-[#a09383] flex items-center gap-1"><Clock size={11} /> {article.read_time_min} min</span>
                  </div>
                  <h3 className="font-serif text-lg leading-[1.3] mb-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                    {title(article)}
                  </h3>
                  <p className="text-sm text-[#7a6b5d] leading-relaxed line-clamp-2 mb-3">
                    {excerpt(article)}
                  </p>
                  <p className="text-xs text-[#a09383]">{formatDate(article.published_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {poolEmpty && (
        <section className="container-wide mb-16 text-center py-12">
          <p className="text-[#7a6b5d] text-lg">We&apos;ll be publishing articles about yoga, meditation and ayurveda soon.</p>
        </section>
      )}

      {filteredEmpty && (
        <section className="container-wide mb-16 text-center py-12">
          <p className="text-[#7a6b5d] text-lg mb-2">No articles match your search.</p>
          <p className="text-sm text-[#a09383]">
            Try different words or <Link href="/en/blog" className="text-terracotta-600 font-semibold hover:underline">clear filters</Link>.
          </p>
        </section>
      )}

      <section className="bg-sand-100">
        <div className="container-wide py-14">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl mb-3">Don&apos;t miss a thing</h2>
            <p className="text-[#7a6b5d] mb-6">Get yoga, meditation and ayurveda articles in your inbox every week.</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all"
              />
              <button type="submit" className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-xs text-[#a09383] mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
