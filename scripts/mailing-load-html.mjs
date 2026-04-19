#!/usr/bin/env node
/**
 * RETIRU · Carga un archivo HTML local en el html_content de una campaña
 *
 * Sirve para:
 *   1. Migrar campañas que tenías como archivo (p. ej. mailing/2-2026-04-19-…)
 *      a una fila mailing_campaigns que ya existe en el panel.
 *   2. Sobrescribir a mano el HTML de una campaña sin pasar por la IA.
 *
 * Uso:
 *   node scripts/mailing-load-html.mjs --slug=recordatorio-centro-2026-04-19 \
 *                                      --file=mailing/2-2026-04-19-retiru-recordatorio-centro.html
 *
 * Opcional:
 *   --subject="¿Aún no has reclamado tu centro en Retiru?"
 *   --description="Recordatorio a los centros no reclamados: 6 meses gratis…"
 *   --preserve-template-file   no toca template_file (por defecto lo pone al nombre del archivo)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, basename, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
function flag(name) {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : null;
}
const hasFlag = (name) => args.includes(`--${name}`);

const slug = flag('slug');
const fileArg = flag('file');
const subjectArg = flag('subject');
const descArg = flag('description');
const preserveTemplate = hasFlag('preserve-template-file');

if (!slug || !fileArg) {
  console.error('Uso: node scripts/mailing-load-html.mjs --slug=<slug> --file=<ruta.html>');
  console.error('Ejemplo:');
  console.error('  node scripts/mailing-load-html.mjs --slug=recordatorio-centro-2026-04-19 \\');
  console.error('                                     --file=mailing/2-2026-04-19-retiru-recordatorio-centro.html');
  process.exit(1);
}

const abs = isAbsolute(fileArg) ? fileArg : join(root, fileArg);
if (!existsSync(abs)) {
  console.error(`❌ No existe el archivo: ${abs}`);
  process.exit(1);
}
const html = readFileSync(abs, 'utf8');
if (!html.trim()) {
  console.error(`❌ El archivo está vacío: ${abs}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const { data: campaign, error: qErr } = await sb
  .from('mailing_campaigns')
  .select('id, slug, status, subject, description, template_file, html_content')
  .eq('slug', slug)
  .maybeSingle();
if (qErr) {
  console.error(`❌ Error consultando Supabase: ${qErr.message}`);
  process.exit(1);
}
if (!campaign) {
  console.error(`❌ No existe ninguna campaña con slug="${slug}".`);
  console.error('   Revisa /administrator/mails para ver el slug real (o créala antes).');
  process.exit(1);
}

const prevBytes = (campaign.html_content || '').length;
const newBytes = html.length;
const fileName = basename(abs);

const patch = {
  html_content: html,
};
if (!preserveTemplate) patch.template_file = fileName;
if (subjectArg) patch.subject = subjectArg;
if (descArg) patch.description = descArg;

console.log(`📤  Actualizando campaña "${campaign.slug}" (estado ${campaign.status})`);
console.log(`    • archivo:  ${fileArg} (${fileName})`);
console.log(`    • bytes:    ${prevBytes.toLocaleString('es-ES')} → ${newBytes.toLocaleString('es-ES')}`);
if (subjectArg) console.log(`    • subject:  "${subjectArg}"`);
if (descArg) console.log(`    • descrip.: "${descArg.slice(0, 80)}${descArg.length > 80 ? '…' : ''}"`);

const { error: uErr } = await sb.from('mailing_campaigns').update(patch).eq('id', campaign.id);
if (uErr) {
  console.error(`\n❌ Error escribiendo en Supabase: ${uErr.message}`);
  process.exit(1);
}
console.log('\n✅  Listo. Abre /administrator/mails/' + campaign.slug + ' y pulsa «Vista previa».');
