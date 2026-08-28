#!/usr/bin/env node
/**
 * Genera descripciones de centros con gpt-5.6-terra + web_search nativo.
 * Traducción EN: gpt-4o-mini. Sin SerpAPI ni scrape local.
 *
 * Uso:
 *   node scripts/generate-all-descriptions.mjs
 *   node scripts/generate-all-descriptions.mjs --province Murcia
 *   node scripts/generate-all-descriptions.mjs --limit 10
 *   node scripts/generate-all-descriptions.mjs --force
 *   node scripts/generate-all-descriptions.mjs --dry-run
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
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const provinceIdx = args.indexOf('--province');
const RAW_PROVINCE = provinceIdx !== -1 ? args[provinceIdx + 1] : null;
const PROVINCE_ALIAS = { Jaen: 'Jaén', Almeria: 'Almería', Malaga: 'Málaga' };
const PROVINCE = PROVINCE_ALIAS[RAW_PROVINCE] || RAW_PROVINCE;
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

let query = supabase
  .from('centers')
  .select(
    'id, name, city, province, type, services_es, description_es, schedule_summary_es, price_range_es, website, address',
  )
  .eq('status', 'active');
if (PROVINCE) query = query.eq('province', PROVINCE);

const { data: centers, error } = await query;
if (error) {
  console.error(error.message);
  process.exit(1);
}

let toProcess = (centers || []).filter((c) => {
  if (FORCE) return true;
  return (c.description_es || '').trim().length < CENTER_DESC_MIN_LENGTH;
});
if (LIMIT > 0) toProcess = toProcess.slice(0, LIMIT);

console.log('\n═══ DESCRIPCIONES · gpt-5.6-terra + web search ═══');
console.log(
  `${toProcess.length} centros${FORCE ? ' (FORCE)' : ''}${PROVINCE ? ` · provincia ${PROVINCE}` : ''}${LIMIT ? ` · límite ${LIMIT}` : ''}`,
);
if (DRY_RUN) console.log('DRY RUN — no se guarda\n');
else console.log('');

let ok = 0;
let errors = 0;
const startTime = Date.now();

for (let i = 0; i < toProcess.length; i++) {
  const c = toProcess[i];
  const t0 = Date.now();
  process.stdout.write(`[${i + 1}/${toProcess.length}] ${c.name} (${c.city})... `);

  try {
    const { text: desc, searches } = await generateCenterDescriptionEs(OPENAI_KEY, c);
    const words = desc.split(/\s+/).length;

    if (!DRY_RUN) {
      const now = new Date().toISOString();
      const { error: upErr } = await supabase
        .from('centers')
        .update({
          description_es: desc,
          description_ai_generated_at: now,
          updated_at: now,
        })
        .eq('id', c.id);
      if (upErr) throw upErr;

      try {
        const en = await translateCenterFieldsToEn(OPENAI_KEY, {
          descriptionEs: desc,
          servicesEs: Array.isArray(c.services_es) ? c.services_es : [],
          scheduleSummaryEs: c.schedule_summary_es ?? null,
          priceRangeEs: c.price_range_es ?? null,
        });
        await supabase
          .from('centers')
          .update({
            description_en: en.description_en,
            services_en: en.services_en,
            schedule_summary_en: en.schedule_summary_en,
            price_range_en: en.price_range_en,
            updated_at: new Date().toISOString(),
          })
          .eq('id', c.id);
      } catch (enErr) {
        console.log(`  [en] ${enErr.message}`);
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ ${words} pal. · ${searches} búsquedas (${elapsed}s)`);
    ok++;
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✗ ${err.message} (${elapsed}s)`);
    errors++;
    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      console.log('  Rate limit — 30s...');
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
}

const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n═══ RESULTADO ═══`);
console.log(`✓ ${ok} | ✗ ${errors} | ${totalTime} min`);
