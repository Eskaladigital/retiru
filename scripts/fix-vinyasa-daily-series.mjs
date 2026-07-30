#!/usr/bin/env node
/**
 * Convierte el evento Vinyasa Flow (Rodalquilar) en serie diaria de un día
 * con duración en horas. Datos operativos — no es migración de esquema.
 *
 * Uso: node scripts/fix-vinyasa-daily-series.mjs [--dry-run]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('Falta .env.local');
  process.exit(1);
}
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dryRun = process.argv.includes('--dry-run');
const SLUG = 'vinyasa-flow-yoga-clases-al-atardecer-hotel-los-patios-rodalquilar-mrzdxvl0';
const SERIES_END = '2027-12-31';
const INTERVAL_DAYS = 1;
const OCCURRENCES_AHEAD = 7;
const DURATION_HOURS = 1.5;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
const sb = createClient(url, key);

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const CLONE_FIELDS = [
  'organizer_id', 'title_es', 'title_en', 'summary_es', 'summary_en',
  'description_es', 'description_en', 'includes_es', 'includes_en',
  'excludes_es', 'excludes_en', 'destination_id', 'address', 'latitude',
  'longitude', 'max_attendees', 'min_attendees', 'total_price', 'currency',
  'confirmation_type', 'sla_hours', 'languages', 'cancellation_policy',
  'post_booking_form', 'schedule', 'meta_title_es', 'meta_title_en',
  'meta_description_es', 'meta_description_en', 'commission_percent',
  'duration_hours',
];

async function insertOccurrence(master, seriesId, startDate) {
  const insertData = {};
  for (const f of CLONE_FIELDS) insertData[f] = master[f] ?? null;
  insertData.series_id = seriesId;
  insertData.start_date = startDate;
  insertData.end_date = startDate;
  insertData.status = 'published';
  insertData.published_at = new Date().toISOString();
  insertData.is_series_next = false;
  insertData.slug = `${master.slug}-${startDate.replace(/-/g, '')}`;

  let { data: occ, error } = await sb.from('retreats').insert(insertData).select('id').single();
  if (error && error.code === '23505') {
    insertData.slug = `${insertData.slug}-${Date.now().toString(36)}`;
    ({ data: occ, error } = await sb.from('retreats').insert(insertData).select('id').single());
  }
  if (error || !occ) {
    console.error('Error insertando ocurrencia', startDate, error?.message);
    return false;
  }

  const { data: cats } = await sb.from('retreat_categories').select('category_id').eq('retreat_id', master.id);
  if (cats?.length) {
    await sb.from('retreat_categories').insert(cats.map((c) => ({ retreat_id: occ.id, category_id: c.category_id })));
  }
  const { data: imgs } = await sb
    .from('retreat_images')
    .select('url, alt_text, sort_order, is_cover')
    .eq('retreat_id', master.id);
  if (imgs?.length) {
    await sb.from('retreat_images').insert(imgs.map((img) => ({ ...img, retreat_id: occ.id })));
  }
  return true;
}

async function ensureOccurrences(seriesId, master) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await sb
    .from('retreats')
    .select('id, start_date, status')
    .eq('series_id', seriesId)
    .order('start_date', { ascending: true });
  const all = rows || [];
  const existingDates = new Set(all.map((r) => r.start_date));
  let upcomingCount = all.filter((r) => r.status === 'published' && r.start_date >= today).length;
  let toCreate = OCCURRENCES_AHEAD - upcomingCount;
  let cursor = all.length > 0 ? all[all.length - 1].start_date : master.start_date;
  let created = 0;
  let guard = 0;
  while (toCreate > 0 && guard < 400) {
    guard++;
    cursor = addDaysIso(cursor, INTERVAL_DAYS);
    if (cursor > SERIES_END) break;
    if (cursor < today) continue;
    if (existingDates.has(cursor)) continue;
    if (dryRun) {
      console.log(`  [dry-run] crearía ocurrencia ${cursor}`);
      created++;
      toCreate--;
      existingDates.add(cursor);
      continue;
    }
    const ok = await insertOccurrence(master, seriesId, cursor);
    if (!ok) break;
    created++;
    toCreate--;
    existingDates.add(cursor);
  }

  // is_series_next solo en la próxima futura
  const { data: next } = await sb
    .from('retreats')
    .select('id')
    .eq('series_id', seriesId)
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!dryRun) {
    await sb.from('retreats').update({ is_series_next: false }).eq('series_id', seriesId);
    if (next?.id) {
      await sb.from('retreats').update({ is_series_next: true }).eq('id', next.id);
    }
  }
  return created;
}

const { data: retreat, error } = await sb
  .from('retreats')
  .select('*')
  .eq('slug', SLUG)
  .maybeSingle();

if (error || !retreat) {
  console.error('Retiro no encontrado:', error?.message || SLUG);
  process.exit(1);
}

console.log('Evento:', retreat.title_es);
console.log('Antes:', {
  start: retreat.start_date,
  end: retreat.end_date,
  duration_days: retreat.duration_days,
  duration_hours: retreat.duration_hours,
  series_id: retreat.series_id,
});

if (retreat.series_id) {
  console.log('Ya tiene series_id; solo se asegura horizonte de ocurrencias.');
  const { data: series } = await sb.from('retreat_series').select('*').eq('id', retreat.series_id).single();
  if (!series) {
    console.error('Serie huérfana');
    process.exit(1);
  }
  // Asegurar master same-day + hours
  if (!dryRun) {
    await sb.from('retreats').update({
      end_date: retreat.start_date,
      duration_hours: DURATION_HOURS,
    }).eq('id', retreat.id);
    await sb.from('retreat_series').update({
      interval_days: INTERVAL_DAYS,
      occurrences_ahead: OCCURRENCES_AHEAD,
      series_end_date: SERIES_END,
      is_active: true,
    }).eq('id', series.id);
  }
  const master = { ...retreat, end_date: retreat.start_date, duration_hours: DURATION_HOURS };
  const created = await ensureOccurrences(series.id, master);
  console.log(`Ocurrencias nuevas: ${created}`);
  process.exit(0);
}

if (dryRun) {
  console.log('[dry-run] actualizaría master a same-day + duration_hours=', DURATION_HOURS);
  console.log('[dry-run] crearía retreat_series interval=', INTERVAL_DAYS, 'end=', SERIES_END, 'ahead=', OCCURRENCES_AHEAD);
  const master = { ...retreat, end_date: retreat.start_date, duration_hours: DURATION_HOURS };
  await ensureOccurrences('dry-run-series', master);
  process.exit(0);
}

const { error: updErr } = await sb
  .from('retreats')
  .update({
    end_date: retreat.start_date,
    duration_hours: DURATION_HOURS,
  })
  .eq('id', retreat.id);
if (updErr) {
  console.error('Error actualizando master:', updErr.message);
  process.exit(1);
}

const { data: series, error: serErr } = await sb
  .from('retreat_series')
  .insert({
    organizer_id: retreat.organizer_id,
    master_retreat_id: retreat.id,
    interval_days: INTERVAL_DAYS,
    occurrences_ahead: OCCURRENCES_AHEAD,
    series_end_date: SERIES_END,
    is_active: true,
  })
  .select('id')
  .single();
if (serErr || !series) {
  console.error('Error creando serie:', serErr?.message);
  process.exit(1);
}

const { error: linkErr } = await sb
  .from('retreats')
  .update({ series_id: series.id })
  .eq('id', retreat.id);
if (linkErr) {
  console.error('Error vinculando series_id:', linkErr.message);
  process.exit(1);
}

const { data: master } = await sb.from('retreats').select('*').eq('id', retreat.id).single();
const created = await ensureOccurrences(series.id, master);

console.log('OK');
console.log('series_id:', series.id);
console.log('master:', master.start_date, '→', master.end_date, 'hours=', master.duration_hours, 'days=', master.duration_days);
console.log('ocurrencias nuevas:', created);

const { data: occs } = await sb
  .from('retreats')
  .select('slug, start_date, end_date, duration_days, duration_hours, is_series_next, status')
  .eq('series_id', series.id)
  .order('start_date');
console.log('Fechas de la serie:');
for (const o of occs || []) {
  console.log(`  ${o.start_date} days=${o.duration_days} h=${o.duration_hours} next=${o.is_series_next} [${o.status}]`);
}
