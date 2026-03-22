// GET /api/blog/alternate-path?path=/es/blog/foo — URLs ES/EN canónicas para un mismo artículo
import { NextResponse } from 'next/server';
import { createStaticSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const match = path.match(/^\/(es|en)\/blog(?:\/([^/]+))?\/?$/);
  if (!match) {
    return NextResponse.json({ es: null as string | null, en: null as string | null });
  }

  const slug = match[2];
  if (!slug) {
    return NextResponse.json({ es: '/es/blog', en: '/en/blog' });
  }

  const supabase = createStaticSupabase();
  const { data } = await supabase
    .from('blog_articles')
    .select('slug, slug_en')
    .eq('is_published', true)
    .or(`slug.eq.${slug},slug_en.eq.${slug}`)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({
      es: `/es/blog/${slug}`,
      en: `/en/blog/${slug}`,
    });
  }

  const esPath = `/es/blog/${data.slug}`;
  const enPath = `/en/blog/${data.slug_en || data.slug}`;
  return NextResponse.json({ es: esPath, en: enPath });
}
