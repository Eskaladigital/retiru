// GET  /api/retreats/series/[id] — Fechas futuras reservables de la serie
// (público; si hay sesión, marca las que el usuario ya tiene reservadas).
// POST /api/retreats/series/[id] — Gestión de una serie de evento periódico
// (propietario): cerrar una fecha sin reservas (vacaciones) o detener la serie.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ensureSeriesOccurrences, reassignSeriesNext, addDaysIso, SERIES_BOOKING_HORIZON_DAYS } from '@/lib/series';

const ACTIVE_BOOKING_STATUSES = ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: seriesId } = await params;
    const admin = createAdminSupabase();

    const { data: series } = await admin
      .from('retreat_series')
      .select('id, interval_days')
      .eq('id', seriesId)
      .maybeSingle();
    if (!series) return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });

    const today = new Date().toISOString().slice(0, 10);
    const { data: occurrences } = await admin
      .from('retreats')
      .select('id, slug, start_date, max_attendees, confirmed_bookings, total_price, currency')
      .eq('series_id', seriesId)
      .eq('status', 'published')
      .gte('start_date', today)
      .lte('start_date', addDaysIso(today, SERIES_BOOKING_HORIZON_DAYS))
      .order('start_date', { ascending: true });

    const occs = occurrences || [];
    const occIds = occs.map((o: { id: string }) => o.id);

    // Reservas sin pago por fecha (available_spots solo resta confirmadas)
    const holdCount = new Map<string, number>();
    if (occIds.length > 0) {
      const { data: holds } = await admin
        .from('bookings')
        .select('retreat_id')
        .in('retreat_id', occIds)
        .eq('status', 'reserved_no_payment');
      for (const h of holds || []) {
        holdCount.set(h.retreat_id as string, (holdCount.get(h.retreat_id as string) || 0) + 1);
      }
    }

    // Fechas ya reservadas por el usuario (si hay sesión)
    const bookedByMe = new Set<string>();
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && occIds.length > 0) {
      const { data: mine } = await admin
        .from('bookings')
        .select('retreat_id')
        .eq('attendee_id', user.id)
        .in('retreat_id', occIds)
        .in('status', ACTIVE_BOOKING_STATUSES);
      for (const b of mine || []) bookedByMe.add(b.retreat_id as string);
    }

    return NextResponse.json({
      seriesId,
      intervalDays: series.interval_days,
      dates: occs.map((o: { id: string; slug: string; start_date: string; max_attendees: number | null; confirmed_bookings: number | null; total_price: number; currency: string }) => {
        const enrolled = (o.confirmed_bookings ?? 0) + (holdCount.get(o.id) || 0);
        const spotsLeft = Math.max(0, (o.max_attendees ?? 0) - enrolled);
        return {
          id: o.id,
          slug: o.slug,
          start_date: o.start_date,
          spots_left: spotsLeft,
          booked_by_me: bookedByMe.has(o.id),
          total_price: o.total_price,
          currency: o.currency,
        };
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
