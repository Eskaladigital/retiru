// POST /api/admin/center-claims — Aprobar o rechazar un claim (solo admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from '@/lib/email';
import { assignRole } from '@/lib/roles';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!adminRole) {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const { claimId, action, adminNotes } = await request.json();

  if (!claimId || !['approve', 'reject', 'revert_to_pending'].includes(action)) {
    return NextResponse.json(
      { error: 'claimId y action (approve|reject|revert_to_pending) son obligatorios' },
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

  const now = new Date().toISOString();
  let newStatus: string;
  let message: string;

  if (action === 'approve') {
    if (claim.status !== 'pending') {
      return NextResponse.json({ error: `Solo se puede aprobar un claim pendiente (actual: ${claim.status})` }, { status: 409 });
    }
    newStatus = 'approved';
    message = 'Claim aprobado. El centro ha sido asignado al usuario.';
  } else if (action === 'reject') {
    if (claim.status === 'rejected') {
      return NextResponse.json({ error: 'Claim ya está rechazado' }, { status: 409 });
    }
    newStatus = 'rejected';
    message = 'Claim rechazado.';
  } else {
    // revert_to_pending
    if (claim.status !== 'approved') {
      return NextResponse.json({ error: `Solo se puede desaprobar un claim aprobado (actual: ${claim.status})` }, { status: 409 });
    }
    newStatus = 'pending';
    message = 'Claim revertido a pendiente. El centro ya no está asignado al usuario.';
  }

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
    await assignRole(admin, claim.user_id, 'center');
  } else if (claim.status === 'approved' && (action === 'reject' || action === 'revert_to_pending')) {
    await admin
      .from('centers')
      .update({ claimed_by: null, updated_at: now })
      .eq('id', claim.center_id);
  }

  // Enviar email al usuario sobre el resultado del claim
  if (action === 'approve' || action === 'reject') {
    try {
      const { data: claimUser } = await admin
        .from('profiles')
        .select('email, preferred_locale')
        .eq('id', claim.user_id)
        .single();

      const { data: center } = await admin
        .from('centers')
        .select('name, slug')
        .eq('id', claim.center_id)
        .single();

      if (claimUser?.email && center) {
        const locale = (claimUser.preferred_locale || 'es') as 'es' | 'en';
        if (action === 'approve') {
          await sendClaimApprovedEmail({
            to: claimUser.email,
            locale,
            centerName: center.name,
            centerSlug: center.slug,
          });
        } else {
          await sendClaimRejectedEmail({
            to: claimUser.email,
            locale,
            centerName: center.name,
            adminNotes: adminNotes || undefined,
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send claim notification email:', emailErr);
    }
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    message,
  });
}

// GET /api/admin/center-claims — Listar claims (solo admin)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!adminRole) {
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
