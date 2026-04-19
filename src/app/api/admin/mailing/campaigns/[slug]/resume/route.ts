// POST /api/admin/mailing/campaigns/[slug]/resume
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
    .select('id, status, is_paused')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  // Reanudar = solo quitar el flag is_paused en una campaña que YA está en
  // 'sending'. Nunca hace draft → sending: ese salto solo ocurre vía el botón
  // "Lanzar campaña" (endpoint /start), que valida HTML + asunto + audiencia.
  if (campaign.status !== 'sending') {
    return NextResponse.json({
      error: campaign.status === 'draft'
        ? 'La campaña está en borrador. Usa el botón "Lanzar campaña" para iniciarla.'
        : `No se puede reanudar una campaña en "${campaign.status}"`,
    }, { status: 409 });
  }
  const patch: Record<string, unknown> = {
    is_paused: false,
    last_tick_note: 'Reanudada manualmente desde el panel.',
  };

  const { error } = await guard.ctx.sb.from('mailing_campaigns').update(patch).eq('id', campaign.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
