// ============================================================================
// RETIRU · Cron · /api/cron/mailing-tick
//
// Invocado cada minuto por Vercel Cron (vercel.json). Cada tick:
//   1. Busca campañas con status='sending' AND is_paused=false.
//   2. Por cada una, comprueba cuántos envíos se han hecho en la última hora;
//      si ≥ max_per_hour, salta (respeta el rate limit de OVH Zimbra).
//   3. Envía hasta batch_size_per_tick correos (con 1 tick/min y batch=3 →
//      ~180 envíos/h, perfectamente dentro del límite conservador de 200/h).
//   4. Si el servidor SMTP responde con rate-limit, pausa la campaña
//      automáticamente (is_paused=true) y registra el motivo en last_tick_note.
//   5. Si ya no quedan pending ni failed, marca la campaña como 'sent'.
//
// Auth: mismo patrón que los crons existentes (Authorization: Bearer CRON_SECRET).
// Vercel Cron hace GET, así que exponemos GET como entrada principal. POST se
// acepta también para lanzar el tick manualmente desde el panel.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { buildTransport, loadSmtpConfig } from '@/lib/mailing/transport';
import { sendOneRecipient, type CampaignForSend, type RecipientForSend } from '@/lib/mailing/send';

export const dynamic = 'force-dynamic';
// Aunque el tick está pensado para terminar en pocos segundos (3 envíos), damos
// margen por si un SMTP lento agota el handshake.
export const maxDuration = 60;

type CampaignRow = {
  id: string;
  slug: string;
  subject: string;
  html_content: string | null;
  status: string;
  is_paused: boolean;
  max_per_hour: number;
  batch_size_per_tick: number;
  started_at: string | null;
};

async function processCampaign(
  sb: ReturnType<typeof createAdminSupabase>,
  transport: ReturnType<typeof buildTransport>,
  campaign: CampaignRow,
): Promise<{ slug: string; attempted: number; sent: number; failed: number; skipped: number; rateLimited: boolean; note: string }> {
  const result = { slug: campaign.slug, attempted: 0, sent: 0, failed: 0, skipped: 0, rateLimited: false, note: '' };

  if (!campaign.html_content) {
    result.note = 'sin html_content';
    await sb.from('mailing_campaigns').update({
      is_paused: true,
      last_tick_at: new Date().toISOString(),
      last_tick_note: 'Pausada: la campaña no tiene html_content. Genera el HTML antes de continuar.',
    }).eq('id', campaign.id);
    return result;
  }

  // 1. ¿Queda cupo horario?
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: sentLastHour } = await sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'sent')
    .gte('sent_at', oneHourAgo);

  const usedLastHour = sentLastHour || 0;
  const hourlyRemaining = Math.max(0, campaign.max_per_hour - usedLastHour);
  if (hourlyRemaining === 0) {
    result.note = `cupo horario lleno: ${usedLastHour}/${campaign.max_per_hour}`;
    await sb.from('mailing_campaigns').update({
      last_tick_at: new Date().toISOString(),
      last_tick_note: `Tope horario alcanzado (${usedLastHour}/${campaign.max_per_hour}). Reanudará automáticamente.`,
    }).eq('id', campaign.id);
    return result;
  }

  const batchSize = Math.min(campaign.batch_size_per_tick, hourlyRemaining);

  // 2. Pick lote pending (ordenado por creación para que sea predecible).
  const { data: queue, error: qErr } = await sb
    .from('mailing_recipients')
    .select('id, center_id, email, nombre_centro, location, fin_membresia')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (qErr) {
    result.note = `error leyendo cola: ${qErr.message}`;
    await sb.from('mailing_campaigns').update({
      last_tick_at: new Date().toISOString(),
      last_tick_note: result.note,
    }).eq('id', campaign.id);
    return result;
  }

  // 3. Si no quedan pending, ¿quedan failed? Si todo está resuelto, cerrar campaña.
  if (!queue || queue.length === 0) {
    const { count: pendingLeft } = await sb
      .from('mailing_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending');

    if ((pendingLeft || 0) === 0) {
      await sb.from('mailing_campaigns').update({
        status: 'sent',
        completed_at: new Date().toISOString(),
        last_tick_at: new Date().toISOString(),
        last_tick_note: 'Campaña enviada (no quedan pending).',
      }).eq('id', campaign.id);
      result.note = 'enviada';
      await recomputeCounters(sb, campaign.id);
    } else {
      result.note = 'sin pending ahora mismo';
    }
    return result;
  }

  // 4. Enviar el batch.
  const campaignForSend: CampaignForSend = {
    id: campaign.id,
    slug: campaign.slug,
    subject: campaign.subject,
    html_content: campaign.html_content,
  };

  for (const row of queue as RecipientForSend[]) {
    result.attempted++;
    const outcome = await sendOneRecipient(sb, transport, campaignForSend, row);
    if (outcome.kind === 'sent') {
      result.sent++;
    } else if (outcome.kind === 'skipped_opt_out') {
      result.skipped++;
    } else if (outcome.kind === 'rate_limited') {
      result.rateLimited = true;
      result.note = `rate-limit SMTP: ${outcome.reason.slice(0, 160)}`;
      // Pausamos la campaña: el admin podrá reanudarla desde el panel cuando
      // considere. El cron, al seguir pausada, la ignorará sin devolver error.
      await sb.from('mailing_campaigns').update({
        is_paused: true,
        last_tick_at: new Date().toISOString(),
        last_tick_note: `Pausada por rate-limit SMTP: "${outcome.reason.slice(0, 200)}". Reanuda desde el panel cuando pase ≥ 60 min.`,
      }).eq('id', campaign.id);
      break; // No seguimos con el resto del batch para esta campaña.
    } else if (outcome.kind === 'failed') {
      result.failed++;
    }
  }

  // 5. Actualizar contadores + timestamp.
  await recomputeCounters(sb, campaign.id);

  if (!result.rateLimited) {
    const note = `batch: ${result.sent} ok · ${result.failed} fail · ${result.skipped} skip · ${usedLastHour + result.sent}/${campaign.max_per_hour} en la última hora`;
    result.note = note;
    await sb.from('mailing_campaigns').update({
      last_tick_at: new Date().toISOString(),
      last_tick_note: note,
    }).eq('id', campaign.id);
  }

  return result;
}

