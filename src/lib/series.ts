// Eventos periódicos: generación y mantenimiento de ocurrencias de una serie.
// Cada ocurrencia es una fila normal de `retreats` clonada del master, con su
// propio slug, aforo y reservas. Solo la próxima ocurrencia futura lleva
// is_series_next = true (los listados públicos filtran por esa columna).
// Server-only: usa el cliente admin (service role).

import type { SupabaseClient } from '@supabase/supabase-js';

type Admin = SupabaseClient;

/** Suma días a una fecha YYYY-MM-DD sin problemas de zona horaria. */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDaysIso(startIso: string, endIso: string): number {
  const s = new Date(`${startIso}T00:00:00Z`).getTime();
  const e = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.round((e - s) / 86400000);
}

/** Campos del master que se copian tal cual a cada ocurrencia. */
const CLONE_FIELDS = [
  'organizer_id', 'title_es', 'title_en', 'summary_es', 'summary_en',
  'description_es', 'description_en', 'includes_es', 'includes_en',
  'excludes_es', 'excludes_en', 'destination_id', 'address', 'latitude',
  'longitude', 'max_attendees', 'min_attendees', 'total_price', 'currency',
  'confirmation_type', 'sla_hours', 'languages', 'cancellation_policy',
  'post_booking_form', 'schedule', 'meta_title_es', 'meta_title_en',
  'meta_description_es', 'meta_description_en', 'commission_percent',
  'duration_hours',
] as const;

async function insertOccurrence(
  admin: Admin,
  master: Record<string, unknown>,
  seriesId: string,
  startDate: string,
  spanDays: number,
): Promise<boolean> {
  const insertData: Record<string, unknown> = {};
  for (const f of CLONE_FIELDS) insertData[f] = master[f] ?? null;

  insertData.series_id = seriesId;
  insertData.start_date = startDate;
  insertData.end_date = addDaysIso(startDate, spanDays);
  insertData.status = 'published';
  insertData.published_at = new Date().toISOString();
  insertData.is_series_next = false;

  const baseSlug = String(master.slug || 'evento');
  insertData.slug = `${baseSlug}-${startDate.replace(/-/g, '')}`;

  let { data: occ, error } = await admin.from('retreats').insert(insertData).select('id').single();
  if (error && error.code === '23505') {
    // Colisión de slug (fecha regenerada): añade sufijo temporal
    insertData.slug = `${insertData.slug}-${Date.now().toString(36)}`;
    ({ data: occ, error } = await admin.from('retreats').insert(insertData).select('id').single());
  }
  if (error || !occ) {
    console.error('[series] error insertando ocurrencia', { seriesId, startDate, error: error?.message });
    return false;
  }

  const masterId = master.id as string;

  const { data: cats } = await admin.from('retreat_categories').select('category_id').eq('retreat_id', masterId);
  if (cats && cats.length > 0) {
    await admin.from('retreat_categories').insert(cats.map((c) => ({ retreat_id: occ.id, category_id: c.category_id })));
  }

  const { data: imgs } = await admin
    .from('retreat_images')
    .select('url, alt_text, sort_order, is_cover')
    .eq('retreat_id', masterId);
  if (imgs && imgs.length > 0) {
    await admin.from('retreat_images').insert(imgs.map((img) => ({ ...img, retreat_id: occ.id })));
  }

  return true;
}

/**
 * Recoloca is_series_next: true solo en la ocurrencia publicada futura más
 * próxima de la serie (o ninguna si no quedan fechas).
 */
export async function reassignSeriesNext(admin: Admin, seriesId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: next } = await admin
    .from('retreats')
    .select('id')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextId = next?.id as string | undefined;

  let clearQuery = admin
    .from('retreats')
    .update({ is_series_next: false })
    .eq('series_id', seriesId)
    .eq('is_series_next', true);
  if (nextId) clearQuery = clearQuery.neq('id', nextId);
  await clearQuery;

  if (nextId) {
    await admin.from('retreats').update({ is_series_next: true }).eq('id', nextId);
  }
}

/**
 * Mantiene el horizonte de la serie: genera ocurrencias hasta tener
 * `occurrences_ahead` fechas futuras publicadas, saltando `skip_dates`
 * (vacaciones) y respetando `series_end_date`. Después recoloca is_series_next.
 */
export async function ensureSeriesOccurrences(admin: Admin, seriesId: string): Promise<{ created: number }> {
  const today = new Date().toISOString().slice(0, 10);
  let created = 0;

  const { data: series } = await admin
    .from('retreat_series')
    .select('*')
    .eq('id', seriesId)
    .maybeSingle();
  if (!series) return { created };

  if (series.is_active && series.master_retreat_id) {
    const { data: master } = await admin
      .from('retreats')
      .select('*')
      .eq('id', series.master_retreat_id)
      .maybeSingle();

    if (master && master.status === 'published') {
      const { data: rows } = await admin
        .from('retreats')
        .select('id, start_date, status')
        .eq('series_id', seriesId)
        .order('start_date', { ascending: true });

      const all = rows || [];
      const existingDates = new Set(all.map((r) => r.start_date as string));
      const upcomingCount = all.filter((r) => r.status === 'published' && (r.start_date as string) >= today).length;
      const spanDays = diffDaysIso(master.start_date as string, master.end_date as string);
      const skip = new Set<string>((series.skip_dates as string[] | null) || []);

      let toCreate = (series.occurrences_ahead ?? 4) - upcomingCount;
      let cursor = all.length > 0 ? (all[all.length - 1].start_date as string) : (master.start_date as string);
      let guard = 0;

      while (toCreate > 0 && guard < 400) {
        guard++;
        cursor = addDaysIso(cursor, series.interval_days as number);
        if (series.series_end_date && cursor > (series.series_end_date as string)) break;
        if (cursor < today) continue; // serie atrasada: avanza hasta el presente
        if (skip.has(cursor)) continue; // fecha cerrada por vacaciones
        if (existingDates.has(cursor)) continue;
        const ok = await insertOccurrence(admin, master as Record<string, unknown>, seriesId, cursor, spanDays);
        if (!ok) break;
        created++;
        toCreate--;
      }
    }
  }

  await reassignSeriesNext(admin, seriesId);
  return { created };
}

/**
 * Nº de «retiros con reservas pagadas» para el tier de comisión, contando cada
 * serie una sola vez (si no, un evento semanal llegaría al 20 % en dos semanas).
 */
export async function countPaidRetreatUnits(admin: Admin, organizerId: string): Promise<number> {
  const { data } = await admin
    .from('retreats')
    .select('id, series_id')
    .eq('organizer_id', organizerId)
    .in('status', ['published', 'archived', 'cancelled'])
    .gt('confirmed_bookings', 0);

  const rows = data || [];
  const nonSeries = rows.filter((r) => !r.series_id).length;
  const seriesIds = new Set(rows.map((r) => r.series_id).filter(Boolean));
  return nonSeries + seriesIds.size;
}
