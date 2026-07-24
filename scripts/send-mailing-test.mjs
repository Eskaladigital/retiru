#!/usr/bin/env node
/**
 * RETIRU · Envío de prueba de un mailing HTML
 *
 * Lee un archivo HTML de la carpeta `mailing/` y lo envía a un destinatario
 * para ver cómo llega el email real al inbox antes de lanzarlo a los centros.
 *
 * Solo SMTP OVH/Zimbra — mismo stack que campañas `/administrator/mails` y emails
 * transaccionales (`src/lib/email/index.ts`). Requiere SMTP_HOST/USER/PASSWORD.
 *
 * Uso:
 *   node scripts/send-mailing-test.mjs                                    # por SMTP
 *   node scripts/send-mailing-test.mjs --file=retiru-bienvenida-centro.html
 *   node scripts/send-mailing-test.mjs --to=otroemail@dominio.com
 *   node scripts/send-mailing-test.mjs --cc=copia@dominio.com
 *   node scripts/send-mailing-test.mjs --subject="Asunto custom"
 *   node scripts/send-mailing-test.mjs --nombre="Yoga Sala Madrid" --location="Madrid"
 *   node scripts/send-mailing-test.mjs --center=yoga-sala-madrid          # datos reales de Supabase
 *   node scripts/send-mailing-test.mjs --center="Mahashakti"              # búsqueda por nombre
 *   node scripts/send-mailing-test.mjs --fin-membresia="15 de octubre de 2026"
 *   node scripts/send-mailing-test.mjs --from="Retiru <contacto@retiru.com>"
 *
 * Variables .env.local (SMTP):
 *   SMTP_HOST          p.ej. ssl0.ovh.net
 *   SMTP_PORT          465 (SSL) o 587 (STARTTLS)
 *   SMTP_USER          p.ej. contacto@retiru.com
 *   SMTP_PASSWORD      contraseña del buzón
 *   SMTP_FROM_EMAIL    p.ej. contacto@retiru.com   (opcional; por defecto = SMTP_USER)
 *   SMTP_FROM_NAME     p.ej. Retiru                (opcional)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Cargar .env.local y .env.vercel (sin dependencias) ────────────────────
function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key] || process.env[key].startsWith('your_')) {
      process.env[key] = value;
    }
  }
}
loadEnvFile(join(root, '.env.local'));
loadEnvFile(join(root, '.env.vercel')); // opcional: salida de `npx vercel env pull .env.vercel`

// ─── Parseo de flags ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, def) {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : def;
}

const file = flag('file', '2-2026-04-19-retiru-recordatorio-centro.html');
const to = flag('to', 'contacto@retiru.com');
const cc = flag('cc', null);
const subject = flag(
  'subject',
  file.includes('recordatorio')
    ? '¿Aún no has reclamado tu centro en Retiru?'
    : file.includes('bienvenida')
      ? 'Enhorabuena, tu centro ha sido incluido en Retiru'
      : 'Prueba de mailing Retiru',
);
// Fecha larga en español (p. ej. "18 de octubre de 2026").
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
function formatFechaLargaEs(date) {
  return `${date.getDate()} de ${MESES_ES[date.getMonth()]} de ${date.getFullYear()}`;
}
function defaultFinMembresia() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return formatFechaLargaEs(d);
}

// ─── Opcional: rellenar con datos reales de un centro de Supabase ──────────
// --center=<slug o nombre>  → consulta la tabla `centers` y usa name/city/
// province + created_at para {{NOMBRE_CENTRO}}, {{LOCATION}} y {{FIN_MEMBRESIA}}.
const centerRef = flag('center', null);
let centerData = null;
if (centerRef) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('❌  Para usar --center necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }
  const sb = createClient(url, serviceKey);
  let { data, error } = await sb
    .from('centers')
    .select('id, name, slug, city, province, created_at, status')
    .eq('slug', centerRef)
    .maybeSingle();
  if (!data) {
    const res = await sb
      .from('centers')
      .select('id, name, slug, city, province, created_at, status')
      .ilike('name', `%${centerRef}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    data = res.data;
    error = res.error;
  }
  if (error || !data) {
    console.error(`❌  No encontré ningún centro con referencia "${centerRef}". ${error?.message || ''}`);
    process.exit(1);
  }
  centerData = data;
}

const nombreCentro = flag('nombre', centerData?.name || 'tu centro');
const location = flag(
  'location',
  centerData ? [centerData.city, centerData.province].filter(Boolean).join(', ') || 'tu zona' : 'tu zona',
);
const finMembresiaAuto = (() => {
  if (!centerData?.created_at) return null;
  const d = new Date(centerData.created_at);
  d.setMonth(d.getMonth() + 6);
  return formatFechaLargaEs(d);
})();
const finMembresia = flag('fin-membresia', finMembresiaAuto || defaultFinMembresia());

// ─── Selección de proveedor ────────────────────────────────────────────────
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpReady = Boolean(smtpHost && smtpUser && smtpPass && !smtpPass.startsWith('your_'));

const providerFlag = flag('provider', null);

if (providerFlag && providerFlag !== 'smtp') {
  console.error('❌  Solo está soportado SMTP (omite --provider o usa --provider=smtp).');
  process.exit(1);
}

if (!smtpReady) {
  console.error('❌  No hay SMTP configurado en .env.local.');
  console.error('    SMTP de OVH (sin tocar DNS):');
  console.error('      SMTP_HOST=ssl0.ovh.net');
  console.error('      SMTP_PORT=465');
  console.error('      SMTP_USER=contacto@retiru.com');
  console.error('      SMTP_PASSWORD=********');
  process.exit(1);
}

// ─── Cargar plantilla y sustituir variables ────────────────────────────────
const htmlPath = join(root, 'mailing', file);
if (!existsSync(htmlPath)) {
  console.error(`❌  No se encuentra el archivo: ${htmlPath}`);
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf8');
html = html
  .replaceAll('{{NOMBRE_CENTRO}}', nombreCentro)
  .replaceAll('{{LOCATION}}', location)
  .replaceAll('{{FIN_MEMBRESIA}}', finMembresia);

// ─── Envío ─────────────────────────────────────────────────────────────────
const port = Number(process.env.SMTP_PORT || 465);
const secure = port === 465; // 465 = SSL, 587 = STARTTLS
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
const fromName = process.env.SMTP_FROM_NAME || 'Retiru';
const from = flag('from', `${fromName} <${fromEmail}>`);

console.log('📧  Enviando por SMTP:');
console.log(`   • host:      ${smtpHost}:${port} (${secure ? 'SSL' : 'STARTTLS'})`);
console.log(`   • usuario:   ${smtpUser}`);
console.log(`   • plantilla: ${file}`);
console.log(`   • de:        ${from}`);
console.log(`   • para:      ${to}`);
if (cc) console.log(`   • cc:        ${cc}`);
console.log(`   • asunto:    ${subject}`);
if (centerData) {
  console.log(`   • centro:    ${centerData.name} (${centerData.slug})`);
  console.log(`   • añadido:   ${new Date(centerData.created_at).toISOString().slice(0, 10)}`);
}
console.log(`   • nombre:    ${nombreCentro}`);
console.log(`   • location:  ${location}`);
console.log(`   • fin memb.: ${finMembresia}`);

// Algunas redes corporativas (proxies/AV) inyectan su propia CA en la
// cadena TLS y rompen la verificación contra OVH. Para un script local de
// prueba es aceptable relajar la verificación; en producción (Vercel/N8N)
// esto NO sería necesario.
const strictTls = (process.env.SMTP_STRICT_TLS || '').toLowerCase() === 'true';

const transport = nodemailer.createTransport({
  host: smtpHost,
  port,
  secure,
  auth: { user: smtpUser, pass: smtpPass },
  tls: strictTls ? undefined : { rejectUnauthorized: false },
});

try {
  await transport.verify();
} catch (err) {
  console.error('\n❌  No se pudo conectar al servidor SMTP:');
  console.error('    ', err.message || err);
  process.exit(1);
}

try {
  const info = await transport.sendMail({ from, to, ...(cc ? { cc } : {}), subject, html });
  console.log(`\n✅  Enviado. messageId = ${info.messageId}`);
  if (info.accepted?.length) console.log(`    aceptado por: ${info.accepted.join(', ')}`);
  if (info.rejected?.length) console.log(`    rechazado por: ${info.rejected.join(', ')}`);
} catch (sendErr) {
  console.error('\n❌  Error enviando el correo:');
  console.error('    ', sendErr.message || sendErr);
  process.exit(1);
}
