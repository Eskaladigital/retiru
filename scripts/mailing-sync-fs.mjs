#!/usr/bin/env node
/**
 * RETIRU · Sincroniza las campañas de BD con la carpeta local mailing/
 *
 * Qué hace:
 *   · Para cada campaña con html_content en BD:
 *       - status ∈ {draft, sending}     → escribe en  mailing/<filename>.html
 *       - status ∈ {sent, archived}     → escribe en  mailing/enviados/<filename>.html
 *         y elimina la versión "activa" si estaba en mailing/<filename>.html
 *   · Los HTMLs que quedan en mailing/enviados/ sirven como biblioteca de
 *     referencia para la IA cuando generemos nuevas campañas.
 *
 * Por qué no lo hace el cron/panel: Vercel no tiene filesystem persistente,
 * así que las carpetas mailing/ y mailing/enviados/ viven solo en local.
 * La verdad está en BD y este script mantiene la copia local al día.
 *
 * Uso:
 *   npm run mailing:sync                         → escribe cambios
 *   npm run mailing:sync:dry                     → solo muestra qué haría
 *   node scripts/mailing-sync-fs.mjs --only=<slug o substring del nombre>
 *
 * El nombre del archivo sigue esta prioridad:
 *   1. campaign.template_file si está poblado (respeta el naming legacy).
 *   2. si no, deriva de (number, slug):
 *        · con número → "<N>-<slug>.html"      (p. ej. "2-recordatorio-centro-2026-04-19.html")
 *        · sin número → "<slug>.html"
 *   Si el archivo se escribe por primera vez, se persiste el nombre en
 *   campaign.template_file para que tanto panel como scripts lo compartan.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const MAILING_DIR = join(root, 'mailing');
const ENVIADOS_DIR = join(MAILING_DIR, 'enviados');

function loadEnvFile(p) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
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

if (!existsSync(MAILING_DIR)) mkdirSync(MAILING_DIR, { recursive: true });
if (!existsSync(ENVIADOS_DIR)) mkdirSync(ENVIADOS_DIR, { recursive: true });

function deriveFileName(c) {
  if (c.template_file) return c.template_file;
  const slug = c.slug || c.id;
  if (c.number !== null && c.number !== undefined) return `${c.number}-${slug}.html`;
  return `${slug}.html`;
}

const { data: campaigns, error } = await sb
  .from('mailing_campaigns')
  .select('id, slug, number, subject, status, template_file, html_content, completed_at, archived_at')
  .not('html_content', 'is', null)
  .order('created_at', { ascending: true });

if (error) {
  console.error(`❌ Error leyendo campañas: ${error.message}`);
  process.exit(1);
}

const filtered = (campaigns || []).filter((c) => {
  if (!only) return true;
  const hay = `${c.slug} ${c.template_file || ''} ${c.number || ''}`;
  return hay.includes(only);
});

console.log(`📬  ${filtered.length} campañas con HTML${only ? ` (filtradas por "${only}")` : ''}${DRY ? ' · DRY-RUN' : ''}\n`);

let created = 0, updated = 0, moved = 0, removed = 0, skipped = 0;

for (const c of filtered) {
  const fileName = deriveFileName(c);
  const isArchived = c.status === 'sent' || c.status === 'archived';
  const targetDir = isArchived ? ENVIADOS_DIR : MAILING_DIR;
  const targetPath = join(targetDir, fileName);
  const otherPath = join(isArchived ? MAILING_DIR : ENVIADOS_DIR, fileName);
  const prefix = isArchived ? 'enviados/' : '';

  // 1. Escribir (o actualizar) el archivo en el destino correcto.
  const existed = existsSync(targetPath);
  const prevHtml = existed ? readFileSync(targetPath, 'utf8') : null;
  const bytes = c.html_content.length;

  if (existed && prevHtml === c.html_content) {
    skipped++;
    console.log(`  · ${prefix}${fileName} ya está al día (${bytes.toLocaleString('es-ES')} b)`);
  } else {
    if (!DRY) writeFileSync(targetPath, c.html_content, 'utf8');
    if (existed) {
      updated++;
      console.log(`  ↻ ${prefix}${fileName} actualizado (${bytes.toLocaleString('es-ES')} b)`);
    } else {
      created++;
      console.log(`  + ${prefix}${fileName} creado (${bytes.toLocaleString('es-ES')} b)`);
    }
  }

  // 2. Si el archivo también estaba en la otra carpeta (típico cuando una
  //    campaña pasa de sending a sent), lo quitamos para no dejar duplicados.
  if (existsSync(otherPath)) {
    if (!DRY) unlinkSync(otherPath);
    moved++;
    console.log(`    (eliminado duplicado en ${isArchived ? 'mailing/' : 'enviados/'}${fileName})`);
  }

  // 3. Si la campaña no tenía template_file poblado, lo persistimos.
  if (!c.template_file && !DRY) {
    await sb.from('mailing_campaigns').update({ template_file: fileName }).eq('id', c.id);
  }
}

// 4. Limpieza extra: si existe algún archivo en mailing/ cuyo nombre coincide
//    con una campaña ya archivada (sent/archived), lo movemos a enviados/.
const activeNames = new Set(
  filtered.filter((c) => c.status !== 'sent' && c.status !== 'archived').map(deriveFileName),
);
const archivedNames = new Set(
  filtered.filter((c) => c.status === 'sent' || c.status === 'archived').map(deriveFileName),
);
for (const f of readdirSync(MAILING_DIR)) {
  if (!f.endsWith('.html')) continue;
  if (activeNames.has(f)) continue;
  if (!archivedNames.has(f)) continue;
  const src = join(MAILING_DIR, f);
  const dst = join(ENVIADOS_DIR, f);
  if (!DRY) {
    if (existsSync(dst)) unlinkSync(src);
    else renameSync(src, dst);
  }
  console.log(`  → enviados/${f} (movido porque la campaña ya está cerrada)`);
  moved++;
}

console.log(`\nResumen: ${created} creados · ${updated} actualizados · ${moved} movidos · ${skipped} sin cambios${DRY ? ' · (dry-run: nada escrito)' : ''}`);
