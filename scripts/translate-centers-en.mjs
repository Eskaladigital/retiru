#!/usr/bin/env node
/**
 * Traduce descripciones y campos relacionados ES → EN para centros que ya tienen description_es.
 * Requiere OPENAI_API_KEY y SUPABASE_SERVICE_ROLE_KEY en .env.local
 *
 * Uso:
 *   node scripts/translate-centers-en.mjs
 *   node scripts/translate-centers-en.mjs --limit 20
 *   node scripts/translate-centers-en.mjs --force   (sobrescribe description_en existente)
 *   node scripts/translate-centers-en.mjs --dry-run
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { translateCenterFieldsToEn } from './lib/translate-center-fields-en.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach((line) => {
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

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i !== -1 ? parseInt(args[i + 1], 10) || 0 : 0;
})();
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const MIN_DESC = 400;

if (!OPENAI_KEY) {
  console.error('Falta OPENAI_API_KEY en .env.local');
  process.exit(1);
}

const { data: rows, error } = await supabase
  .from('centers')
  .select('id, name, slug, description_es, services_es, schedule_summary_es, price_range_es, description_en');

if (error) {
  console.error(error.message);
  process.exit(1);
}

let list = (rows || []).filter((c) => (c.description_es || '').trim().length >= MIN_DESC);
if (!FORCE) {
  list = list.filter((c) => !(c.description_en || '').trim());
}
if (LIMIT > 0) list = list.slice(0, LIMIT);

console.log(`\n═══ TRADUCIR CENTROS ES → EN ═══`);
console.log(`Centros a procesar: ${list.length}${DRY_RUN ? ' (dry-run)' : ''}\n`);

let ok = 0;
let errors = 0;

for (let i = 0; i < list.length; i++) {
  const c = list[i];
  process.stdout.write(`[${i + 1}/${list.length}] ${c.name}... `);
  try {
    const en = await translateCenterFieldsToEn(OPENAI_KEY, {
      descriptionEs: c.description_es,
      servicesEs: Array.isArray(c.services_es) ? c.services_es : [],
      scheduleSummaryEs: c.schedule_summary_es,
      priceRangeEs: c.price_range_es,
    });
    if (DRY_RUN) {
      console.log(`OK (${en.description_en.split(/\s+/).length} words EN)`);
    } else {
      const { error: upErr } = await supabase
        .from('centers')
        .update({
          description_en: en.description_en,
          services_en: en.services_en,
          schedule_summary_en: en.schedule_summary_en,
          price_range_en: en.price_range_en,
          updated_at: new Date().toISOString(),
        })
        .eq('id', c.id);
      if (upErr) throw upErr;
      console.log('✓');
    }
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    errors++;
    if (e.message?.includes('429')) {
      console.log('  Esperando 30s (rate limit)...');
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
}

console.log(`\n═══ Resultado: ${ok} ok · ${errors} errores ═══\n`);
