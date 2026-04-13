// POST /api/retreats/create — Crear retiro (cualquier usuario autenticado)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { getCommissionTier } from '@/lib/utils';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title_es, title_en, summary_es, summary_en,
      description_es, description_en,
      includes_es, includes_en,
      excludes_es, excludes_en,
      start_date, end_date,
      total_price, max_attendees, min_attendees,
      destination_id, address,
      categories, confirmation_type, languages,
      images, schedule, cancellation_policy,
    } = body;

    if (!title_es || !summary_es || !description_es || !start_date || !end_date || !total_price || !max_attendees) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const maxN = parseInt(String(max_attendees), 10);
    if (Number.isNaN(maxN) || maxN < 1) {
      return NextResponse.json({ error: 'Plazas máximas no válidas' }, { status: 400 });
    }
    let minN = min_attendees === undefined || min_attendees === '' || min_attendees === null
      ? 1
      : parseInt(String(min_attendees), 10);
    if (Number.isNaN(minN) || minN < 1) minN = 1;
    if (minN > maxN) {
      return NextResponse.json({ error: 'El mínimo de plazas no puede ser mayor que el máximo' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Verificar que el usuario tiene organizer_profile con contrato aceptado
    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id, contract_accepted_at')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile || !orgProfile.contract_accepted_at) {
      return NextResponse.json(
        { error: 'Debes aceptar el contrato de organizador antes de crear eventos. Ve a "Mis eventos" para aceptarlo.' },
        { status: 403 },
      );
    }

    const retreatSlug = slugify(title_es) + '-' + Date.now().toString(36);

    // Confianza progresiva: si el usuario ya tiene al menos 1 retiro publicado, el nuevo se publica directamente
    const { count: publishedCount } = await admin
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile!.id)
      .eq('status', 'published');

    const isVerifiedOrganizer = (publishedCount ?? 0) > 0;

    // Tiered commission: count retreats with paid bookings to determine tier
    const { count: paidRetreatsCount } = await admin
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile!.id)
      .in('status', ['published', 'archived', 'cancelled'])
      .gt('confirmed_bookings', 0);

    const commissionPercent = getCommissionTier(paidRetreatsCount ?? 0);

    const insertData: Record<string, unknown> = {
      organizer_id: orgProfile!.id,
      title_es,
      title_en: title_en || null,
      slug: retreatSlug,
      summary_es,
      summary_en: summary_en || null,
      description_es,
      description_en: description_en || null,
      includes_es: includes_es || [],
      includes_en: includes_en || [],
      excludes_es: excludes_es || [],
      excludes_en: excludes_en || [],
      start_date,
      end_date,
      total_price: parseFloat(total_price),
      commission_percent: commissionPercent,
      max_attendees: maxN,
      min_attendees: minN,
      destination_id: destination_id || null,
      address: address || null,
      confirmation_type: confirmation_type || 'automatic',
      languages: languages || ['es'],
      status: 'draft',
    };

    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      insertData.schedule = schedule;
    }

    if (cancellation_policy && typeof cancellation_policy === 'object') {
      insertData.cancellation_policy = cancellation_policy;
    }

    const { data: retreat, error: retErr } = await admin
      .from('retreats')
      .insert(insertData)
      .select('id, slug')
      .single();

    if (retErr) {
      return NextResponse.json({ error: `Error creando retiro: ${retErr.message}` }, { status: 500 });
    }

    // Asociar categorías si se proporcionaron
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const catRows = categories.map((catId: string) => ({
        retreat_id: retreat!.id,
        category_id: catId,
      }));
      await admin.from('retreat_categories').insert(catRows);
    }

    // Guardar imágenes si se proporcionaron (URLs públicas tras subida al bucket retreat-images)
    if (images && Array.isArray(images) && images.length > 0) {
      const imgRows = images
        .map((img: { url: string; is_cover: boolean }, i: number) => ({
          retreat_id: retreat!.id,
          url: typeof img?.url === 'string' ? img.url.trim() : '',
          is_cover: Boolean(img?.is_cover),
          sort_order: i,
        }))
        .filter((row) => row.url.length > 0);

      if (imgRows.length > 0) {
        const { error: imgErr } = await admin.from('retreat_images').insert(imgRows);
        if (imgErr) {
          await admin.from('retreats').delete().eq('id', retreat!.id);
          return NextResponse.json(
            { error: `El retiro no se pudo guardar: error al registrar imágenes (${imgErr.message}).` },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({
      retreat,
      isVerifiedOrganizer,
      message: 'Retiro creado como borrador.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
