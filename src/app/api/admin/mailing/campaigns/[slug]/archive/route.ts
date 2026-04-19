// POST /api/admin/mailing/campaigns/[slug]/archive
//
// Marca la campaña como 'archived'. No mueve ficheros (las nuevas campañas
// viven en BD, el script mailing.mjs es el que movía archivos en filesystem).
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
  if (campaign.status === 'archived') {
    return NextResponse.json({ ok: true, note: 'Ya estaba archivada.' });
  }

  const { error } = await guard.ctx.sb.from('mailing_campaigns').update({
    status: 'archived',
    archived_at: new Date().toISOString(),
  }).eq('id', campaign.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
