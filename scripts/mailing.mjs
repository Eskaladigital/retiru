#!/usr/bin/env node
/**
 * RETIRU · Orquestador de mailings
 *
 * Subcomandos:
 *   create   → crea la campaña y precarga los destinatarios (status=pending).
 *   send     → envía las filas pending por SMTP, actualiza estado una a una.
 *   status   → muestra contadores y últimas filas fallidas.
 *   archive  → marca la campaña como 'archived' y mueve el HTML a mailing/enviados/.
 *
 * Flujo típico (campaña nueva):
 *   node scripts/mailing.mjs create --template=3-2026-04-28-retiru-crea-tu-evento.html \
 *       --slug=crea-tu-evento-2026-04 \
 *       --subject="Crea tu primer retiro o taller con Retiru" \
 *       --audience=not_claimed       # ver opciones más abajo
 *   node scripts/mailing.mjs send --slug=crea-tu-evento-2026-04 --limit=20 --dry-run
 *   node scripts/mailing.mjs send --slug=crea-tu-evento-2026-04 --limit=50
 *   node scripts/mailing.mjs status --slug=crea-tu-evento-2026-04
 *   node scripts/mailing.mjs archive --slug=crea-tu-evento-2026-04
 *
 * Audiencias soportadas por create:
 *   --audience=all             → centros activos con email (excluye opt-out). Default.
 *   --audience=claimed         → solo centros con claim approved.
 *   --audience=not_claimed     → solo centros sin claim approved (ideal para recordatorios).
 *   --test-emails=a@b.com,c@d.com   → modo lista manual, ignora Supabase. Útil para pruebas internas.
 *
 * Requisitos .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_* (ver send-mailing-test.mjs).
 */

import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const MAILING_DIR = join(root, 'mailing');
const ENVIADOS_DIR = join(MAILING_DIR, 'enviados');

