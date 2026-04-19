#!/usr/bin/env node
/**
 * RETIRU · Seed de la biblioteca de mailings
 *
 * Lee todos los .html de mailing/ y mailing/enviados/ y crea (o actualiza)
 * filas en mailing_campaigns con html_content poblado y status='archived'.
 *
 * Así, desde el panel /administrator/mails, al crear una nueva campaña ya
 * aparecen todos los diseños existentes en el selector "usar como referencia".
 *
 * Uso:
 *   node scripts/seed-mailing-library.mjs                 # sube todos
 *   node scripts/seed-mailing-library.mjs --dry-run       # solo muestra
 *   node scripts/seed-mailing-library.mjs --only=2-2026   # substring
 *
 * Idempotente: vuelve a ejecutar es seguro. Actualiza el HTML de cada fila
 * existente (por slug) en lugar de duplicarla.
 *
 * Además, si detecta la campaña "2-2026-04-19-retiru-recordatorio-centro",
 * la promociona como "draft" (no archivada) para que puedas lanzarla desde el
 * panel directamente con el ritmo que decidas.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const MAILING_DIR = join(root, 'mailing');
const ENVIADOS_DIR = join(MAILING_DIR, 'enviados');
const APP_DIR = join(MAILING_DIR, 'app');

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnvFile(join(root, '.env.local'));

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7) : null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ─── Descubrimiento de archivos ─────────────────────────────────────────────

function discover() {
  const entries = [];
  // Marketing principal (mailing/*.html) y archivados (mailing/enviados/*.html)
  for (const dir of [MAILING_DIR, ENVIADOS_DIR, APP_DIR]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.html')) continue;
      entries.push({ absPath: join(dir, f), file: f, dir });
    }
  }
  return entries;
}

// Extrae número de campaña si el nombre empieza con "N-YYYY-MM-DD-..."
function parseNumberAndSlug(file) {
  const m = file.match(/^(\d+)-\d{4}-\d{2}-\d{2}-(.+)\.html$/i);
  if (m) return { number: Number(m[1]), slug: m[2] };
  const nameOnly = file.replace(/\.html$/i, '');
  return { number: null, slug: nameOnly };
}

function subjectFromFilename(slug) {
  // Heurística sencilla: title-case del slug.
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
    .trim();
}

// ─── Upsert de la biblioteca ────────────────────────────────────────────────

async function upsert(entry) {
  const html = readFileSync(entry.absPath, 'utf8');
  const { number, slug: rawSlug } = parseNumberAndSlug(entry.file);

  // Los de mailing/app/ se marcan con un prefijo especial para no colisionar con marketing
  const isApp = entry.dir === APP_DIR;
  const slug = isApp ? `app-${rawSlug}` : rawSlug;
  const subject = subjectFromFilename(rawSlug);
  const status = isApp ? 'archived' : 'archived';

  const { data: existing } = await sb
    .from('mailing_campaigns')
    .select('id, status, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    if (DRY) {
      console.log(`  = ${slug} (existe, actualizaría html)`);
      return { action: 'update' };
    }
    const { error } = await sb
      .from('mailing_campaigns')
      .update({ html_content: html, template_file: entry.file })
      .eq('id', existing.id);
    if (error) {
      console.error(`  ❌ ${slug}: ${error.message}`);
      return { action: 'error' };
    }
    console.log(`  ↻ ${slug} · html actualizado (${html.length.toLocaleString('es-ES')} b)`);
    return { action: 'update' };
  }

  if (DRY) {
    console.log(`  + ${slug}  (nuevo, ${html.length.toLocaleString('es-ES')} b)`);
    return { action: 'insert' };
  }
  const { error } = await sb.from('mailing_campaigns').insert({
    slug,
    number,
    template_file: entry.file,
    subject,
    status,
    archived_at: new Date().toISOString(),
    html_content: html,
    audience_filter: {},
  });
  if (error) {
    console.error(`  ❌ ${slug}: ${error.message}`);
    return { action: 'error' };
  }
  console.log(`  + ${slug} · insertado`);
  return { action: 'insert' };
}

async function promoteCampaign2() {
  // La campaña 2 (recordatorio) es la que queríamos lanzar desde el panel,
  // así que la movemos a 'draft' si estuviese archivada.
  const slug = '2-2026-04-19-retiru-recordatorio-centro';
  const { data: c } = await sb
    .from('mailing_campaigns')
    .select('id, status, html_content, subject')
    .eq('slug', slug)
    .maybeSingle();
  if (!c || !c.html_content) return;
  if (c.status === 'draft' || c.status === 'sending') return;

  console.log(`\nPromociendo ${slug} a draft (para lanzarla desde el panel)…`);
  if (DRY) return;
  const subject = c.subject || '¿Aún no has reclamado tu centro en Retiru?';
  const { error } = await sb.from('mailing_campaigns').update({
    status: 'draft',
    archived_at: null,
    subject,
    description: 'Recordatorio a los centros para que activen su ficha. 6 meses gratis desde su inclusión en Retiru.',
  }).eq('id', c.id);
  if (error) console.error(`  ❌ ${error.message}`);
  else console.log('  ✅ OK');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const entries = discover().filter((e) => !only || e.file.includes(only));
  console.log(`📚  ${entries.length} archivos HTML encontrados${only ? ` (filtrados por "${only}")` : ''}${DRY ? ' · DRY-RUN' : ''}`);
  if (entries.length === 0) {
    console.log('   ℹ️ No hay archivos en mailing/ — nada que sembrar.');
    return;
  }

  const stats = { inserted: 0, updated: 0, errors: 0 };
  for (const entry of entries) {
    const r = await upsert(entry);
    if (r.action === 'insert') stats.inserted++;
    else if (r.action === 'update') stats.updated++;
    else stats.errors++;
  }
  console.log(`\nResumen: ${stats.inserted} nuevas · ${stats.updated} actualizadas · ${stats.errors} errores`);

  await promoteCampaign2();
}

main().catch((e) => {
  console.error('❌', e.stack || e.message || e);
  process.exit(1);
});
