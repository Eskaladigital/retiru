// POST /api/admin/retreats — Aprobar o rechazar retiro (solo admin)
// GET  /api/admin/retreats — Listar retiros con filtros (solo admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

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

  const { retreatId, action, rejectionReason } = await request.json();

  const validActions = ['approve', 'reject', 'cancel', 'archive', 'delete'];
  if (!retreatId || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `retreatId y action (${validActions.join('|')}) son obligatorios` },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();

  const { data: retreat } = await admin
    .from('retreats')
    .select('id, status, organizer_id, confirmed_bookings')
    .eq('id', retreatId)
    .single();

  if (!retreat) {
    return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 });
  }

  // approve / reject — solo para pending_review
  if (action === 'approve' || action === 'reject') {
    if (retreat.status !== 'pending_review') {
      return NextResponse.json(
        { error: `El retiro está en estado "${retreat.status}", solo se pueden revisar los que están en pending_review` },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'published' : 'rejected';

    const updateData: Record<string, any> = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: now,
    };
    if (action === 'approve') {
      updateData.published_at = now;
    }
    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateErr } = await admin
      .from('retreats')
      .update(updateData)
      .eq('id', retreatId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'approve'
        ? 'Retiro aprobado y publicado.'
        : 'Retiro rechazado.',
    });
  }

  // cancel — para published/draft
  if (action === 'cancel') {
    const { error: updateErr } = await admin
      .from('retreats')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', retreatId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: 'cancelled', message: 'Retiro cancelado.' });
  }

  // archive — ocultar sin eliminar
  if (action === 'archive') {
    const { error: updateErr } = await admin
      .from('retreats')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', retreatId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: 'archived', message: 'Retiro archivado.' });
  }

  // delete — solo si no hay reservas confirmadas
  if (action === 'delete') {
    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreatId)
      .in('status', ['pending_payment', 'pending_confirmation', 'confirmed', 'completed']);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar: tiene reservas activas. Usa "Cancelar" para ocultarlo del público.' },
        { status: 409 },
      );
    }

    const { error: deleteErr } = await admin
      .from('retreats')
      .delete()
      .eq('id', retreatId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Retiro eliminado.' });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const admin = createAdminSupabase();

  let query = admin
    .from('retreats')
    .select(`
      id, title_es, slug, status, total_price, max_attendees, confirmed_bookings,
      start_date, end_date, created_at, published_at, reviewed_at, rejection_reason,
      organizer_profiles!organizer_id(id, business_name, slug, user_id,
        profiles!user_id(id, full_name, email)
      )
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: retreats, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ retreats });
}
