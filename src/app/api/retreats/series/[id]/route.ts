// POST /api/retreats/series/[id] — Gestión de una serie de evento periódico
// (propietario): cerrar una fecha sin reservas (vacaciones) o detener la serie.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ensureSeriesOccurrences, reassignSeriesNext } from '@/lib/series';

const ACTIVE_BOOKING_STATUSES = ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: seriesId } = await params;
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

    const { data: series } = await admin
      .from('retreat_series')
      .select('id, organizer_id, master_retreat_id, skip_dates, is_active')
      .eq('id', seriesId)
      .maybeSingle();
    if (!series || series.organizer_id !== orgProfile.id) {
      return NextResponse.json({ error: 'Serie no encontrada o no tienes permiso' }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === 'stop') {
      const { error } = await admin.from('retreat_series').update({ is_active: false }).eq('id', seriesId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Serie detenida: no se generarán más fechas. Las ya publicadas siguen su curso.' });
    }

    if (body.action === 'close_date') {
      const occurrenceId = String(body.occurrenceId || '');
      if (!occurrenceId) return NextResponse.json({ error: 'Falta la fecha a cerrar' }, { status: 400 });

      const { data: occ } = await admin
        .from('retreats')
        .select('id, series_id, start_date')
        .eq('id', occurrenceId)
        .maybeSingle();
      if (!occ || occ.series_id !== seriesId) {
        return NextResponse.json({ error: 'Esa fecha no pertenece a la serie' }, { status: 404 });
      }

      // Solo se pueden cerrar fechas sin reservas activas (decisión de negocio)
      const { count: activeBookings } = await admin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('retreat_id', occurrenceId)
        .in('status', ACTIVE_BOOKING_STATUSES);
      if ((activeBookings ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Esta fecha ya tiene reservas: no se puede cerrar. Gestiona los cambios con tus asistentes o celébrala.' },
          { status: 400 },
        );
      }

      // Si la fecha a cerrar es el master de la serie, pasar el rol de plantilla
      // a otra ocurrencia antes de borrarla (si no queda otra, no se puede cerrar).
      if (series.master_retreat_id === occurrenceId) {
        const { data: replacement } = await admin
          .from('retreats')
          .select('id')
          .eq('series_id', seriesId)
          .neq('id', occurrenceId)
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!replacement) {
          return NextResponse.json(
            { error: 'Es la única fecha de la serie: detén la serie o cancela el evento en su lugar.' },
            { status: 400 },
          );
        }
        await admin.from('retreat_series').update({ master_retreat_id: replacement.id }).eq('id', seriesId);
      }

      await admin.from('retreat_categories').delete().eq('retreat_id', occurrenceId);
      await admin.from('retreat_images').delete().eq('retreat_id', occurrenceId);
      const { error: delErr } = await admin.from('retreats').delete().eq('id', occurrenceId);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

      // Añadir la fecha a skip_dates para que el cron no la regenere
      const skips = new Set<string>((series.skip_dates as string[] | null) || []);
      skips.add(occ.start_date as string);
      await admin.from('retreat_series').update({ skip_dates: [...skips] }).eq('id', seriesId);

      // Reponer el horizonte (genera una fecha más al final) y recolocar la próxima
      if (series.is_active) {
        await ensureSeriesOccurrences(admin, seriesId);
      } else {
        await reassignSeriesNext(admin, seriesId);
      }

      return NextResponse.json({ success: true, message: 'Fecha cerrada. No se volverá a generar.' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
