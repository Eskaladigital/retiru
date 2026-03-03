// PUT /api/admin/blog/[id] — Actualizar artículo | DELETE — Eliminar (solo admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado', status: 401 as const };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Solo administradores', status: 403 as const };
  return { user };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

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
      { error: 'Faltan campos requeridos' },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const update: Record<string, unknown> = {
    title_es,
    title_en: title_en || null,
    slug,
    slug_en: slug_en || null,
    excerpt_es,
    excerpt_en: excerpt_en || null,
    content_es,
    content_en: content_en || null,
    category_id,
    cover_image_url: cover_image_url || null,
    read_time_min: read_time_min ?? 5,
    is_published: !!is_published,
    meta_title_es: meta_title_es || null,
    meta_description_es: meta_description_es || null,
  };
  if (is_published) {
    const { data: existing } = await admin.from('blog_articles').select('published_at').eq('id', id).single();
    if (!existing?.published_at) update.published_at = new Date().toISOString();
  } else {
    update.published_at = null;
  }

  const { error } = await admin.from('blog_articles').update(update).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const admin = createAdminSupabase();
  const { error } = await admin.from('blog_articles').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
