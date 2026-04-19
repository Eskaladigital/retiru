// ============================================================================
// RETIRU · Mailing · Envío de un destinatario
//
// Función compartida entre:
//   · /api/cron/mailing-tick           → worker de Vercel cada minuto
//   · /api/admin/mailing/.../send-test → test puntual desde el panel
//
// Toma una campaña (con html_content ya resuelto) y una fila de
// mailing_recipients, la renderiza con los placeholders, envía por SMTP y
// actualiza el estado en BD.
// ============================================================================

import type { Transporter } from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { looksLikeRateLimitError, loadSmtpConfig } from './transport';
import { renderTemplate, unsubscribeUrlFor } from './render';

export type CampaignForSend = {
  id: string;
  slug: string;
  subject: string;
  html_content: string;
};

export type RecipientForSend = {
  id: string;
  center_id: string | null;
  email: string;
  nombre_centro: string | null;
  location: string | null;
  fin_membresia: string | null;
};

export type SendResult =
  | { kind: 'sent'; messageId: string | null }
  | { kind: 'skipped_opt_out'; reason: string }
  | { kind: 'failed'; reason: string; rateLimit: boolean }
  | { kind: 'rate_limited'; reason: string };

/**
 * Devuelve el token de opt-out del centro (si lo hay) y marca skipped_opt_out
 * si el centro se ha dado de baja. Separado para que los tests puedan reusarlo.
 */
export async function resolveCenterOptOut(
  sb: SupabaseClient,
  centerId: string | null,
): Promise<{ optedOut: boolean; token: string | null }> {
  if (!centerId) return { optedOut: false, token: null };
  const { data } = await sb
    .from('centers')
    .select('marketing_opt_out_token, marketing_opt_out_at')
    .eq('id', centerId)
    .maybeSingle();
  if (!data) return { optedOut: false, token: null };
  return {
    optedOut: !!data.marketing_opt_out_at,
    token: data.marketing_opt_out_token || null,
  };
}

/**
 * Renderiza la plantilla de la campaña con los datos del destinatario y la
 * devuelve junto a la URL de opt-out final. No hace envío. Reutilizable para
 * el endpoint /preview y para send-test.
 */
export async function renderCampaignHtmlFor(
  sb: SupabaseClient,
  campaign: Pick<CampaignForSend, 'html_content'>,
  recipient: Pick<RecipientForSend, 'center_id' | 'nombre_centro' | 'location' | 'fin_membresia'>,
): Promise<{ html: string; unsubscribeUrl: string }> {
  const { token } = await resolveCenterOptOut(sb, recipient.center_id);
  const unsubscribeUrl = unsubscribeUrlFor(token);
  const html = renderTemplate(campaign.html_content, {
    NOMBRE_CENTRO: recipient.nombre_centro || 'tu centro',
    LOCATION: recipient.location || 'tu zona',
    FIN_MEMBRESIA: recipient.fin_membresia || '',
    UNSUBSCRIBE_URL: unsubscribeUrl,
  });
  return { html, unsubscribeUrl };
}

/**
 * Envía un mailing a un destinatario y actualiza mailing_recipients con el
 * resultado. Devuelve qué ha pasado para que el llamador decida si pausar
 * la campaña (rate_limited) o continuar.
 */
export async function sendOneRecipient(
  sb: SupabaseClient,
  transport: Transporter,
  campaign: CampaignForSend,
  recipient: RecipientForSend,
): Promise<SendResult> {
  // Seguridad: relectura de opt-out inmediatamente antes de enviar.
  const { optedOut, token } = await resolveCenterOptOut(sb, recipient.center_id);
  if (optedOut) {
    await sb.from('mailing_recipients').update({
      status: 'skipped_opt_out',
      failed_reason: 'opt-out detectado antes de enviar',
    }).eq('id', recipient.id);
    return { kind: 'skipped_opt_out', reason: 'opt-out' };
  }

  const unsubscribeUrl = unsubscribeUrlFor(token);
  const html = renderTemplate(campaign.html_content, {
    NOMBRE_CENTRO: recipient.nombre_centro || 'tu centro',
    LOCATION: recipient.location || 'tu zona',
    FIN_MEMBRESIA: recipient.fin_membresia || '',
    UNSUBSCRIBE_URL: unsubscribeUrl,
  });

  const cfg = loadSmtpConfig();

  try {
    const info = await transport.sendMail({
      from: cfg.from,
      to: recipient.email,
      subject: campaign.subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:contacto@retiru.com?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    await sb.from('mailing_recipients').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_id: info.messageId || null,
      failed_reason: null,
    }).eq('id', recipient.id);
    return { kind: 'sent', messageId: info.messageId || null };
  } catch (e) {
    const reason = String((e as Error)?.message || e).slice(0, 500);
    const rateLimit = looksLikeRateLimitError(reason);
    if (rateLimit) {
      // La fila se queda en pending → se reintentará en el siguiente tick (cuando la
      // campaña se haya pausado y reanudado). No incrementamos failed_count.
      return { kind: 'rate_limited', reason };
    }
    await sb.from('mailing_recipients').update({
      status: 'failed',
      failed_reason: reason,
    }).eq('id', recipient.id);
    return { kind: 'failed', reason, rateLimit: false };
  }
}

/**
 * Envía un test puntual (no toca mailing_recipients). Lo usan:
 *   · /api/admin/mailing/.../send-test
 *   · el botón "Enviar test" en el panel.
 */
export async function sendTestEmail(
  sb: SupabaseClient,
  transport: Transporter,
  opts: {
    to: string;
    subject: string;
    html_content: string;
    centerId?: string | null;
    nombreCentro?: string | null;
    location?: string | null;
    finMembresia?: string | null;
  },
): Promise<{ messageId: string | null }> {
  const cfg = loadSmtpConfig();
  const { token } = await resolveCenterOptOut(sb, opts.centerId || null);
  const unsubscribeUrl = unsubscribeUrlFor(token);
  const html = renderTemplate(opts.html_content, {
    NOMBRE_CENTRO: opts.nombreCentro || 'tu centro',
    LOCATION: opts.location || 'tu zona',
    FIN_MEMBRESIA: opts.finMembresia || '',
    UNSUBSCRIBE_URL: unsubscribeUrl,
  });
  const info = await transport.sendMail({
    from: cfg.from,
    to: opts.to,
    subject: opts.subject,
    html,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:contacto@retiru.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  return { messageId: info.messageId || null };
}