async function recomputeCounters(
  sb: ReturnType<typeof createAdminSupabase>,
  campaignId: string,
) {
  const { data: rows } = await sb
    .from('mailing_recipients')
    .select('status')
    .eq('campaign_id', campaignId);
  const count = (s: string) => (rows || []).filter((r: { status: string }) => r.status === s).length;
  await sb.from('mailing_campaigns').update({
    sent_count: count('sent'),
    failed_count: count('failed'),
    skipped_count: count('skipped_opt_out') + count('skipped_no_email') + count('bounced'),
  }).eq('id', campaignId);
}

async function handleTick(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Pre-flight: que el SMTP esté configurado antes de molestar a Supabase.
  try {
    loadSmtpConfig();
  } catch (e) {
    return NextResponse.json({
      error: (e as Error).message,
      hint: 'Faltan variables SMTP en el entorno de Vercel.',
    }, { status: 500 });
  }

  const sb = createAdminSupabase();
  const { data: campaigns, error } = await sb
    .from('mailing_campaigns')
    .select('id, slug, subject, html_content, status, is_paused, max_per_hour, batch_size_per_tick, started_at')
    .eq('status', 'sending')
    .eq('is_paused', false)
    .order('started_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ ok: true, active: 0, results: [] });
  }

  const transport = buildTransport();
  const results = [];
  for (const c of campaigns as CampaignRow[]) {
    try {
      results.push(await processCampaign(sb, transport, c));
    } catch (e) {
      const msg = (e as Error).message || String(e);
      results.push({ slug: c.slug, attempted: 0, sent: 0, failed: 0, skipped: 0, rateLimited: false, note: `error: ${msg}` });
      await sb.from('mailing_campaigns').update({
        last_tick_at: new Date().toISOString(),
        last_tick_note: `Excepción en tick: ${msg.slice(0, 200)}`,
      }).eq('id', c.id);
    }
  }

  return NextResponse.json({ ok: true, active: campaigns.length, results });
}

export async function GET(request: NextRequest) { return handleTick(request); }
export async function POST(request: NextRequest) { return handleTick(request); }
