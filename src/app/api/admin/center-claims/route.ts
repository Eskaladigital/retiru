// POST /api/admin/center-claims — Aprobar o rechazar un claim (solo admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const { claimId, action, adminNotes } = await request.json();

  if (!claimId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'claimId y action (approve|reject) son obligatorios' },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();

  const { data: claim } = await admin
    .from('center_claims')
    .select('id, center_id, user_id, status')
    .eq('id', claimId)
    .single();

  if (!claim) {
    return NextResponse.json({ error: 'Claim no encontrado' }, { status: 404 });
  }
  if (claim.status !== 'pending') {
    return NextResponse.json({ error: `Claim ya está ${claim.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { error: updateErr } = await admin
    .from('center_claims')
    .update({
      status: newStatus,
      admin_notes: adminNotes || null,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq('id', claimId);

  if (updateErr) throw updateErr;

  if (action === 'approve') {
    await admin
      .from('centers')
      .update({ claimed_by: claim.user_id, updated_at: now })
      .eq('id', claim.center_id);
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    message: action === 'approve'
      ? 'Claim aprobado. El centro ha sido asignado al usuario.'
      : 'Claim rechazado.',
  });
}

// GET /api/admin/center-claims — Listar claims (solo admin)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const admin = createAdminSupabase();

  const { data: claims, error } = await admin
    .from('center_claims')
    .select(`
      id, center_id, user_id, status, method, notes, admin_notes,
      reviewed_by, created_at, reviewed_at,
      centers!center_id(id, name, slug, email),
      profiles!user_id(id, full_name)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claims });
}
