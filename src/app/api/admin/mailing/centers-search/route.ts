// GET /api/admin/mailing/centers-search?q=yoga
//
// Buscador ligero de centros activos para los selectores de preview / test.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  let query = guard.ctx.sb
    .from('centers')
    .select('id, name, slug, city, province')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(20);

  if (q.length > 0) query = query.ilike('name', `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ centers: data || [] });
}
