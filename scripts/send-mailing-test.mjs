#!/usr/bin/env node
/**
 * RETIRU · Envío de prueba de un mailing HTML
 *
 * Lee un archivo HTML de la carpeta `mailing/` y lo envía a un destinatario
 * para ver cómo llega el email real al inbox antes de lanzarlo a los centros.
 *
 * Soporta dos proveedores:
 *   1. SMTP (por defecto)  → usa nodemailer con SMTP_HOST/PORT/USER/PASSWORD.
 *      Pensado para el buzón de OVH (ssl0.ovh.net:465). No toca DNS.
 *   2. Resend (--provider=resend) → HTTP API. Requiere dominio verificado
 *      en Resend y RESEND_API_KEY.
 *
 * Selecciona automáticamente el proveedor:
 *   - Si hay SMTP_HOST + SMTP_USER + SMTP_PASSWORD → SMTP.
 *   - Si no, si hay RESEND_API_KEY válida → Resend.
 *   - En caso contrario, muestra qué falta.
 *
 * Uso:
 *   node scripts/send-mailing-test.mjs                                    # recordatorio a contacto@retiru.com por SMTP
 *   node scripts/send-mailing-test.mjs --provider=resend                  # forzar Resend
 *   node scripts/send-mailing-test.mjs --file=retiru-bienvenida-centro.html
 *   node scripts/send-mailing-test.mjs --to=otroemail@dominio.com
 *   node scripts/send-mailing-test.mjs --subject="Asunto custom"
 *   node scripts/send-mailing-test.mjs --nombre="Yoga Sala Madrid" --location="Madrid"
 *   node scripts/send-mailing-test.mjs --from="Retiru <contacto@retiru.com>"
 *
 * Variables .env.local (SMTP):
 *   SMTP_HOST          p.ej. ssl0.ovh.net
 *   SMTP_PORT          465 (SSL) o 587 (STARTTLS)
 *   SMTP_USER          p.ej. contacto@retiru.com
 *   SMTP_PASSWORD      contraseña del buzón
 *   SMTP_FROM_EMAIL    p.ej. contacto@retiru.com   (opcional; por defecto = SMTP_USER)
 *   SMTP_FROM_NAME     p.ej. Retiru                (opcional)
 *
 * Variables .env.local (Resend):
 *   RESEND_API_KEY     re_...
 *   RESEND_FROM_EMAIL  opcional; por defecto "Retiru <contacto@retiru.com>"
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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

const file = flag('file', 'retiru-recordatorio-centro.html');
const to = flag('to', 'contacto@retiru.com');
const subject = flag(
  'subject',
  file.includes('recordatorio')
    ? '¿Aún no has reclamado tu centro en Retiru?'
    : file.includes('bienvenida')
      ? 'Enhorabuena, tu centro ha sido incluido en Retiru'
      : 'Prueba de mailing Retiru',
);
const nombreCentro = flag('nombre', 'tu centro');
const location = flag('location', 'tu zona');

// ─── Selección de proveedor ────────────────────────────────────────────────
const providerFlag = flag('provider', null);

const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpReady = Boolean(smtpHost && smtpUser && smtpPass && !smtpPass.startsWith('your_'));

const resendKey = process.env.RESEND_API_KEY;
const resendReady = Boolean(resendKey && !resendKey.startsWith('your_'));

let provider;
if (providerFlag === 'smtp') provider = 'smtp';
else if (providerFlag === 'resend') provider = 'resend';
else if (smtpReady) provider = 'smtp';
else if (resendReady) provider = 'resend';
else {
  console.error('❌  No hay proveedor de email configurado en .env.local.');
  console.error('    Opción 1 (recomendada, sin tocar DNS): SMTP de OVH');
  console.error('      SMTP_HOST=ssl0.ovh.net');
  console.error('      SMTP_PORT=465');
  console.error('      SMTP_USER=contacto@retiru.com');
  console.error('      SMTP_PASSWORD=********');
  console.error('    Opción 2: Resend (requiere dominio verificado en resend.com/domains)');
  console.error('      RESEND_API_KEY=re_XXXXXXXXXXXX');
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
  .replaceAll('{{LOCATION}}', location);

// ─── Envío ─────────────────────────────────────────────────────────────────
if (provider === 'smtp') {
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
  console.log(`   • asunto:    ${subject}`);

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
    const info = await transport.sendMail({ from, to, subject, html });
    console.log(`\n✅  Enviado. messageId = ${info.messageId}`);
    if (info.accepted?.length) console.log(`    aceptado por: ${info.accepted.join(', ')}`);
    if (info.rejected?.length) console.log(`    rechazado por: ${info.rejected.join(', ')}`);
  } catch (err) {
    console.error('\n❌  Error al enviar por SMTP:');
    console.error('    ', err.message || err);
    process.exit(1);
  }
} else {
  const from = flag('from', process.env.RESEND_FROM_EMAIL || 'Retiru <contacto@retiru.com>');

  console.log('📧  Enviando por Resend:');
  console.log(`   • plantilla: ${file}`);
  console.log(`   • de:        ${from}`);
  console.log(`   • para:      ${to}`);
  console.log(`   • asunto:    ${subject}`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`\n❌  Resend devolvió ${res.status}:`, data);
    process.exit(1);
  }
  console.log(`\n✅  Enviado. id = ${data.id ?? '(sin id)'}`);
}
