// ============================================================================
// RETIRU · Mailing · Cliente SMTP (nodemailer)
//
// Lee las variables SMTP_* de process.env y devuelve un transport verificado.
// Mismo contrato que scripts/mailing.mjs y scripts/send-mailing-test.mjs para
// que el cron de Vercel, el panel /administrator/mails y los scripts locales
// se comporten igual.
// ============================================================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  from: string;
  strictTls: boolean;
};

export function loadSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASSWORD || '';
  if (!host || !user || !pass) {
    throw new Error('Faltan SMTP_HOST / SMTP_USER / SMTP_PASSWORD en el entorno');
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  const fromName = process.env.SMTP_FROM_NAME || 'Retiru';
  const strictTls = (process.env.SMTP_STRICT_TLS || '').toLowerCase() === 'true';
  return {
    host,
    port,
    secure,
    user,
    fromEmail,
    fromName,
    from: `${fromName} <${fromEmail}>`,
    strictTls,
  };
}

export function buildTransport(cfg: SmtpConfig = loadSmtpConfig()): Transporter {
  const pass = process.env.SMTP_PASSWORD || '';
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass },
    tls: cfg.strictTls ? undefined : { rejectUnauthorized: false },
  });
}

// Heurística para detectar respuestas SMTP típicas de rate-limiting (OVH / etc.).
// Replicado 1:1 de scripts/mailing.mjs para que el cron y el script se comporten
// igual frente a un "421 Too many messages".
export function looksLikeRateLimitError(msg: string): boolean {
  const m = (msg || '').toLowerCase();
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
