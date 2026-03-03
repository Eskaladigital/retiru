// POST /api/admin/blog — Crear artículo (solo admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const body = await request.json();
  const {
    title_es,
    title_en,
    slug,
    slug_en,
    excerpt_es,
    excerpt_en,
    content_es,
    content_en,
    category_id,
    cover_image_url,
    read_time_min,
    is_published,
    meta_title_es,
    meta_description_es,
  } = body;

  if (!title_es || !slug || !excerpt_es || !content_es || !category_id) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: title_es, slug, excerpt_es, content_es, category_id' },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from('blog_articles')
    .insert({
      title_es,
      title_en: title_en || null,
      slug,
      slug_en: slug_en || null,
      excerpt_es,
      excerpt_en: excerpt_en || null,
      content_es,
      content_en: content_en || null,
      category_id,
      author_id: user.id,
      cover_image_url: cover_image_url || null,
      read_time_min: read_time_min ?? 5,
      is_published: !!is_published,
      published_at: is_published ? new Date().toISOString() : null,
      meta_title_es: meta_title_es || null,
      meta_description_es: meta_description_es || null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
