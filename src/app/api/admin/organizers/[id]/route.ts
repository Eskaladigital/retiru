// GET  /api/admin/organizers/[id] — Detalle de verificación del organizador
// POST /api/admin/organizers/[id] — Aprobar/rechazar paso o todo el organizador
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendOrganizerRejectedEmail, sendOrganizerVerifiedEmail } from '@/lib/email';
import { assignRole } from '@/lib/roles';

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!adminRole) return null;
  return user;
}

/** Notifica una sola vez al pasar a verified + refuerzo rol organizer (idempotente). */
async function trySendOrganizerVerifiedEmail(
  admin: { from: (table: string) => any },
  organizerId: string,
) {
  try {
    const { data: row } = await admin
      .from('organizer_profiles')
      .select('user_id, business_name, slug')
      .eq('id', organizerId)
      .maybeSingle();

    if (!row?.user_id) return;

    const { data: profile } = await admin
      .from('profiles')
      .select('email, preferred_locale')
      .eq('id', row.user_id)
      .maybeSingle();

    if (!profile?.email) return;

    const locale = (profile.preferred_locale || 'es') as 'es' | 'en';
    await assignRole(admin, row.user_id, 'organizer');
    await sendOrganizerVerifiedEmail({
      to: profile.email,
      locale,
      businessName: row.business_name || 'Organizador',
      organizerSlug: row.slug,
    });
  } catch (e) {
    console.error('Failed to send organizer verified email:', e);
  }
}

async function trySendOrganizerRejectedEmail(
  admin: { from: (table: string) => any },
  organizerId: string,
  reason: string | null | undefined,
) {
  try {
    const { data: row } = await admin
      .from('organizer_profiles')
      .select('user_id, business_name')
      .eq('id', organizerId)
      .maybeSingle();

    if (!row?.user_id) return;

    const { data: profile } = await admin
      .from('profiles')
      .select('email, preferred_locale')
      .eq('id', row.user_id)
      .maybeSingle();

    if (!profile?.email) return;

    const locale = (profile.preferred_locale || 'es') as 'es' | 'en';
    await sendOrganizerRejectedEmail({
      to: profile.email,
      locale,
      businessName: row.business_name || 'Organizador',
      rejectionReason: reason?.trim() || undefined,
    });
  } catch (e) {
    console.error('Failed to send organizer rejected email:', e);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const admin = createAdminSupabase();

  const { data: org } = await admin
    .from('organizer_profiles')
    .select(`
      id, user_id, business_name, slug, status, contract_accepted_at,
      tax_id, tax_name, tax_address, iban, id_document_url,
      verified_at, verified_by, rejection_reason, created_at,
      profiles!user_id(id, email, full_name)
    `)
    .eq('id', id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organizador no encontrado' }, { status: 404 });
  }

  const { data: steps } = await admin
    .from('organizer_verification_steps')
    .select('id, step, status, file_url, submitted_at, reviewed_at, reviewed_by, notes, data, created_at')
    .eq('organizer_id', id)
    .order('created_at');

  return NextResponse.json({ organizer: org, steps: steps || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { action, stepId, notes } = await request.json();

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { data: org } = await admin
    .from('organizer_profiles')
    .select('id, status, user_id, business_name, slug')
    .eq('id', id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organizador no encontrado' }, { status: 404 });
  }

  if (action === 'approve_step' || action === 'reject_step') {
    if (!stepId) {
      return NextResponse.json({ error: 'stepId requerido' }, { status: 400 });
    }

    const newStatus = action === 'approve_step' ? 'approved' : 'rejected';

    const { error: stepErr } = await admin
      .from('organizer_verification_steps')
      .update({
        status: newStatus,
        reviewed_at: now,
        reviewed_by: user.id,
        notes: notes || null,
      })
      .eq('id', stepId)
      .eq('organizer_id', id);

    if (stepErr) {
      return NextResponse.json({ error: stepErr.message }, { status: 500 });
    }

    if (action === 'approve_step') {
      const { data: allSteps } = await admin
        .from('organizer_verification_steps')
        .select('status')
        .eq('organizer_id', id);

      const allApproved = allSteps && allSteps.length > 0 && allSteps.every((s: { status: string }) => s.status === 'approved');

      if (allApproved && org.status !== 'verified') {
        await admin.from('organizer_profiles').update({
          status: 'verified',
          verified_at: now,
          verified_by: user.id,
        }).eq('id', id);

        await trySendOrganizerVerifiedEmail(admin, id);

        return NextResponse.json({
          success: true,
          step_status: newStatus,
          organizer_verified: true,
          message: 'Paso aprobado. Todos los pasos completados: organizador verificado automáticamente.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      step_status: newStatus,
      organizer_verified: false,
      message: action === 'approve_step' ? 'Paso aprobado.' : 'Paso rechazado.',
    });
  }

  if (action === 'verify') {
    const wasAlreadyVerified = org.status === 'verified';

    await admin.from('organizer_verification_steps')
      .update({ status: 'approved', reviewed_at: now, reviewed_by: user.id })
      .eq('organizer_id', id);

    await admin.from('organizer_profiles').update({
      status: 'verified',
      verified_at: now,
      verified_by: user.id,
    }).eq('id', id);

    if (!wasAlreadyVerified) {
      await trySendOrganizerVerifiedEmail(admin, id);
    }

    return NextResponse.json({ success: true, message: 'Organizador verificado.' });
  }

  if (action === 'reject') {
    const prevStatus = org.status;

    await admin.from('organizer_profiles').update({
      status: 'rejected',
      rejection_reason: notes || null,
    }).eq('id', id);

    if (prevStatus !== 'rejected') {
      await trySendOrganizerRejectedEmail(admin, id, notes);
    }

    return NextResponse.json({ success: true, message: 'Organizador rechazado.' });
  }

  if (action === 'suspend') {
    await admin.from('organizer_profiles').update({
      status: 'suspended',
      rejection_reason: notes || null,
    }).eq('id', id);

    return NextResponse.json({ success: true, message: 'Organizador suspendido.' });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}