// ─── Cargar .env.local ─────────────────────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const cmd = args[0];
function flag(name, def = null) {
  const f = args.find((a) => a.startsWith(`--${name}=`));
  if (f) return f.split('=').slice(1).join('=');
  return args.includes(`--${name}`) ? true : def;
}

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
function fechaEs(date) {
  return `${date.getDate()} de ${MESES_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function renderTemplate(html, vars) {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? '');
  }
  return out;
}

function resolveTemplatePath(templateArg) {
  // Acepta un nombre de archivo tal cual (ej. "3-2026-04-28-...html" o "app/01-..html").
  if (!templateArg) return null;
  const direct = join(MAILING_DIR, templateArg);
  if (existsSync(direct)) return direct;
  // Fallback: buscar por substring dentro de mailing/.
  const files = readdirSync(MAILING_DIR).filter((f) => f.endsWith('.html'));
  const match = files.find((f) => f.includes(templateArg));
  return match ? join(MAILING_DIR, match) : null;
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retiru.com').replace(/\/$/, '');
}

// ─── create ────────────────────────────────────────────────────────────────
async function cmdCreate() {
  const templateArg = flag('template');
  const slug = flag('slug');
  const subject = flag('subject');
  const description = flag('description', '');
  const audience = flag('audience', 'all');
  const testEmails = flag('test-emails');
  const number = Number(flag('number', 0)) || null;

  if (!templateArg || !slug || !subject) {
    console.error('Uso: node scripts/mailing.mjs create --template=<archivo.html> --slug=<slug> --subject="Asunto" [--audience=all|claimed|not_claimed] [--test-emails=a@b.com,c@d.com]');
    process.exit(1);
  }

  const templatePath = resolveTemplatePath(templateArg);
  if (!templatePath) {
    console.error(`❌ No encuentro la plantilla: ${templateArg}`);
    process.exit(1);
  }
  const templateFile = basename(templatePath);
  console.log(`📄  Plantilla: ${templateFile}`);

  const sb = supabase();

  // Insertar campaña (idempotente: si existe, la reutilizamos si está en draft).
  const { data: existing } = await sb
    .from('mailing_campaigns')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();

  let campaignId = existing?.id;
  if (existing && existing.status !== 'draft') {
    console.error(`❌ La campaña "${slug}" existe y está en estado "${existing.status}". Usa otro slug o el subcomando archive.`);
    process.exit(1);
  }

  if (!campaignId) {
    const { data, error } = await sb
      .from('mailing_campaigns')
      .insert({
        slug,
        number,
        template_file: templateFile,
        subject,
        description: description || null,
        audience_filter: { audience, test_emails: testEmails || null },
        status: 'draft',
      })
      .select('id')
      .single();
    if (error) {
      console.error('❌ Error insertando campaña:', error.message);
      process.exit(1);
    }
    campaignId = data.id;
    console.log(`✨  Campaña creada: ${slug} (id ${campaignId})`);
  } else {
    console.log(`♻️   Reutilizo campaña existente en draft: ${slug} (id ${campaignId})`);
  }

  // Construir lista de destinatarios.
  let recipients = [];

  if (testEmails) {
    recipients = testEmails.split(',').map((e) => ({
      campaign_id: campaignId,
      center_id: null,
      email: e.trim(),
      nombre_centro: 'Test',
      location: '',
      status: 'pending',
    }));
    console.log(`🧪  Modo test-emails: ${recipients.length} destinatarios manuales`);
  } else {
    // Base: centros activos, con email, sin opt-out.
    let query = sb
      .from('centers')
      .select('id, name, email, city, province, created_at, marketing_opt_out_at')
      .eq('status', 'active')
      .not('email', 'is', null)
      .neq('email', '');

    const { data: centers, error } = await query;
    if (error) {
      console.error('❌ Error cargando centros:', error.message);
      process.exit(1);
    }

    // Filtro por claim si hace falta.
    let claimedIds = null;
    if (audience === 'claimed' || audience === 'not_claimed') {
      const { data: claims } = await sb
        .from('center_claims')
        .select('center_id')
        .eq('status', 'approved');
      claimedIds = new Set((claims || []).map((c) => c.center_id));
    }

    // Lista global de emails dados de baja (RGPD): además de centers.marketing_opt_out_at,
    // descartamos cualquier email presente en email_suppressions aunque el centro
    // no esté marcado directamente (p. ej. alta posterior con un email ya bloqueado).
    const { data: suppressions } = await sb
      .from('email_suppressions')
      .select('email');
    const suppressedSet = new Set(
      (suppressions || [])
        .map((s) => (s.email || '').trim().toLowerCase())
        .filter(Boolean)
    );

    let skippedOptOut = 0;
    let skippedAudience = 0;
    for (const c of centers || []) {
      if (c.marketing_opt_out_at) {
        skippedOptOut++;
        continue;
      }
      if (suppressedSet.has((c.email || '').trim().toLowerCase())) {
        skippedOptOut++;
        continue;
      }
      if (audience === 'claimed' && !claimedIds.has(c.id)) { skippedAudience++; continue; }
      if (audience === 'not_claimed' && claimedIds.has(c.id)) { skippedAudience++; continue; }

      const fin = c.created_at ? (() => {
        const d = new Date(c.created_at);
        d.setMonth(d.getMonth() + 6);
        return fechaEs(d);
      })() : null;

      recipients.push({
        campaign_id: campaignId,
        center_id: c.id,
        email: c.email,
        nombre_centro: c.name || null,
        location: [c.city, c.province].filter(Boolean).join(', ') || null,
        fin_membresia: fin,
        status: 'pending',
      });
    }

    console.log(`👥  Candidatos: ${centers?.length || 0} centros activos con email`);
    if (skippedOptOut > 0) console.log(`    → descartados por opt-out: ${skippedOptOut}`);
    if (skippedAudience > 0) console.log(`    → descartados por audiencia "${audience}": ${skippedAudience}`);
    console.log(`    → destinatarios finales: ${recipients.length}`);
  }

  if (recipients.length === 0) {
    console.log('⚠️   No hay destinatarios. Borra la campaña o cambia la audiencia.');
    process.exit(0);
  }

  // Inserción en lotes con deduplicado manual. El índice único es parcial
  // (WHERE center_id IS NOT NULL) y Postgres no admite índices parciales como
  // target de ON CONFLICT, así que filtramos antes de insertar.
  const { data: existingRows } = await sb
    .from('mailing_recipients')
    .select('center_id, email')
    .eq('campaign_id', campaignId);
  const existingByCenter = new Set((existingRows || []).filter((r) => r.center_id).map((r) => r.center_id));
  const existingByEmail = new Set((existingRows || []).filter((r) => !r.center_id).map((r) => r.email));

  // Para test-emails, como no hay center_id, si se relanza create limpiamos
  // los recipients sin center_id de la campaña para insertar los nuevos.
  const withoutCenter = recipients.filter((r) => !r.center_id);
  if (withoutCenter.length > 0) {
    await sb.from('mailing_recipients').delete().eq('campaign_id', campaignId).is('center_id', null);
    existingByEmail.clear();
  }

  const fresh = recipients.filter((r) => {
    if (r.center_id) return !existingByCenter.has(r.center_id);
    return !existingByEmail.has(r.email);
  });
  const skippedDuplicates = recipients.length - fresh.length;
  if (skippedDuplicates > 0) {
    console.log(`   · ${skippedDuplicates} ya estaban en la campaña, se saltan`);
  }

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const chunk = fresh.slice(i, i + CHUNK);
    const { error } = await sb.from('mailing_recipients').insert(chunk);
    if (error) {
      console.error(`❌ Error insertando lote ${Math.floor(i / CHUNK) + 1}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    process.stdout.write(`\r   · insertando ${inserted}/${fresh.length}…`);
  }
  if (fresh.length > 0) process.stdout.write('\n');

  // Total final (real) de pending en BD.
  const { count } = await sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  await sb
    .from('mailing_campaigns')
    .update({ total_recipients: count || 0 })
    .eq('id', campaignId);

  console.log(`\n✅  Campaña lista. ${count} destinatarios en estado pending.`);
  console.log(`   Siguiente paso (recomendado):`);
  console.log(`   node scripts/mailing.mjs send --slug=${slug} --limit=20 --dry-run`);
}

