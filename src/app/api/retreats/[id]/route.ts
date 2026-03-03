// PATCH /api/retreats/[id] — Actualizar retiro (propietario)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) {
      return NextResponse.json({ error: 'No tienes perfil de organizador' }, { status: 403 });
    }

    const { data: existing } = await admin
      .from('retreats')
      .select('id, organizer_id')
      .eq('id', id)
      .single();

    if (!existing || existing.organizer_id !== orgProfile.id) {
      return NextResponse.json({ error: 'Retiro no encontrado o no tienes permiso' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title_es, title_en, summary_es, summary_en,
      description_es, description_en,
      includes_es, includes_en,
      start_date, end_date,
      total_price, max_attendees,
      destination_id, address,
      categories, confirmation_type, languages, status,
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
    if (max_attendees !== undefined) updateData.max_attendees = parseInt(max_attendees, 10);
    if (destination_id !== undefined) updateData.destination_id = destination_id || null;
    if (address !== undefined) updateData.address = address || null;
    if (confirmation_type !== undefined) updateData.confirmation_type = confirmation_type;
    if (languages !== undefined) updateData.languages = languages;
    if (status === 'published') {
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();
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

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
