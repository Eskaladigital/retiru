// POST /api/admin/mailing/campaigns/[slug]/start
//
// Valida y pasa la campaña a status='sending' (is_paused=false) para que el
// cron empiece a enviarla en el próximo tick.
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
    .select('id, status, html_content, subject')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  if (!campaign.html_content) {
    return NextResponse.json({ error: 'La campaña no tiene HTML. Genera el mail con la IA antes de lanzarla.' }, { status: 400 });
  }
  if (!campaign.subject) {
    return NextResponse.json({ error: 'Falta el asunto de la campaña' }, { status: 400 });
  }

  const { count: pendingCount } = await guard.ctx.sb
    .from('mailing_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending');

  if (!pendingCount || pendingCount === 0) {
    return NextResponse.json({ error: 'No hay destinatarios pending. Carga la audiencia antes de lanzar.' }, { status: 400 });
  }

  if (campaign.status === 'sent' || campaign.status === 'archived') {
    return NextResponse.json({ error: `La campaña ya está en estado "${campaign.status}"` }, { status: 409 });
  }

  const patch: Record<string, unknown> = {
    status: 'sending',
    is_paused: false,
    last_tick_note: 'Campaña lanzada. El cron empezará en ≤ 1 min.',
  };
  if (campaign.status === 'draft') {
    patch.started_at = new Date().toISOString();
  }

  const { error } = await guard.ctx.sb.from('mailing_campaigns').update(patch).eq('id', campaign.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, pending: pendingCount });
}
