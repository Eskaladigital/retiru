// PATCH /api/centers/[id] — Actualizar centro (solo propietario o admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const CENTER_TYPES_ALLOWED = new Set(['yoga', 'meditation', 'ayurveda']);

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

    // Verify ownership or admin role
    const { data: center } = await admin
      .from('centers')
      .select('id, claimed_by')
      .eq('id', id)
      .single();

    if (!center) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = center.claimed_by === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para editar este centro' }, { status: 403 });
    }

    const body = await request.json();

    // Editable fields for center owner/admin
    const ALLOWED_FIELDS = [
      'name', 'description_es', 'description_en', 'type',
      'cover_url', 'images', 'logo_url',
      'website', 'email', 'phone', 'instagram', 'facebook',
      'address', 'city', 'province', 'postal_code',
      'services_es', 'services_en',
      'schedule_summary_es', 'schedule_summary_en',
      'price_range_es', 'price_range_en',
      'google_place_id', 'google_types', 'google_maps_url', 'google_status',
      'region', 'country', 'web_valid_ia', 'quality_ia', 'search_terms', 'price_level',
    ];

    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (updateData.type !== undefined) {
      const t = typeof updateData.type === 'string' ? updateData.type : '';
      if (!CENTER_TYPES_ALLOWED.has(t)) {
        return NextResponse.json({ error: 'Tipo de centro no válido' }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error: updateErr } = await admin
      .from('centers')
      .update(updateData)
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
