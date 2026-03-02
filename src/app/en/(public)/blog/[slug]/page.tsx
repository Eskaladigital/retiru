import Link from 'next/link';
import { Clock, Calendar, ArrowLeft, Share2, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function BlogPostEN({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase();

  const { data: article } = await supabase
    .from('blog_articles')
    .select('*, blog_categories(name_en, name_es, slug)')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!article) notFound();

  const { data: related } = await supabase
    .from('blog_articles')
    .select('id, title_en, title_es, slug, cover_image_url, blog_categories(name_en, name_es)')
    .eq('is_published', true)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3);

  const categoryName = (article.blog_categories as any)?.name_en || (article.blog_categories as any)?.name_es || 'General';

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const articleTitle = article.title_en || article.title_es;
  const articleContent = article.content_en || article.content_es;

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img
          src={article.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80'}
          alt={articleTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,35,25,0.6)] to-transparent" />
      </div>

      <div className="container-wide">
        <article className="max-w-3xl mx-auto -mt-20 relative z-10">
          {/* Card header */}
          <div className="bg-white rounded-3xl border border-sand-200 shadow-elevated p-8 md:p-10 mb-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-[#a09383] mb-5">
              <Link href="/en" className="hover:text-terracotta-600">Home</Link>
              <ChevronRight size={12} />
              <Link href="/en/blog" className="hover:text-terracotta-600">Blog</Link>
              <ChevronRight size={12} />
              <span className="text-foreground">{categoryName}</span>
            </nav>

            {/* Category + meta */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700">{categoryName}</span>
              <span className="text-xs text-[#a09383] flex items-center gap-1"><Calendar size={12} /> {formatDate(article.published_at)}</span>
              <span className="text-xs text-[#a09383] flex items-center gap-1"><Clock size={12} /> {article.read_time_min} min read</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-[clamp(24px,4vw,36px)] text-foreground leading-[1.2] mb-5">
              {articleTitle}
            </h1>

            {/* Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">RT</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Retiru Team</p>
                  <p className="text-xs text-[#a09383]">The Retiru content team, passionate about wellness and transformative travel.</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 transition-colors">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          {/* Article content */}
          <div className="px-2 md:px-4 mb-16">
            <div className="text-[15px] text-[#7a6b5d] leading-[1.85] whitespace-pre-line">
              {articleContent}
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 text-center text-white">
              <h3 className="font-serif text-xl mb-2">Ready for your next retreat?</h3>
              <p className="text-white/80 text-sm mb-5">Explore hundreds of retreats across Spain with transparent pricing.</p>
              <Link href="/en/search" className="inline-flex items-center gap-2 bg-white text-terracotta-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Explore retreats
              </Link>
            </div>
          </div>
        </article>

        {/* Related articles */}
        {related && related.length > 0 && (
          <section className="max-w-5xl mx-auto mb-16">
            <h2 className="font-serif text-2xl mb-6">Related articles</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((r) => {
                const rTitle = (r as any).title_en || (r as any).title_es;
                const rCat = (r.blog_categories as any)?.name_en || (r.blog_categories as any)?.name_es || 'General';
                return (
                  <Link
                    key={r.id}
                    href={`/en/blog/${r.slug}`}
                    className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={r.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'}
                        alt={rTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sand-200 text-[#7a6b5d]">
                        {rCat}
                      </span>
                      <h3 className="font-serif text-base leading-[1.3] mt-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">{rTitle}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Back */}
      <div className="container-wide pb-12">
        <Link href="/en/blog" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-semibold hover:gap-2.5 transition-all">
          <ArrowLeft size={16} /> Back to blog
        </Link>
      </div>
    </div>
  );
}
