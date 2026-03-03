// /administrator/blog/nuevo — Crear nuevo artículo
import { createAdminSupabase } from '@/lib/supabase/server';
import { BlogArticleForm } from '../BlogArticleForm';

export default async function AdminBlogNuevoPage() {
  const supabase = createAdminSupabase();
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name_es, slug')
    .order('sort_order');

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Nuevo artículo</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">Crea un nuevo artículo para el blog de Retiru.</p>
      <BlogArticleForm categories={categories || []} />
    </div>
  );
}
