// POST /api/retreats/create — Crear retiro (cualquier usuario autenticado)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { getCommissionTier } from '@/lib/utils';
import { countPaidRetreatUnits } from '@/lib/series';

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
      total_price, max_attendees, min_attendees, duration_hours,
      destination_id, address,
      categories, confirmation_type, languages,
      images, schedule, cancellation_policy,
      is_recurring, recurrence_interval_days, recurrence_occurrences_ahead, recurrence_end_date,
    } = body;

    if (!title_es || !summary_es || !description_es || !start_date || !end_date || !total_price || !max_attendees) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (end_date < start_date) {
      return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la de inicio' }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (start_date < today) {
      return NextResponse.json({ error: 'La fecha de inicio no puede ser anterior a hoy' }, { status: 400 });
    }

    // Eventos de un día: se pide la duración en horas
    const isSameDay = start_date === end_date;
    let durationHours: number | null = null;
    if (isSameDay) {
      durationHours = parseFloat(String(duration_hours));
      if (Number.isNaN(durationHours) || durationHours <= 0 || durationHours > 24) {
        return NextResponse.json({ error: 'Indica la duración en horas del evento (entre 1 y 24)' }, { status: 400 });
      }
    }

    // Evento periódico: validar recurrencia
    const spanDays = Math.round(
      (new Date(`${end_date}T00:00:00Z`).getTime() - new Date(`${start_date}T00:00:00Z`).getTime()) / 86400000,
    );
    let intervalDays = 0;
    let occurrencesAhead = 4;
    let seriesEndDate: string | null = null;
    if (is_recurring) {
      intervalDays = parseInt(String(recurrence_interval_days), 10);
      if (Number.isNaN(intervalDays) || intervalDays < 1 || intervalDays > 90) {
        return NextResponse.json({ error: 'La repetición debe ser entre cada 1 y cada 90 días' }, { status: 400 });
      }
      if (intervalDays <= spanDays) {
        return NextResponse.json({ error: 'La repetición debe ser mayor que la duración del evento para que las fechas no se solapen' }, { status: 400 });
      }
      const ahead = parseInt(String(recurrence_occurrences_ahead), 10);
      if (!Number.isNaN(ahead) && ahead >= 1 && ahead <= 8) occurrencesAhead = ahead;
      if (recurrence_end_date) {
        if (String(recurrence_end_date) <= start_date) {
          return NextResponse.json({ error: 'El fin de la serie debe ser posterior a la primera fecha' }, { status: 400 });
        }
        seriesEndDate = String(recurrence_end_date);
      }
    }

    const priceN = parseFloat(String(total_price));
    if (Number.isNaN(priceN) || priceN <= 0) {
      return NextResponse.json({ error: 'El PVP por persona debe ser mayor que 0 €' }, { status: 400 });
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

    // Tiered commission: cada serie de evento periódico cuenta como 1 retiro
    const paidRetreatsCount = await countPaidRetreatUnits(admin, orgProfile!.id);
    const commissionPercent = getCommissionTier(paidRetreatsCount);

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
      duration_hours: durationHours,
      total_price: priceN,
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

    // Evento periódico: crear la serie y vincular el master.
    // Las ocurrencias se generan cuando el master se publica.
    if (is_recurring && intervalDays > 0) {
      const { data: series, error: serErr } = await admin
        .from('retreat_series')
        .insert({
          organizer_id: orgProfile!.id,
          master_retreat_id: retreat!.id,
          interval_days: intervalDays,
          occurrences_ahead: occurrencesAhead,
          series_end_date: seriesEndDate,
        })
        .select('id')
        .single();

      if (serErr || !series) {
        console.error('[retreats/create] error creando serie', serErr?.message);
      } else {
        await admin.from('retreats').update({ series_id: series.id }).eq('id', retreat!.id);
      }
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
