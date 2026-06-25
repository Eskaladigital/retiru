// POST /api/admin/blog/generate-cover-image — Portada IA para artículo de blog (solo admin)
import { NextResponse } from 'next/server';
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server';
import { generateBlogCoverImage, type BlogCoverBriefInput } from '@/lib/openai/blog-cover-image';
import { uploadCoverAsWebp } from '@/lib/openai/cover-image-upload';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado', status: 401 as const };
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!adminRole) return { error: 'Solo administradores', status: 403 as const };
  return { user };
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'La generación de portadas con IA no está activa. Falta OPENAI_API_KEY en el servidor.' },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const title_es = str(body.title_es);
    const excerpt_es = str(body.excerpt_es);
    const content_es = str(body.content_es).slice(0, 35000);

    if (!title_es.trim() || !excerpt_es.trim() || !content_es.trim()) {
      return NextResponse.json(
        { error: 'Hacen falta título, extracto y contenido del artículo para generar la portada.' },
        { status: 400 },
      );
    }

    const admin = createAdminSupabase();

    let category_label = str(body.category_label).trim() || undefined;
    const category_id = str(body.category_id).trim() || undefined;
    if (!category_label && category_id) {
      const { data: cat } = await admin
        .from('blog_categories')
        .select('name_es')
        .eq('id', category_id)
        .maybeSingle();
      if (cat?.name_es) category_label = cat.name_es as string;
    }

    const brief: BlogCoverBriefInput = {
      title_es,
      excerpt_es,
      content_es,
      title_en: str(body.title_en).trim() || undefined,
      excerpt_en: str(body.excerpt_en).trim() || undefined,
      content_en: str(body.content_en).trim().slice(0, 20000) || undefined,
      category_label,
      published_at: str(body.published_at).trim() || undefined,
    };

    const { buffer } = await generateBlogCoverImage(openaiKey, brief);

    const suffix = str(body.article_id).replace(/-/g, '').slice(0, 12) || 'new';
    const path = `blog/ai-cover-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
    const publicUrl = await uploadCoverAsWebp(admin, 'retreat-images', path, buffer);

    return NextResponse.json({ publicUrl });
  } catch (e) {
    console.error('[admin/blog/generate-cover-image]', e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
