// POST /api/admin/mailing/campaigns/[slug]/pause
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
  if (campaign.status !== 'sending') {
    return NextResponse.json({ error: `Solo se puede pausar una campaña en "sending" (actual: ${campaign.status})` }, { status: 409 });
  }

  const { error } = await guard.ctx.sb.from('mailing_campaigns').update({
    is_paused: true,
    last_tick_note: 'Pausada manualmente desde el panel.',
  }).eq('id', campaign.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
