import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Calendar, ArrowLeft, Share2, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getBlogPostSlugs, getCenterProvinces } from '@/lib/data';
import { createServerSupabase } from '@/lib/supabase/server';
import { RichContentBody } from '@/components/ui/retreat-description-body';
import { contentLooksLikeHtml } from '@/lib/sanitize-rich-html';
import { autoLinkGeoHtml } from '@/lib/auto-link-geo';
import { jsonLdArticle, jsonLdBreadcrumb, jsonLdScript } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

const BASE_URL = getSiteUrl();

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getBlogPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: article } = await supabase
    .from('blog_articles')
    .select('title_es, excerpt_es, meta_title_es, meta_description_es, slug, slug_en, cover_image_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!article) return {};

  const title = article.meta_title_es || article.title_es;
  const description = article.meta_description_es || article.excerpt_es;
  const enSlug = article.slug_en || article.slug;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/es/blog/${article.slug}`,
      languages: {
        es: `${BASE_URL}/es/blog/${article.slug}`,
        en: `${BASE_URL}/en/blog/${enSlug}`,
        'x-default': `${BASE_URL}/es/blog/${article.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/es/blog/${article.slug}`,
      images: article.cover_image_url
        ? [{ url: article.cover_image_url, width: 1536, height: 1024, alt: article.title_es }]
        : undefined,
      locale: 'es_ES',
      alternateLocale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: article } = await supabase
    .from('blog_articles')
    .select('*, blog_categories(name_es, slug)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!article) notFound();

  const { data: related } = await supabase
    .from('blog_articles')
    .select('id, title_es, slug, cover_image_url, blog_categories(name_es)')
    .eq('is_published', true)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3);

  const categoryName = (article.blog_categories as any)?.name_es ?? 'General';

  // Autolink geográfico: enlaza automáticamente la primera mención de cada
  // provincia con ≥1 centro hacia su hub /es/provincias/[slug]. Solo si el
  // cuerpo es HTML (TinyMCE); el sanitizer posterior mantiene nuestros <a>.
  const rawContent = article.content_es ?? '';
  let content = rawContent;
  if (contentLooksLikeHtml(rawContent)) {
    const provinces = await getCenterProvinces();
    const entries = provinces.map((p) => ({ name: p.name, href: `/es/provincias/${p.slug}` }));
    content = autoLinkGeoHtml(rawContent, entries, { max: 4 });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div>
      <div className="container-wide pt-8 md:pt-10">
        <article className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#a09383] mb-5">
            <Link href="/es" className="hover:text-terracotta-600">Inicio</Link>
            <ChevronRight size={12} />
            <Link href="/es/blog" className="hover:text-terracotta-600">Blog</Link>
            <ChevronRight size={12} />
            <span className="text-foreground">{categoryName}</span>
          </nav>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700">{categoryName}</span>
            <span className="text-xs text-[#a09383] flex items-center gap-1"><Calendar size={12} /> {formatDate(article.published_at)}</span>
            <span className="text-xs text-[#a09383] flex items-center gap-1"><Clock size={12} /> {article.read_time_min} min de lectura</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[clamp(26px,4.5vw,42px)] text-foreground leading-[1.15] mb-6">
            {article.title_es}
          </h1>

          {/* Author */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">ER</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Equipo Retiru</p>
                <p className="text-xs text-[#a09383]">El equipo de contenido de Retiru — yoga, meditación y ayurveda.</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-sm text-[#7a6b5d] hover:text-terracotta-600 transition-colors">
              <Share2 size={16} /> Compartir
            </button>
          </div>

          {/* Hero image — respeta ratio 3:2 panorámico */}
          <div className="relative aspect-[3/2] md:aspect-[16/9] w-full overflow-hidden rounded-2xl mb-10">
            <img
              src={article.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80'}
              alt={article.title_es}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article content */}
          <div className="max-w-3xl mx-auto mb-16">
            <RichContentBody content={content} />

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-terracotta-600 to-terracotta-700 rounded-2xl p-8 text-center text-white">
              <h3 className="font-serif text-xl mb-2">¿Listo para tu próximo retiro?</h3>
              <p className="text-white/80 text-sm mb-5">Explora cientos de retiros en España con precios transparentes.</p>
              <Link href="/es/buscar" className="inline-flex items-center gap-2 bg-white text-terracotta-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Explorar retiros
              </Link>
            </div>
          </div>
        </article>

        {/* Related articles */}
        {related && related.length > 0 && (
          <section className="max-w-5xl mx-auto mb-16">
            <h2 className="font-serif text-2xl mb-6">Artículos relacionados</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/es/blog/${r.slug}`}
                  className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={r.cover_image_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'}
                      alt={r.title_es}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sand-200 text-[#7a6b5d]">
                      {(r.blog_categories as any)?.name_es ?? 'General'}
                    </span>
                    <h3 className="font-serif text-base leading-[1.3] mt-2 group-hover:text-terracotta-600 transition-colors line-clamp-2">{r.title_es}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Back */}
      <div className="container-wide pb-12">
        <Link href="/es/blog" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-semibold hover:gap-2.5 transition-all">
          <ArrowLeft size={16} /> Volver al blog
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(jsonLdArticle({
            headline: article.title_es,
            description: article.excerpt_es || '',
            datePublished: article.published_at || '',
            dateModified: article.updated_at,
            image: article.cover_image_url,
            url: `/es/blog/${article.slug}`,
            locale: 'es',
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(jsonLdBreadcrumb([
            { name: 'Retiru', url: '/es' },
            { name: 'Blog', url: '/es/blog' },
            { name: categoryName, url: '/es/blog' },
            { name: article.title_es, url: `/es/blog/${article.slug}` },
          ])),
        }}
      />
    </div>
  );
}