// ─── send ──────────────────────────────────────────────────────────────────
async function cmdSend() {
  const slug = flag('slug');
  const limit = Number(flag('limit', 50));
  const dryRun = flag('dry-run', false) === true;
  const onlyFailed = flag('only-failed', false) === true;
  const delayMs = Number(flag('delay', 800));
  // Rate limiting: respeta el tope del servidor SMTP (p. ej. OVH ≈ 200/h).
  // 0 = desactivado. Con --auto-resume, el script duerme y sigue solo.
  const maxPerHour = Number(flag('max-per-hour', 0));
  const autoResume = flag('auto-resume', false) === true;

  if (!slug) {
    console.error('Uso: node scripts/mailing.mjs send --slug=<slug> [--limit=50] [--dry-run] [--only-failed] [--delay=800] [--max-per-hour=180] [--auto-resume]');
    process.exit(1);
  }

  const sb = supabase();
  const { data: campaign, error: cErr } = await sb
    .from('mailing_campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (cErr || !campaign) {
    console.error(`❌ No encuentro campaña ${slug}: ${cErr?.message || 'no existe'}`);
    process.exit(1);
  }

  // Cargar HTML: prioridad al fichero (compatibilidad legacy); si no existe,
  // se usa html_content de la BD (campañas creadas desde /administrator/mails).
  let rawHtml = null;
  if (campaign.template_file) {
    const templatePath = join(MAILING_DIR, campaign.template_file);
    if (existsSync(templatePath)) {
      rawHtml = readFileSync(templatePath, 'utf8');
    }
  }
  if (!rawHtml && campaign.html_content) {
    rawHtml = campaign.html_content;
    console.log('ℹ️   Usando html_content de la BD (la campaña no tiene archivo en mailing/).');
  }
  if (!rawHtml) {
    console.error(
      `❌ La campaña ${slug} no tiene HTML disponible: ni template_file en mailing/ ni html_content en BD.`,
    );
    process.exit(1);
  }

  const targetStatus = onlyFailed ? 'failed' : 'pending';
  const { data: queue, error: qErr } = await sb
    .from('mailing_recipients')
    .select('id, center_id, email, nombre_centro, location, fin_membresia')
    .eq('campaign_id', campaign.id)
    .eq('status', targetStatus)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (qErr) {
    console.error('❌ Error cargando cola:', qErr.message);
    process.exit(1);
  }
  if (!queue.length) {
    console.log(`ℹ️   No hay filas en estado "${targetStatus}" para ${slug}.`);
    return;
  }

  // Para obtener tokens de opt-out a vuelo (join ligero).
  const centerIds = queue.map((r) => r.center_id).filter(Boolean);
  let tokensByCenter = new Map();
  if (centerIds.length > 0) {
    const { data: toks } = await sb
      .from('centers')
      .select('id, marketing_opt_out_token, marketing_opt_out_at')
      .in('id', centerIds);
    for (const c of toks || []) tokensByCenter.set(c.id, c);
  }

  // Red de seguridad adicional: email_suppressions. Si alguien hizo unsubscribe
  // por email entre la creación de la campaña y el envío, descartamos aquí
  // aunque el centro no se haya actualizado (por ejemplo, alta posterior).
  const { data: suppressionsQueue } = await sb
    .from('email_suppressions')
    .select('email');
  const suppressedQueueSet = new Set(
    (suppressionsQueue || [])
      .map((s) => (s.email || '').trim().toLowerCase())
      .filter(Boolean)
  );

  // Cliente SMTP.
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Faltan SMTP_HOST/USER/PASSWORD en .env.local');
    process.exit(1);
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
  const fromName = process.env.SMTP_FROM_NAME || 'Retiru';
  const from = `${fromName} <${fromEmail}>`;
  const strictTls = (process.env.SMTP_STRICT_TLS || '').toLowerCase() === 'true';
  const transport = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: port === 465,
    auth: { user: smtpUser, pass: smtpPass },
    tls: strictTls ? undefined : { rejectUnauthorized: false },
  });

  if (!dryRun) {
    try { await transport.verify(); }
    catch (e) { console.error('❌ SMTP no disponible:', e.message); process.exit(1); }
  }

  // El paso a 'sending' SOLO se hace desde el panel /administrator/mails
  // (botón "Lanzar campaña"). Este script legacy no lo toca: si la campaña
  // está en draft, se aborta el envío y se pide hacerlo desde la UI. Así nunca
  // se inicia una campaña sin que el admin pulse explícitamente el botón.
  if (campaign.status === 'draft') {
    console.error(
      `❌ La campaña "${slug}" está en estado "draft". Este script ya no ` +
      `inicia campañas por su cuenta. Ve a /administrator/mails/${slug} y ` +
      `pulsa "Lanzar campaña" para pasarla a "sending". Luego el cron enviará ` +
      `solo (o puedes relanzar este script si la quieres ejecutar en local).`
    );
    process.exit(1);
  }
  if (campaign.status === 'sent' || campaign.status === 'archived') {
    console.error(`❌ La campaña "${slug}" está en estado "${campaign.status}". No se puede reenviar.`);
    process.exit(1);
  }

  console.log(`📬  ${dryRun ? 'DRY-RUN' : 'Enviando'} campaña "${slug}" · ${queue.length} filas (${targetStatus})`);
  if (maxPerHour > 0) {
    console.log(`   · Rate limit: ${maxPerHour}/hora  ·  auto-resume=${autoResume}`);
  }
  let sent = 0, failed = 0, skipped = 0;
  let rateLimitAborted = false;

  for (const [i, rec] of queue.entries()) {
    const tag = `[${i + 1}/${queue.length}] ${rec.email}`;

    // ─── Rate limiting horario ───
    // Consultamos la BD (no contador local) para que funcione también aunque
    // el envío se haya partido en varias invocaciones del script.
    if (!dryRun && maxPerHour > 0) {
      const now = Date.now();
      const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      const { count: sentLastHour } = await sb
        .from('mailing_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent')
        .gte('sent_at', oneHourAgo);

      if ((sentLastHour || 0) >= maxPerHour) {
        // Calculamos cuánto hay que esperar: hasta que el n-ésimo más antiguo
        // de la ventana salga de la hora.
        const { data: recent } = await sb
          .from('mailing_recipients')
          .select('sent_at')
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(maxPerHour);
        const oldestInWindow = recent?.[recent.length - 1]?.sent_at;
        const resumeAt = oldestInWindow
          ? new Date(new Date(oldestInWindow).getTime() + 60 * 60 * 1000 + 5000)
          : new Date(now + 60 * 60 * 1000);
        const waitMs = Math.max(resumeAt.getTime() - now, 5000);

        console.log(`\n⏸   Tope horario alcanzado: ${sentLastHour}/${maxPerHour} en los últimos 60 min.`);
        console.log(`    Hora actual:    ${new Date(now).toLocaleTimeString('es-ES')}`);
        console.log(`    Reanudar a las: ${resumeAt.toLocaleTimeString('es-ES')}  (espera ~${Math.ceil(waitMs / 60000)} min)`);

        if (!autoResume) {
          console.log('\n    Usa --auto-resume para que el script espere solo.');
          console.log(`    O relanza manualmente cuando te avise el reloj:`);
          console.log(`       node scripts/mailing.mjs send --slug=${slug} --max-per-hour=${maxPerHour} --auto-resume`);
          rateLimitAborted = true;
          break;
        }

        await countdownSleep(waitMs);
        console.log('▶   Reanudando envíos…\n');
      }
    }

    // Relectura de opt-out por seguridad (podría haberse dado de baja entre create y send).
    const center = tokensByCenter.get(rec.center_id);
    if (center?.marketing_opt_out_at) {
      await sb.from('mailing_recipients').update({
        status: 'skipped_opt_out', failed_reason: 'opt-out detectado antes de enviar',
      }).eq('id', rec.id);
      console.log(`${tag}  ⏭  opt-out`); skipped++; continue;
    }
    if (suppressedQueueSet.has((rec.email || '').trim().toLowerCase())) {
      await sb.from('mailing_recipients').update({
        status: 'skipped_opt_out', failed_reason: 'email en email_suppressions',
      }).eq('id', rec.id);
      console.log(`${tag}  ⏭  suppression`); skipped++; continue;
    }

    const unsubscribeUrl = center?.marketing_opt_out_token
      ? `${baseUrl()}/api/unsubscribe?t=${center.marketing_opt_out_token}`
      : `${baseUrl()}/api/unsubscribe`;

    const html = renderTemplate(rawHtml, {
      NOMBRE_CENTRO: rec.nombre_centro || 'tu centro',
      LOCATION: rec.location || 'tu zona',
      FIN_MEMBRESIA: rec.fin_membresia || '',
      UNSUBSCRIBE_URL: unsubscribeUrl,
    });

    if (dryRun) {
      console.log(`${tag}  ✓ (dry-run, ${html.length} bytes)`); continue;
    }

    try {
      const info = await transport.sendMail({
        from, to: rec.email, subject: campaign.subject, html,
        headers: {
          // Cabecera estándar para clientes que muestran "Darse de baja" en lugar de spam.
          'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:contacto@retiru.com?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      await sb.from('mailing_recipients').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_id: info.messageId || null,
        failed_reason: null,
      }).eq('id', rec.id);
      console.log(`${tag}  ✅  ${info.messageId}`);
      sent++;
    } catch (e) {
      const reason = String(e?.message || e).slice(0, 500);
      const rateLimitHit = looksLikeRateLimitError(reason);

      // Si parece rate-limit del servidor y tenemos autoResume, dejamos la fila
      // en pending (se reintentará) en lugar de marcarla como fallida, y hacemos
      // la pausa estándar.
      if (rateLimitHit && autoResume && !dryRun) {
        console.log(`${tag}  ⏸  SMTP rate-limit detectado: "${reason.slice(0, 120)}"`);
        console.log('    Dejo la fila en pending y duermo 60 min…');
        await countdownSleep(60 * 60 * 1000);
        console.log('▶   Reanudando envíos…\n');
        // no incrementamos failed, no actualizamos status (sigue pending)
      } else {
        await sb.from('mailing_recipients').update({
          status: 'failed', failed_reason: reason,
        }).eq('id', rec.id);
        console.log(`${tag}  ❌  ${reason}`);
        failed++;
        if (rateLimitHit && !dryRun) {
          console.log('    ↑ Parece un límite del servidor SMTP. Considera relanzar con --max-per-hour=150 --auto-resume');
        }
      }
    }

    if (delayMs > 0 && i < queue.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Actualizar contadores en la campaña.
  await recomputeCounters(sb, campaign.id);

  // ¿Queda pending?
  const { count: pendingLeft } = await sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending');

  if ((pendingLeft || 0) === 0 && !onlyFailed && !dryRun) {
    await sb.from('mailing_campaigns').update({
      status: 'sent', completed_at: new Date().toISOString(),
    }).eq('id', campaign.id);
    console.log(`\n🏁  Campaña completada (no quedan pending).`);
  }

  console.log(`\n📊  Resultado de esta tanda: sent=${sent} · failed=${failed} · skipped=${skipped}`);
  console.log(`   pending restantes en la campaña: ${pendingLeft || 0}`);
  if (rateLimitAborted) {
    console.log(`\n⏳  Parado por tope horario. Relanza con --auto-resume cuando quieras que siga solo:`);
    console.log(`    node scripts/mailing.mjs send --slug=${slug} --max-per-hour=${maxPerHour} --auto-resume`);
  }
}

// Duerme N ms mostrando countdown cada 30 s (para que se vea que está vivo).
async function countdownSleep(ms) {
  const end = Date.now() + ms;
  const TICK = 30_000;
  while (Date.now() < end) {
    const remaining = Math.max(0, end - Date.now());
    const mm = Math.floor(remaining / 60000);
    const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
    process.stdout.write(`\r    esperando… ${mm}:${ss} restantes   `);
    await new Promise((r) => setTimeout(r, Math.min(TICK, remaining)));
  }
  process.stdout.write('\r    esperando… 0:00 restantes   \n');
}

// Heurística para detectar respuestas SMTP típicas de rate-limiting OVH / otros.
function looksLikeRateLimitError(msg) {
  const m = msg.toLowerCase();
  return (
    m.includes('421') ||
    m.includes('451 4.7') ||
    m.includes('550 5.7') ||
    m.includes('rate limit') ||
    m.includes('too many') ||
    m.includes('sending limit') ||
    m.includes('quota') ||
    m.includes('try again later')
  );
}

// ─── status ────────────────────────────────────────────────────────────────
async function cmdStatus() {
  const slug = flag('slug');
  const sb = supabase();

  if (!slug) {
    const { data } = await sb
      .from('mailing_campaigns_stats')
      .select('slug, status, subject, total_recipients, sent, pending, failed, skipped_opt_out, skipped_no_email, bounced, created_at')
      .order('created_at', { ascending: false });
    if (!data?.length) { console.log('No hay campañas aún.'); return; }
    console.log('Campañas:');
    for (const c of data) {
      console.log(`\n  ${c.slug}  ·  ${c.status}  ·  ${c.subject}`);
      console.log(`    total=${c.total_recipients}  sent=${c.sent}  pending=${c.pending}  failed=${c.failed}  opt_out=${c.skipped_opt_out}  no_email=${c.skipped_no_email}  bounced=${c.bounced}`);
    }
    return;
  }

  const { data: s } = await sb
    .from('mailing_campaigns_stats')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!s) { console.error(`No existe campaña ${slug}`); process.exit(1); }

  console.log(`\nCampaña ${s.slug}  (${s.status})`);
  console.log(`  Plantilla:    ${s.template_file}`);
  console.log(`  Subject:      ${s.subject}`);
  console.log(`  Creada:       ${s.created_at}`);
  console.log(`  Started:      ${s.started_at || '—'}`);
  console.log(`  Completed:    ${s.completed_at || '—'}`);
  console.log(`  Archivada:    ${s.archived_at || '—'}`);
  console.log(`  Totales:      ${s.total_recipients}`);
  console.log(`    sent:             ${s.sent}`);
  console.log(`    pending:          ${s.pending}`);
  console.log(`    failed:           ${s.failed}`);
  console.log(`    skipped_opt_out:  ${s.skipped_opt_out}`);
  console.log(`    skipped_no_email: ${s.skipped_no_email}`);
  console.log(`    bounced:          ${s.bounced}`);

  if (s.failed > 0) {
    const { data: fails } = await sb
      .from('mailing_recipients')
      .select('email, failed_reason, updated_at')
      .eq('campaign_id', s.id)
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(10);
    console.log('\n  Últimos fallidos:');
    for (const f of fails || []) {
      console.log(`    · ${f.email}  →  ${f.failed_reason?.slice(0, 120) || '—'}`);
    }
    console.log('\n  Para reintentar: node scripts/mailing.mjs send --slug=' + slug + ' --only-failed');
  }
}

// ─── archive ───────────────────────────────────────────────────────────────
async function cmdArchive() {
  const slug = flag('slug');
  if (!slug) { console.error('Uso: archive --slug=<slug>'); process.exit(1); }

  const sb = supabase();
  const { data: c } = await sb
    .from('mailing_campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!c) { console.error(`No existe ${slug}`); process.exit(1); }

  if (c.status === 'archived') {
    console.log('ℹ️   Ya estaba archivada.');
    return;
  }

  const src = join(MAILING_DIR, c.template_file);
  if (!existsSync(ENVIADOS_DIR)) mkdirSync(ENVIADOS_DIR, { recursive: true });

  // Si el archivo no lleva ya el prefijo N-YYYY-MM-DD-, lo añadimos.
  let targetName = c.template_file;
  if (!/^\d+-\d{4}-\d{2}-\d{2}-/.test(targetName)) {
    const n = c.number || await nextCampaignNumber(sb);
    const today = new Date().toISOString().slice(0, 10);
    targetName = `${n}-${today}-${targetName}`;
  }
  const dst = join(ENVIADOS_DIR, targetName);

  if (existsSync(src)) {
    renameSync(src, dst);
    console.log(`📦  Movido: ${c.template_file}  →  enviados/${targetName}`);
  } else {
    console.log(`⚠️   ${c.template_file} ya no existía en mailing/, omito mv.`);
  }

  await sb.from('mailing_campaigns').update({
    status: 'archived',
    archived_at: new Date().toISOString(),
    template_file: targetName,
  }).eq('id', c.id);

  console.log(`🗄️   Campaña ${slug} archivada.`);
}

async function nextCampaignNumber(sb) {
  const { data } = await sb
    .from('mailing_campaigns')
    .select('number')
    .order('number', { ascending: false })
    .limit(1);
  const maxDb = data?.[0]?.number || 0;
  // Además, leemos archivos ya archivados para no chocar con números existentes.
  let maxFs = 0;
  if (existsSync(ENVIADOS_DIR)) {
    for (const f of readdirSync(ENVIADOS_DIR)) {
      const m = f.match(/^(\d+)-/);
      if (m) maxFs = Math.max(maxFs, Number(m[1]));
    }
  }
  return Math.max(maxDb, maxFs) + 1;
}

async function recomputeCounters(sb, campaignId) {
  const { data: rows } = await sb
    .from('mailing_recipients')
    .select('status')
    .eq('campaign_id', campaignId);
  const count = (s) => (rows || []).filter((r) => r.status === s).length;
  await sb.from('mailing_campaigns').update({
    sent_count: count('sent'),
    failed_count: count('failed'),
    skipped_count: count('skipped_opt_out') + count('skipped_no_email') + count('bounced'),
  }).eq('id', campaignId);
}

// ─── Dispatcher ────────────────────────────────────────────────────────────
const HANDLERS = { create: cmdCreate, send: cmdSend, status: cmdStatus, archive: cmdArchive };
if (!cmd || !HANDLERS[cmd]) {
  console.error('Uso: node scripts/mailing.mjs <create|send|status|archive> [opciones]');
  console.error('Detalle completo: abre scripts/mailing.mjs (cabecera) o lee mailing/README.md.');
  process.exit(1);
}
try {
  await HANDLERS[cmd]();
} catch (e) {
  console.error('❌ Error:', e.stack || e.message || e);
  process.exit(1);
}
