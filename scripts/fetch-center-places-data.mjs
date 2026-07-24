#!/usr/bin/env node
/**
 * RETIRU · Sincronizar datos de Google Places en centros (Places API v1)
 *
 * Para cada centro activo con google_place_id:
 *   - Reseñas: hasta 5 en google_reviews (migración 048).
 *   - Horario: regularOpeningHours → google_opening_hours (048).
 *   - Rating: refresca avg_rating y review_count.
 *
 * NO descarga fotos de Google Places (Place Photo es caro). Las imágenes
 * las aportan los centros o se buscan fuera de la API de Google.
 *
 * Si las columnas de la migración 048 no existen aún, guarda reseñas/horario
 * en Storage centers/{id}/places-meta.json (la ficha pública ya lo lee).
 *
 * Requiere .env.local: SUPABASE_*, GOOGLE_PLACES_API_KEY
 *
 * Uso:
 *   npm run centers:places-sync            # todos los pendientes
 *   npm run centers:places-sync:dry        # simulación
 *   node scripts/fetch-center-places-data.mjs --limit 10
 *   node scripts/fetch-center-places-data.mjs --slug yoga-sala-madrid --force
 *
 * Flags:
 *   --dry-run        No escribe en BD.
 *   --limit N        Procesar solo N centros.
 *   --slug X         Solo el centro con ese slug.
 *   --force          Re-sincroniza aunque google_data_synced_at sea reciente.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('Falta .env.local'); process.exit(1); }
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!PLACES_KEY) { console.error('Falta GOOGLE_PLACES_API_KEY en .env.local'); process.exit(1); }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const argVal = (n) => {
  const i = args.indexOf(`--${n}`);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
  const eq = args.find((a) => a.startsWith(`--${n}=`));
  return eq ? eq.split('=')[1] : null;
};
const DRY_RUN = flag('dry-run');
const FORCE = flag('force');
const LIMIT = parseInt(argVal('limit') || '0', 10) || 0;
const SLUG = argVal('slug');
const BUCKET = 'centers';

// ─── Places API v1 (sin campo photos — no Place Photo) ──────────────────────

async function fetchPlaceDetails(placeId) {
  const fields = 'rating,userRatingCount,reviews,regularOpeningHours';
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`, {
    headers: { 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': fields },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Places ${res.status}: ${body.slice(0, 160)}`);
  }
  return res.json();
}

function mapReviews(reviews) {
  return (reviews || [])
    .filter((r) => r?.text?.text && r.rating)
    .slice(0, 5)
    .map((r) => ({
      author: r.authorAttribution?.displayName || 'Usuario de Google',
      rating: r.rating,
      text: String(r.text.text).slice(0, 1200),
      relative_time: r.relativePublishTimeDescription || undefined,
      publish_time: r.publishTime || undefined,
    }));
}

function mapOpeningHours(oh) {
  if (!oh) return null;
  const out = {};
  if (Array.isArray(oh.weekdayDescriptions) && oh.weekdayDescriptions.length) out.weekday_descriptions = oh.weekdayDescriptions;
  if (Array.isArray(oh.periods) && oh.periods.length) {
    out.periods = oh.periods
      .filter((p) => p?.open)
      .map((p) => ({
        open: { day: p.open.day ?? 0, hour: p.open.hour ?? 0, minute: p.open.minute ?? 0 },
        ...(p.close ? { close: { day: p.close.day ?? 0, hour: p.close.hour ?? 0, minute: p.close.minute ?? 0 } } : {}),
      }));
  }
  return Object.keys(out).length ? out : null;
}

// ─── Main ───────────────────────────────────────────────────────────────────

let query = supabase
  .from('centers')
  .select('id, name, slug, google_place_id, avg_rating, review_count')
  .eq('status', 'active')
  .not('google_place_id', 'is', null)
  .order('name');
if (SLUG) query = query.eq('slug', SLUG);
const { data: centers, error } = await query;
if (error) { console.error(error.message); process.exit(1); }

// Filtrar los ya sincronizados (columna 048 o places-meta.json en Storage) salvo --force
let alreadySynced = new Set();
if (!FORCE) {
  const { data: synced, error: syncErr } = await supabase
    .from('centers')
    .select('id')
    .not('google_data_synced_at', 'is', null);
  if (!syncErr) {
    alreadySynced = new Set((synced || []).map((r) => r.id));
  } else {
    console.log('(sin columnas 048 — usando places-meta.json en Storage como marca de sync)');
    const pageSize = 100;
    let offset = 0;
    for (;;) {
      const { data: files } = await supabase.storage.from(BUCKET).list('', { limit: pageSize, offset });
      if (!files?.length) break;
      await Promise.all(
        files
          .filter((folder) => folder.name && !folder.name.includes('.'))
          .map(async (folder) => {
            const { data: inner } = await supabase.storage.from(BUCKET).list(folder.name, { limit: 30 });
            if (inner?.some((f) => f.name === 'places-meta.json')) alreadySynced.add(folder.name);
          }),
      );
      if (files.length < pageSize) break;
      offset += pageSize;
    }
  }
}

let list = (centers || []).filter((c) => !alreadySynced.has(c.id));
if (LIMIT > 0) list = list.slice(0, LIMIT);

console.log(`\n═══ SYNC GOOGLE PLACES → CENTROS ═══`);
console.log(`Centros a procesar: ${list.length}${DRY_RUN ? ' (dry-run)' : ''} · fotos: desactivado (Place Photo no se usa)\n`);

let ok = 0; let errors = 0; let columns048 = true;

for (let i = 0; i < list.length; i++) {
  const c = list[i];
  process.stdout.write(`[${i + 1}/${list.length}] ${c.name}... `);
  try {
    const place = await fetchPlaceDetails(c.google_place_id);
    const reviews = mapReviews(place.reviews);
    const hours = mapOpeningHours(place.regularOpeningHours);

    if (DRY_RUN) {
      console.log(`OK · ${reviews.length} reseñas · ${hours ? 'horario' : 'sin horario'} · rating ${place.rating ?? '—'} (${place.userRatingCount ?? 0})`);
      ok++;
      continue;
    }

    const baseUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (typeof place.rating === 'number') baseUpdate.avg_rating = Math.round(place.rating * 10) / 10;
    if (typeof place.userRatingCount === 'number') baseUpdate.review_count = place.userRatingCount;

    const fullUpdate = {
      ...baseUpdate,
      google_reviews: reviews,
      google_opening_hours: hours,
      google_data_synced_at: new Date().toISOString(),
    };

    let { error: upErr } = await supabase.from('centers').update(fullUpdate).eq('id', c.id);
    if (upErr && /google_(reviews|opening_hours|data_synced_at)/.test(upErr.message)) {
      columns048 = false;
      ({ error: upErr } = await supabase.from('centers').update(baseUpdate).eq('id', c.id));
      if (!upErr) {
        const meta = {
          google_reviews: reviews,
          google_opening_hours: hours,
          google_data_synced_at: new Date().toISOString(),
          avg_rating: baseUpdate.avg_rating ?? null,
          review_count: baseUpdate.review_count ?? null,
        };
        const metaPath = `${c.id}/places-meta.json`;
        const { error: metaErr } = await supabase.storage
          .from(BUCKET)
          .upload(metaPath, Buffer.from(JSON.stringify(meta), 'utf8'), {
            contentType: 'application/json',
            upsert: true,
          });
        if (metaErr) process.stdout.write(`(meta: ${metaErr.message}) `);
      }
    }
    if (upErr) throw new Error(upErr.message);

    console.log(`✓ ${reviews.length} reseñas · ${hours ? 'horario' : 'sin horario'}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    errors++;
    if (String(e.message).includes('429')) {
      console.log('  Esperando 30s (rate limit)...');
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
  await new Promise((r) => setTimeout(r, 150));
}

if (!columns048) {
  console.log('\n⚠ Las columnas de la migración 048 no existen aún en BD.');
  console.log('  Rating → centers; reseñas/horario → Storage centers/{id}/places-meta.json (la ficha ya lo lee).');
  console.log('  Aplica supabase/migrations/048_centers_google_places_data.sql y relanza con --force para volcar a columnas.');
}
console.log(`\n═══ Resultado: ${ok} ok · ${errors} errores (sin fotos Google) ═══\n`);
