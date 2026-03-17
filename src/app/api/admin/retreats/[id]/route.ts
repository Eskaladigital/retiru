// PATCH /api/admin/retreats/[id] — Editar retiro (solo admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabase();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const admin = createAdminSupabase();

  const { data: existing } = await admin
    .from('retreats')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const {
    title_es, title_en, summary_es, summary_en,
    description_es, description_en,
    includes_es, includes_en, excludes_es, excludes_en,
    start_date, end_date,
    total_price, max_attendees,
    destination_id, address,
    categories, confirmation_type, languages,
    status, schedule, cancellation_policy, images,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (title_es !== undefined) updateData.title_es = title_es;
  if (title_en !== undefined) updateData.title_en = title_en || null;
  if (summary_es !== undefined) updateData.summary_es = summary_es;
  if (summary_en !== undefined) updateData.summary_en = summary_en || null;
  if (description_es !== undefined) updateData.description_es = description_es;
  if (description_en !== undefined) updateData.description_en = description_en || null;
  if (includes_es !== undefined) updateData.includes_es = includes_es;
  if (includes_en !== undefined) updateData.includes_en = includes_en;
  if (excludes_es !== undefined) updateData.excludes_es = excludes_es;
  if (excludes_en !== undefined) updateData.excludes_en = excludes_en;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;
  if (total_price !== undefined) updateData.total_price = parseFloat(total_price);
  if (max_attendees !== undefined) updateData.max_attendees = parseInt(max_attendees, 10);
  if (destination_id !== undefined) updateData.destination_id = destination_id || null;
  if (address !== undefined) updateData.address = address || null;
  if (confirmation_type !== undefined) updateData.confirmation_type = confirmation_type;
  if (languages !== undefined) updateData.languages = languages;
  if (schedule !== undefined) updateData.schedule = schedule;
  if (cancellation_policy !== undefined) updateData.cancellation_policy = cancellation_policy;

  if (status !== undefined && ['draft', 'pending_review', 'published', 'rejected', 'archived', 'cancelled'].includes(status)) {
    updateData.status = status;
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { error: updErr } = await admin
    .from('retreats')
    .update(updateData)
    .eq('id', id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  if (categories !== undefined && Array.isArray(categories)) {
    await admin.from('retreat_categories').delete().eq('retreat_id', id);
    if (categories.length > 0) {
      await admin.from('retreat_categories').insert(
        categories.map((catId: string) => ({ retreat_id: id, category_id: catId })),
      );
    }
  }

  if (images !== undefined && Array.isArray(images) && images.length > 0) {
    await admin.from('retreat_images').delete().eq('retreat_id', id);
    if (images.length > 0) {
      await admin.from('retreat_images').insert(
        images.map((img: { url: string; is_cover: boolean }, i: number) => ({
          retreat_id: id,
          url: img.url,
          is_cover: img.is_cover || false,
          sort_order: i,
        })),
      );
    }
  }

  return NextResponse.json({ success: true });
}
