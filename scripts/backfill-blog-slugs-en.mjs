#!/usr/bin/env node
/**
 * Rellena slug_en en artículos publicados cuando falta, usando slugify(title_en).
 * Si el slug EN coincide con el ES, deja slug_en en null (misma URL en ambos idiomas).
 *
 * Uso: node scripts/backfill-blog-slugs-en.mjs [--dry-run]
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

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

const DRY_RUN = process.argv.includes('--dry-run');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: articles, error } = await supabase
  .from('blog_articles')
  .select('id, slug, title_en, slug_en')
  .eq('is_published', true);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const { data: existingSlugs } = await supabase.from('blog_articles').select('slug, slug_en');

const takenEn = new Set();
for (const r of existingSlugs || []) {
  takenEn.add(r.slug);
  if (r.slug_en) takenEn.add(r.slug_en);
}

let updated = 0;
for (const a of articles || []) {
  if (a.slug_en) continue;
  const titleEn = (a.title_en || '').trim();
  if (!titleEn) continue;

  const candidate = slugify(titleEn, { lower: true, strict: true, trim: true });
  if (!candidate || candidate === a.slug) continue;

  if (takenEn.has(candidate)) {
    console.log(`⚠ Saltando ${a.slug}: slug_en "${candidate}" ya en uso`);
    continue;
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}${a.slug} → en: ${candidate}`);
  if (!DRY_RUN) {
    const { error: upErr } = await supabase.from('blog_articles').update({ slug_en: candidate }).eq('id', a.id);
    if (upErr) {
      console.error(`  Error: ${upErr.message}`);
      continue;
    }
    takenEn.add(candidate);
  }
  updated++;
}

console.log(`\nListo: ${updated} artículos ${DRY_RUN ? 'simulados' : 'actualizados'}.`);
