#!/usr/bin/env node
/**
 * Normaliza el html_content guardado en mailing_campaigns aplicando los mismos
 * arreglos defensivos que ahora hace el endpoint /generate después de la IA.
 *
 * Úsalo cuando ya tienes un HTML generado que te gusta pero tiene assets
 * rotos (típicamente URLs de iconos que no existen en /public) y no quieres
 * regenerar el mail entero para no perder el copy.
 *
 * Arreglos aplicados (idempotentes, solo actúan si el patrón está presente):
 *   · /social/facebook.*        -> https://www.retiru.com/email/facebook.png
 *   · /social/instagram.*       -> https://www.retiru.com/email/instagram.png
 *   · /icons?/facebook.*        -> https://www.retiru.com/email/facebook.png
 *   · /icons?/instagram.*       -> https://www.retiru.com/email/instagram.png
 *   · URLs externas "*facebook-icon*" / "*instagram-icon*" -> /email/<red>.png
 *
 * Uso:
 *   node scripts/mailing-normalize-html.mjs --slug=<slug>       # una campaña
 *   node scripts/mailing-normalize-html.mjs --all               # todas las que encaje algún patrón
 *   node scripts/mailing-normalize-html.mjs --slug=<slug> --dry # sin escribir
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Mini-loader de .env.local (mismo patrón que mailing-load-html.mjs)
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const flag = (name) => {
  const f = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!f) return null;
  const eq = f.indexOf('=');
  return eq > -1 ? f.slice(eq + 1) : '';
};
const hasFlag = (name) => args.includes(`--${name}`);

const slug = flag('slug');
const doAll = hasFlag('all');
const dryRun = hasFlag('dry') || hasFlag('dry-run');

if (!slug && !doAll) {
  console.error('Uso: node scripts/mailing-normalize-html.mjs --slug=<slug> [--dry]');
  console.error('     node scripts/mailing-normalize-html.mjs --all [--dry]');
  process.exit(1);
}

const SOCIAL_FIXES = [
  [/https?:\/\/www\.retiru\.com\/social\/facebook\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/facebook.png'],
  [/https?:\/\/www\.retiru\.com\/social\/instagram\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/instagram.png'],
  [/https?:\/\/www\.retiru\.com\/icons?\/facebook\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/facebook.png'],
  [/https?:\/\/www\.retiru\.com\/icons?\/instagram\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/instagram.png'],
  [/https?:\/\/[^"')\s]*facebook[-_]?icon[^"')\s]*/gi, 'https://www.retiru.com/email/facebook.png'],
  [/https?:\/\/[^"')\s]*instagram[-_]?icon[^"')\s]*/gi, 'https://www.retiru.com/email/instagram.png'],
];

function applyFixes(html) {
  let out = html;
  let count = 0;
  for (const [rx, replacement] of SOCIAL_FIXES) {
    const before = out;
    out = out.replace(rx, replacement);
    if (out !== before) count++;
  }
  return { html: out, changed: out !== html, rulesMatched: count };
}

let query = sb.from('mailing_campaigns').select('id, slug, subject, html_content');
if (slug) query = query.eq('slug', slug);
const { data: rows, error } = await query;
if (error) {
  console.error('❌', error.message);
  process.exit(1);
}
if (!rows || rows.length === 0) {
  console.error('❌ Sin campañas encontradas');
  process.exit(1);
}

let changed = 0;
let skipped = 0;

for (const row of rows) {
  if (!row.html_content) { skipped++; continue; }
  const { html: fixed, changed: didChange, rulesMatched } = applyFixes(row.html_content);
  if (!didChange) {
    if (slug) console.log(`· ${row.slug}: nada que corregir (HTML ya está normalizado).`);
    skipped++;
    continue;
  }
  console.log(`📤  ${row.slug}: ${rulesMatched} regla(s) coincidieron, ${row.html_content.length.toLocaleString('es-ES')} → ${fixed.length.toLocaleString('es-ES')} bytes`);
  if (dryRun) { changed++; continue; }
  const { error: uErr } = await sb.from('mailing_campaigns').update({ html_content: fixed }).eq('id', row.id);
  if (uErr) {
    console.error(`   ❌ ${uErr.message}`);
    continue;
  }
  changed++;
}

console.log(`\n✅  ${changed} campaña(s) actualizada(s) · ${skipped} sin cambios${dryRun ? ' (DRY-RUN)' : ''}`);
