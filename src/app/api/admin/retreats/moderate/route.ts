// POST /api/admin/retreats/moderate — Modera contenido de un retiro (solo admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { moderateRetreatContent } from '@/lib/content-moderation';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { retreatId } = await request.json();

  if (!retreatId) {
    return NextResponse.json({ error: 'retreatId es obligatorio' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: retreat, error: fetchErr } = await admin
    .from('retreats')
    .select('id, title_es, description_es, description_en, schedule, total_price')
    .eq('id', retreatId)
    .single();

  if (fetchErr || !retreat) {
    return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 });
  }

  const result = await moderateRetreatContent({
    title: retreat.title_es || 'Retiro',
    official_price: retreat.total_price || 0,
    description_es: retreat.description_es,
    description_en: retreat.description_en,
    schedule: retreat.schedule,
  });

  return NextResponse.json(result);
}
