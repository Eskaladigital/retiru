// /api/retreats/[id] — Gestión de retiro por parte del propietario (PATCH, DELETE)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendRetreatPendingReviewEmail, sendRetreatCancelledToAttendeeEmail } from '@/lib/email';

async function getOwnership(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };

  const admin = createAdminSupabase();
  const { data: orgProfile } = await admin.from('organizer_profiles').select('id').eq('user_id', user.id).single();
  if (!orgProfile) return { error: NextResponse.json({ error: 'No tienes perfil de organizador' }, { status: 403 }) };

  const { data: retreat } = await admin.from('retreats').select('id, organizer_id, status, confirmed_bookings').eq('id', id).single();
  if (!retreat || retreat.organizer_id !== orgProfile.id) {
    return { error: NextResponse.json({ error: 'Retiro no encontrado o no tienes permiso' }, { status: 404 }) };
  }

  return { user, admin, orgProfile, retreat };
}

// POST /api/retreats/[id] — Cancelar retiro (propietario)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getOwnership(id);
  if ('error' in result) return result.error;
  const { admin, retreat } = result;

  const body = await request.json();
  if (body.action !== 'cancel') {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  }

  if (retreat.status === 'cancelled') {
    return NextResponse.json({ error: 'El retiro ya está cancelado' }, { status: 400 });
  }

  const { error } = await admin.from('retreats').update({ status: 'cancelled' }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { data: retreatDetail } = await admin
      .from('retreats')
      .select('title_es, title_en, organizer_profiles!organizer_id(business_name)')
      .eq('id', id)
      .single();

    const { data: bookings } = await admin
      .from('bookings')
      .select('profiles!attendee_id(email, preferred_locale)')
      .eq('retreat_id', id)
      .in('status', ['confirmed', 'pending_payment', 'pending_confirmation']);

    const orgName = (retreatDetail?.organizer_profiles as any)?.business_name || 'Organizador';

    for (const b of bookings || []) {
      const attendee = b.profiles as any;
      if (!attendee?.email) continue;
      const loc = (attendee.preferred_locale || 'es') as 'es' | 'en';
      try {
        await sendRetreatCancelledToAttendeeEmail({
          to: attendee.email,
          locale: loc,
          eventTitle: loc === 'en' ? (retreatDetail?.title_en || retreatDetail?.title_es || 'Retreat') : (retreatDetail?.title_es || 'Retiro'),
          organizerName: orgName,
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr);
      }
    }
  } catch (emailErr) {
    console.error('Failed to send retreat cancellation emails:', emailErr);
  }

  return NextResponse.json({ success: true, status: 'cancelled' });
}

