// /administrator/blog/[id] — Editar artículo
import { createAdminSupabase } from '@/lib/supabase/server';
import { BlogArticleForm } from '../BlogArticleForm';
import { notFound } from 'next/navigation';

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabase();

  const { data: article } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (!article) notFound();

  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name_es, slug')
    .order('sort_order');

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Editar artículo</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{article.title_es}</p>
      <BlogArticleForm categories={categories || []} article={article} />
    </div>
  );
}
