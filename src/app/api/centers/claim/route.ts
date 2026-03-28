// POST /api/centers/claim — Reclamar un centro
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendNewClaimPendingEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { centerId, notes } = await request.json();
    if (!centerId) {
      return NextResponse.json({ error: 'centerId es obligatorio' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: center } = await admin
      .from('centers')
      .select('id, name, email, claimed_by')
      .eq('id', centerId)
      .single();

    if (!center) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });
    }
    if (center.claimed_by) {
      return NextResponse.json({ error: 'Este centro ya ha sido reclamado' }, { status: 409 });
    }

    const { data: existing } = await admin
      .from('center_claims')
      .select('id, status')
      .eq('center_id', centerId)
      .eq('user_id', user.id)
      .maybeSingle();

    const userEmail = (user.email || '').toLowerCase().trim();
    const centerEmail = (center.email || '').toLowerCase().trim();
    // Solo auto-aprueba si ambos emails existen y son iguales. Si no coinciden → siempre pending (nunca rejected aquí).
    const emailMatch = !!(userEmail && centerEmail && userEmail === centerEmail);

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Ya tienes una solicitud pendiente para este centro' }, { status: 409 });
      }
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'Ya eres el propietario de este centro' }, { status: 409 });
      }
      if (existing.status === 'rejected') {
        const now = new Date().toISOString();
        const { data: claim, error: updErr } = await admin
          .from('center_claims')
          .update({
            status: emailMatch ? 'approved' : 'pending',
            method: emailMatch ? 'email_match' : 'manual_request',
            notes: notes || null,
            admin_notes: null,
            reviewed_by: null,
            reviewed_at: emailMatch ? now : null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updErr) throw updErr;

        if (emailMatch) {
          await admin
            .from('centers')
            .update({ claimed_by: user.id, updated_at: now })
            .eq('id', centerId);
        } else {
          try {
            const { data: profile } = await admin
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();

            await sendNewClaimPendingEmail({
              userName: profile?.full_name || 'Usuario',
              userEmail: user.email || '',
              centerName: center.name || 'Centro',
              centerId,
            });
          } catch (emailErr) {
            console.error('Failed to send claim pending email:', emailErr);
          }
        }

        return NextResponse.json({
          claim,
          autoApproved: emailMatch,
          message: emailMatch
            ? '¡Centro reclamado! Tu email coincide con el del centro.'
            : 'Solicitud reenviada. Un administrador la revisará pronto.',
        });
      }
    }

    const claimData = {
      center_id: centerId,
      user_id: user.id,
      status: emailMatch ? 'approved' : 'pending',
      method: emailMatch ? 'email_match' : 'manual_request',
      notes: notes || null,
      ...(emailMatch ? { reviewed_at: new Date().toISOString() } : {}),
    };

    const { data: claim, error: claimErr } = await admin
      .from('center_claims')
      .insert(claimData)
      .select()
      .single();

    if (claimErr) {
      if (claimErr.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una solicitud para este centro' }, { status: 409 });
      }
      throw claimErr;
    }

    if (emailMatch) {
      await admin
        .from('centers')
        .update({ claimed_by: user.id, updated_at: new Date().toISOString() })
        .eq('id', centerId);
    } else {
      try {
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await sendNewClaimPendingEmail({
          userName: profile?.full_name || 'Usuario',
          userEmail: user.email || '',
          centerName: center.name || 'Centro',
          centerId,
        });
      } catch (emailErr) {
        console.error('Failed to send claim pending email:', emailErr);
      }
    }

    return NextResponse.json({
      claim,
      autoApproved: emailMatch,
      message: emailMatch
        ? '¡Centro reclamado! Tu email coincide con el del centro.'
        : 'Solicitud enviada. Un administrador la revisará pronto.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
