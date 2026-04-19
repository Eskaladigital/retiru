#!/usr/bin/env node
/**
 * RETIRU · Upsert de una campaña desde un archivo HTML local
 *
 * Sirve para:
 *   1. Migrar campañas que tenías como archivo (p. ej. mailing/2-2026-04-19-…)
 *      a una fila mailing_campaigns (las crea si no existen, las actualiza si sí).
 *   2. Sobrescribir a mano el HTML de una campaña sin pasar por la IA.
 *   3. Dar de alta campañas ya enviadas como "archivadas" para que la IA las
 *      tenga de referencia.
 *
 * Uso básico:
 *   node scripts/mailing-load-html.mjs --slug=recordatorio-centro-2026-04-19 \
 *                                      --file=mailing/2-2026-04-19-retiru-recordatorio-centro.html
 *
 * Flags:
 *   --slug=<slug>                  (obligatorio)
 *   --file=<ruta.html>             (obligatorio, relativo a la raíz)
 *   --subject="…"                  asunto visible en inbox
 *   --description="…"              descripción interna (lo que verás en /administrator/mails)
 *   --number=<N>                   número de orden de la campaña
 *   --status=<draft|sent|archived>           estado (por defecto: mantiene el actual o 'draft' si es nueva).
 *                                            OJO: 'sending' no se acepta aquí: una campaña solo pasa a
 *                                            'sending' pulsando "Lanzar campaña" en /administrator/mails.
 *   --audience=<all|claimed|not_claimed>     filtro de audiencia sugerido
 *   --preserve-template-file       no tocar template_file (por defecto usa el nombre del archivo)
 *   --create-if-missing            crea la fila si no existe (sin este flag, falla si no existe)
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
const numberArg = flag('number');
const statusArg = flag('status');
const audienceArg = flag('audience');
const preserveTemplate = hasFlag('preserve-template-file');
const createIfMissing = hasFlag('create-if-missing');

// El paso a 'sending' es responsabilidad exclusiva del botón "Lanzar campaña"
// del panel /administrator/mails. Este script sirve para sembrar/actualizar
// plantillas en BD, no para iniciar envíos. Por eso se permite crear o marcar
// una campaña como 'draft', 'sent' (histórico ya enviado) o 'archived'
// (histórico referencia), pero nunca 'sending'.
const VALID_STATUSES = ['draft', 'sent', 'archived'];
if (statusArg && !VALID_STATUSES.includes(statusArg)) {
  if (statusArg === 'sending') {
    console.error(
      `❌ --status=sending no está permitido desde este script.\n` +
      `   Las campañas se lanzan SIEMPRE pulsando "Lanzar campaña" en ` +
      `/administrator/mails/<slug> (Tab "Envío"), nunca de forma automática.`
    );
  } else {
    console.error(`❌ --status debe ser uno de: ${VALID_STATUSES.join(', ')}`);
  }
  process.exit(1);
}

if (!slug || !fileArg) {
  console.error('Uso: node scripts/mailing-load-html.mjs --slug=<slug> --file=<ruta.html> [--create-if-missing]');
  console.error('Ejemplos:');
  console.error('  # actualizar una campaña existente');
  console.error('  node scripts/mailing-load-html.mjs --slug=recordatorio-centro-2026-04-19 \\');
  console.error('                                     --file=mailing/2-2026-04-19-retiru-recordatorio-centro.html');
  console.error('  # crear una campaña ya enviada (archivada) de referencia');
  console.error('  node scripts/mailing-load-html.mjs --slug=bienvenida-centro-2026-04-01 \\');
  console.error('                                     --file=mailing/enviados/1-2026-04-01-retiru-bienvenida-centro.html \\');
  console.error('                                     --number=1 --status=archived --create-if-missing');
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
  .select('id, slug, number, status, subject, description, template_file, html_content, audience_filter')
  .eq('slug', slug)
  .maybeSingle();
if (qErr) {
  console.error(`❌ Error consultando Supabase: ${qErr.message}`);
  process.exit(1);
}

const fileName = basename(abs);
const newBytes = html.length;

if (!campaign) {
  if (!createIfMissing) {
    console.error(`❌ No existe ninguna campaña con slug="${slug}".`);
    console.error('   Añade --create-if-missing para crearla, o revisa /administrator/mails para ver el slug real.');
    process.exit(1);
  }

  const now = new Date().toISOString();
  const status = statusArg || 'draft';
  const row = {
    slug,
    subject: subjectArg || slug,
    description: descArg || null,
    template_file: fileName,
    html_content: html,
    status,
    audience_filter: audienceArg ? { type: audienceArg } : null,
    number: numberArg ? Number(numberArg) : null,
    started_at: status === 'sent' || status === 'archived' ? now : null,
    completed_at: status === 'sent' || status === 'archived' ? now : null,
    archived_at: status === 'archived' ? now : null,
  };

  console.log(`🆕  Creando campaña "${slug}" (estado ${status})`);
  console.log(`    • archivo:  ${fileArg} (${fileName})`);
  console.log(`    • bytes:    ${newBytes.toLocaleString('es-ES')}`);
  if (row.number !== null) console.log(`    • número:   ${row.number}`);
  if (row.subject) console.log(`    • subject:  "${row.subject}"`);
  if (row.description) console.log(`    • descrip.: "${row.description.slice(0, 80)}${row.description.length > 80 ? '…' : ''}"`);
  if (row.audience_filter) console.log(`    • audience: ${JSON.stringify(row.audience_filter)}`);

  const { error: iErr } = await sb.from('mailing_campaigns').insert(row);
  if (iErr) {
    console.error(`\n❌ Error insertando en Supabase: ${iErr.message}`);
    process.exit(1);
  }
  console.log('\n✅  Creada. Abre /administrator/mails/' + slug);
  process.exit(0);
}

const prevBytes = (campaign.html_content || '').length;

const patch = { html_content: html };
if (!preserveTemplate) patch.template_file = fileName;
if (subjectArg) patch.subject = subjectArg;
if (descArg) patch.description = descArg;
if (numberArg) patch.number = Number(numberArg);
if (audienceArg) patch.audience_filter = { type: audienceArg };
if (statusArg && statusArg !== campaign.status) {
  patch.status = statusArg;
  const now = new Date().toISOString();
  if (statusArg === 'sent') patch.completed_at = now;
  if (statusArg === 'archived') {
    patch.archived_at = now;
    if (!campaign.completed_at) patch.completed_at = now;
  }
}

console.log(`📤  Actualizando campaña "${campaign.slug}" (estado ${campaign.status}${statusArg && statusArg !== campaign.status ? ` → ${statusArg}` : ''})`);
console.log(`    • archivo:  ${fileArg} (${fileName})`);
console.log(`    • bytes:    ${prevBytes.toLocaleString('es-ES')} → ${newBytes.toLocaleString('es-ES')}`);
if (subjectArg) console.log(`    • subject:  "${subjectArg}"`);
if (descArg) console.log(`    • descrip.: "${descArg.slice(0, 80)}${descArg.length > 80 ? '…' : ''}"`);
if (numberArg) console.log(`    • número:   ${numberArg}`);
if (audienceArg) console.log(`    • audience: ${audienceArg}`);

const { error: uErr } = await sb.from('mailing_campaigns').update(patch).eq('id', campaign.id);
if (uErr) {
  console.error(`\n❌ Error escribiendo en Supabase: ${uErr.message}`);
  process.exit(1);
}
console.log('\n✅  Listo. Abre /administrator/mails/' + campaign.slug + ' y pulsa «Vista previa».');
