#!/usr/bin/env node
/**
 * Una ficha: gpt-5.6-terra + web_search. Traducción EN: gpt-4o-mini.
 *
 *   node scripts/generate-one-description.mjs "Nombre"
 *   node scripts/generate-one-description.mjs --id <uuid>
 *   node scripts/generate-one-description.mjs --slug <slug>
 *   node scripts/generate-one-description.mjs "Nombre" --force
 *   node scripts/generate-one-description.mjs "Nombre" --dry-run
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { translateCenterFieldsToEn } from './lib/translate-center-fields-en.mjs';
import {
  CENTER_DESC_MIN_LENGTH,
  generateCenterDescriptionEs,
} from './lib/center-description-terra.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach((line) => {
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

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Falta OPENAI_API_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const idIdx = args.indexOf('--id');
const slugIdx = args.indexOf('--slug');
const searchId = idIdx !== -1 ? args[idIdx + 1] : null;
const searchSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;
const skipIdx = new Set([idIdx === -1 ? -1 : idIdx + 1, slugIdx === -1 ? -1 : slugIdx + 1]);
const searchName = !searchId && !searchSlug
  ? args.filter((a, i) => !a.startsWith('--') && !skipIdx.has(i))[0]
  : null;

if (!searchId && !searchSlug && !searchName) {
  console.error('Uso: node scripts/generate-one-description.mjs "Nombre del centro"');
  process.exit(1);
}

let query = supabase
  .from('centers')
  .select(
    'id, name, slug, city, province, type, services_es, description_es, schedule_summary_es, price_range_es, website, address',
  );

if (searchId) query = query.eq('id', searchId);
else if (searchSlug) query = query.eq('slug', searchSlug);
else query = query.ilike('name', `%${searchName}%`);

const { data: results, error } = await query;
if (error) {
  console.error(error.message);
  process.exit(1);
}
if (!results?.length) {
  console.error(`No se encontró: ${searchId || searchSlug || searchName}`);
  process.exit(1);
}
if (results.length > 1) {
  console.log(`${results.length} centros:`);
  results.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.city}) [${c.slug}]`));
  process.exit(1);
}

const center = results[0];
const currentDesc = (center.description_es || '').trim();

console.log(`\n═══ ${center.name} · ${center.city} ═══`);
console.log(`Desc actual: ${currentDesc.length} caracteres\n`);

if (currentDesc.length >= CENTER_DESC_MIN_LENGTH && !FORCE) {
  console.log('Ya tiene descripción (≥400). Usa --force.');
  process.exit(0);
}

const t0 = Date.now();
const { text: desc, searches } = await generateCenterDescriptionEs(OPENAI_KEY, center);
const words = desc.split(/\s+/).length;
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

if (DRY_RUN) {
  console.log(desc);
  console.log(`\n── ${words} palabras · ${searches} búsquedas · ${elapsed}s ──`);
  process.exit(0);
}

const now = new Date().toISOString();
const { error: upErr } = await supabase
  .from('centers')
  .update({
    description_es: desc,
    description_ai_generated_at: now,
    updated_at: now,
  })
  .eq('id', center.id);
if (upErr) {
  console.error(upErr.message);
  process.exit(1);
}
console.log(`✅ ES: ${words} palabras · ${searches} búsquedas (${elapsed}s)`);

try {
  const en = await translateCenterFieldsToEn(OPENAI_KEY, {
    descriptionEs: desc,
    servicesEs: Array.isArray(center.services_es) ? center.services_es : [],
    scheduleSummaryEs: center.schedule_summary_es ?? null,
    priceRangeEs: center.price_range_es ?? null,
  });
  const { error: enErr } = await supabase
    .from('centers')
    .update({
      description_en: en.description_en,
      services_en: en.services_en,
      schedule_summary_en: en.schedule_summary_en,
      price_range_en: en.price_range_en,
      updated_at: new Date().toISOString(),
    })
    .eq('id', center.id);
  if (enErr) throw enErr;
  console.log('✅ EN guardada');
} catch (e) {
  console.log(`⚠ EN omitida: ${e.message}`);
}