// DELETE /api/retreats/[id] — Eliminar retiro (solo si no tiene reservas confirmadas)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getOwnership(id);
  if ('error' in result) return result.error;
  const { admin, retreat } = result;

  if ((retreat.confirmed_bookings || 0) > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar un retiro con reservas confirmadas. Cancélalo primero.' },
      { status: 400 },
    );
  }

  await admin.from('retreat_categories').delete().eq('retreat_id', id);
  await admin.from('retreat_images').delete().eq('retreat_id', id);
  const { error } = await admin.from('retreats').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await getOwnership(id);
    if ('error' in result) return result.error;
    const { admin, orgProfile } = result;

    const body = await request.json();
    const {
      title_es, title_en, summary_es, summary_en,
      description_es, description_en,
      includes_es, includes_en,
      start_date, end_date,
      total_price, max_attendees, min_attendees,
      destination_id, address,
      categories, confirmation_type, languages, status,
      images,
    } = body;

    const updateData: Record<string, any> = {};
    if (title_es !== undefined) updateData.title_es = title_es;
    if (title_en !== undefined) updateData.title_en = title_en || null;
    if (summary_es !== undefined) updateData.summary_es = summary_es;
    if (summary_en !== undefined) updateData.summary_en = summary_en || null;
    if (description_es !== undefined) updateData.description_es = description_es;
    if (description_en !== undefined) updateData.description_en = description_en || null;
    if (includes_es !== undefined) updateData.includes_es = includes_es;
    if (includes_en !== undefined) updateData.includes_en = includes_en;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (total_price !== undefined) updateData.total_price = parseFloat(total_price);
    if (max_attendees !== undefined) {
      const m = parseInt(String(max_attendees), 10);
      if (Number.isNaN(m) || m < 1) {
        return NextResponse.json({ error: 'Plazas máximas no válidas' }, { status: 400 });
      }
      updateData.max_attendees = m;
    }
    if (min_attendees !== undefined) {
      let mn = min_attendees === '' || min_attendees === null
        ? 1
        : parseInt(String(min_attendees), 10);
      if (Number.isNaN(mn) || mn < 1) mn = 1;
      const maxForCheck = updateData.max_attendees !== undefined
        ? (updateData.max_attendees as number)
        : undefined;
      if (maxForCheck !== undefined && mn > maxForCheck) {
        return NextResponse.json({ error: 'El mínimo de plazas no puede ser mayor que el máximo' }, { status: 400 });
      }
      updateData.min_attendees = mn;
    }
    if (updateData.min_attendees !== undefined && updateData.max_attendees === undefined) {
      const { data: cur } = await admin.from('retreats').select('max_attendees').eq('id', id).single();
      const cap = cur?.max_attendees as number | undefined;
      if (cap != null && (updateData.min_attendees as number) > cap) {
        return NextResponse.json({ error: 'El mínimo de plazas no puede ser mayor que el máximo' }, { status: 400 });
      }
    }
    if (updateData.max_attendees !== undefined && updateData.min_attendees === undefined) {
      const { data: cur } = await admin.from('retreats').select('min_attendees').eq('id', id).single();
      const mn = (cur?.min_attendees as number | null) ?? 1;
      if ((updateData.max_attendees as number) < mn) {
        return NextResponse.json({ error: 'El máximo no puede ser menor que el mínimo de plazas' }, { status: 400 });
      }
    }
    if (destination_id !== undefined) updateData.destination_id = destination_id || null;
    if (address !== undefined) updateData.address = address || null;
    if (confirmation_type !== undefined) updateData.confirmation_type = confirmation_type;
    if (languages !== undefined) updateData.languages = languages;
    if (status === 'published' || status === 'pending_review') {
      // Confianza progresiva: si ya tiene al menos 1 retiro publicado, puede publicar directamente
      const { count: publishedCount } = await admin
        .from('retreats')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', orgProfile.id)
        .eq('status', 'published');

      const isVerifiedOrganizer = (publishedCount ?? 0) > 0;

      if (isVerifiedOrganizer) {
        updateData.status = 'published';
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.status = 'pending_review';
      }
    }

    const { error: updErr } = await admin
      .from('retreats')
      .update(updateData)
      .eq('id', id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    if (categories && Array.isArray(categories)) {
      await admin.from('retreat_categories').delete().eq('retreat_id', id);
      if (categories.length > 0) {
        await admin.from('retreat_categories').insert(
          categories.map((catId: string) => ({ retreat_id: id, category_id: catId })),
        );
      }
    }

    if (images !== undefined && Array.isArray(images)) {
      const imgRows = images
        .map((img: { url: string; is_cover: boolean }, i: number) => ({
          retreat_id: id,
          url: typeof img?.url === 'string' ? img.url.trim() : '',
          is_cover: Boolean(img?.is_cover),
          sort_order: i,
        }))
        .filter((row) => row.url.length > 0);

      const { error: delImgErr } = await admin.from('retreat_images').delete().eq('retreat_id', id);
      if (delImgErr) {
        return NextResponse.json({ error: delImgErr.message }, { status: 500 });
      }

      if (imgRows.length > 0) {
        const { error: insImgErr } = await admin.from('retreat_images').insert(imgRows);
        if (insImgErr) {
          return NextResponse.json(
            { error: `No se pudieron guardar las imágenes: ${insImgErr.message}` },
            { status: 500 },
          );
        }
      }
    }

    if (updateData.status === 'pending_review') {
      try {
        const { data: orgData } = await admin
          .from('organizer_profiles')
          .select('business_name')
          .eq('id', orgProfile.id)
          .single();

        await sendRetreatPendingReviewEmail({
          organizerName: orgData?.business_name || 'Organizador',
          eventTitle: title_es || 'Retiro sin título',
          retreatId: id,
        });
      } catch (emailErr) {
        console.error('Failed to send pending review email:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
