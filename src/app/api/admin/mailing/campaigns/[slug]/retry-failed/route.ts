// POST /api/admin/mailing/campaigns/[slug]/retry-failed
//
// Resetea todas las filas failed a pending (borra failed_reason). No relanza
// la campaña por sí solo: si está "sent", la vuelve a poner en "sending" para
// que el cron vuelva a intentarlo.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  const { count: failedCount } = await guard.ctx.sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'failed');

  if (!failedCount) {
    return NextResponse.json({ ok: true, moved: 0, note: 'No hay fallidos.' });
  }

  const { error } = await guard.ctx.sb
    .from('mailing_recipients')
    .update({ status: 'pending', failed_reason: null })
    .eq('campaign_id', campaign.id)
    .eq('status', 'failed');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const campaignPatch: Record<string, unknown> = {
    failed_count: 0,
    last_tick_note: `${failedCount} fallidos movidos a pending para reintentar.`,
  };
  if (campaign.status === 'sent') {
    campaignPatch.status = 'sending';
    campaignPatch.completed_at = null;
  }
  await guard.ctx.sb.from('mailing_campaigns').update(campaignPatch).eq('id', campaign.id);

  return NextResponse.json({ ok: true, moved: failedCount });
}
