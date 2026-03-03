import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { blogEN } from '@/lib/seo/page-metadata';
import { createServerSupabase } from '@/lib/supabase/server';

export const revalidate = 60;
export const metadata: Metadata = blogEN;

export default async function BlogPageEN() {
  const supabase = await createServerSupabase();

  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name_en, name_es, slug')
    .order('sort_order');

  const { data: articles } = await supabase
    .from('blog_articles')
    .select('id, title_en, title_es, slug, excerpt_en, excerpt_es, cover_image_url, read_time_min, published_at, category_id, blog_categories(name_en, name_es)')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const featured = articles?.[0];
  const rest = articles?.slice(1) ?? [];

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function title(a: any) { return a.title_en || a.title_es; }
  function excerpt(a: any) { return a.excerpt_en || a.excerpt_es; }
  function catName(a: any) { return (a.blog_categories as any)?.name_en || (a.blog_categories as any)?.name_es || 'General'; }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream-100 to-white">
        <div className="container-wide py-14 md:py-18 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600 mb-3">Blog</span>
          <h1 className="font-serif text-[clamp(32px,5vw,52px)] text-foreground leading-[1.15] mb-3">
            Inspiration &amp; wellness
          </h1>
          <p className="text-[#7a6b5d] text-lg max-w-xl mx-auto leading-relaxed">
            Guides, tips and destinations to make every retreat a transformative experience.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <div className="container-wide -mt-2 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link href="/en/blog" className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-terracotta-600 text-white">
            All
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              href={`/en/blog?category=${c.slug}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-sand-300 text-[#7a6b5d] hover:border-terracotta-300 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
            >
              {(c as any).name_en || (c as any).name_es}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured article */}
      {featured && (
        <section className="container-wide mb-12">
          <Link href={`/en/blog/${featured.slug}`} className="group grid md:grid-cols-2 gap-0 bg-white rounded-3xl border border-sand-200 overflow-hidden hover:shadow-elevated transition-all duration-300">
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

      {/* Articles grid */}
      {rest.length > 0 && (
        <section className="container-wide mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <Link
                key={article.id}
                href={`/en/blog/${article.slug}`}
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

      {/* Empty state */}
      {(!articles || articles.length === 0) && (
        <section className="container-wide mb-16 text-center py-12">
          <p className="text-[#7a6b5d] text-lg">We&apos;ll be publishing articles about retreats and wellness soon.</p>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="bg-sand-100">
        <div className="container-wide py-14">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl mb-3">Don&apos;t miss a thing</h2>
            <p className="text-[#7a6b5d] mb-6">Get the best wellness, retreat and destination articles delivered to your inbox every week.</p>
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
