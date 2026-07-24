// POST /api/retreats/series — Convertir un evento existente en periódico
// (propietario): crea la serie con el evento como master. Si el evento ya está
// publicado, genera las ocurrencias inmediatamente; si es borrador, se
// generarán al publicarse.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ensureSeriesOccurrences } from '@/lib/series';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!orgProfile) return NextResponse.json({ error: 'No tienes perfil de organizador' }, { status: 403 });

    const body = await request.json();
    const retreatId = String(body.retreatId || '');
    if (!retreatId) return NextResponse.json({ error: 'Falta el evento' }, { status: 400 });

    const { data: retreat } = await admin
      .from('retreats')
      .select('id, organizer_id, status, series_id, start_date, end_date')
      .eq('id', retreatId)
      .maybeSingle();
    if (!retreat || retreat.organizer_id !== orgProfile.id) {
      return NextResponse.json({ error: 'Evento no encontrado o no tienes permiso' }, { status: 404 });
    }
    if (retreat.series_id) {
      return NextResponse.json({ error: 'Este evento ya forma parte de una serie' }, { status: 400 });
    }
    if (['cancelled', 'archived'].includes(retreat.status as string)) {
      return NextResponse.json({ error: 'No se puede convertir en periódico un evento cancelado o archivado' }, { status: 400 });
    }

    const intervalDays = parseInt(String(body.interval_days), 10);
    if (Number.isNaN(intervalDays) || intervalDays < 1 || intervalDays > 90) {
      return NextResponse.json({ error: 'La repetición debe ser entre cada 1 y cada 90 días' }, { status: 400 });
    }
    const spanDays = Math.round(
      (new Date(`${retreat.end_date}T00:00:00Z`).getTime() - new Date(`${retreat.start_date}T00:00:00Z`).getTime()) / 86400000,
    );
    if (intervalDays <= spanDays) {
      return NextResponse.json({ error: 'La repetición debe ser mayor que la duración del evento para que las fechas no se solapen' }, { status: 400 });
    }

    let occurrencesAhead = 4;
    const ahead = parseInt(String(body.occurrences_ahead), 10);
    if (!Number.isNaN(ahead) && ahead >= 1 && ahead <= 8) occurrencesAhead = ahead;

    let seriesEndDate: string | null = null;
    if (body.series_end_date) {
      if (String(body.series_end_date) <= (retreat.start_date as string)) {
        return NextResponse.json({ error: 'El fin de la serie debe ser posterior a la fecha del evento' }, { status: 400 });
      }
      seriesEndDate = String(body.series_end_date);
    }

    const { data: series, error: serErr } = await admin
      .from('retreat_series')
      .insert({
        organizer_id: orgProfile.id,
        master_retreat_id: retreat.id,
        interval_days: intervalDays,
        occurrences_ahead: occurrencesAhead,
        series_end_date: seriesEndDate,
      })
      .select('id')
      .single();
    if (serErr || !series) {
      return NextResponse.json({ error: serErr?.message || 'Error creando la serie' }, { status: 500 });
    }

    await admin.from('retreats').update({ series_id: series.id }).eq('id', retreat.id);

    // Si el evento ya está publicado, generar las ocurrencias ahora;
    // si no, se generarán automáticamente al publicarse.
    let created = 0;
    if (retreat.status === 'published') {
      ({ created } = await ensureSeriesOccurrences(admin, series.id));
    }

    return NextResponse.json({
      success: true,
      seriesId: series.id,
      occurrencesCreated: created,
      message: retreat.status === 'published'
        ? `Evento convertido en periódico: ${created} fechas nuevas publicadas.`
        : 'Evento convertido en periódico: las fechas se publicarán cuando el evento se apruebe y publique.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
