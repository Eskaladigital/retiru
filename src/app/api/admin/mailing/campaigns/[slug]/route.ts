// GET   /api/admin/mailing/campaigns/[slug]   → detalle completo + stats
// PATCH /api/admin/mailing/campaigns/[slug]   → editar subject/description/audience_filter/max_per_hour/batch_size_per_tick/html_content
// DELETE/api/admin/mailing/campaigns/[slug]   → borrar (solo si está en draft)
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const { data: stats, error } = await guard.ctx.sb
    .from('mailing_campaigns_stats')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!stats) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  // Incluimos el html_content sólo en el detalle (no en el listado) para evitar
  // pagar transferencia en la vista de tabla.
  const { data: raw } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('html_content, generation_prompt, generation_reference_ids')
    .eq('id', stats.id)
    .maybeSingle();

  return NextResponse.json({
    campaign: {
      ...stats,
      html_content: raw?.html_content || null,
      generation_prompt: raw?.generation_prompt || null,
      generation_reference_ids: raw?.generation_reference_ids || [],
    },
  });
}

type PatchBody = {
  subject?: string;
  description?: string | null;
  max_per_hour?: number;
  batch_size_per_tick?: number;
  html_content?: string;
  audience_filter?: Record<string, unknown>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    return NextResponse.json({ error: 'Una campaña archivada no se puede editar' }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const patch: Record<string, unknown> = {};

  if (typeof body.subject === 'string') {
    const v = body.subject.trim();
    if (!v) return NextResponse.json({ error: 'El asunto no puede quedar vacío' }, { status: 400 });
    patch.subject = v;
  }
  if (body.description !== undefined) {
    patch.description = typeof body.description === 'string' ? body.description.trim() || null : null;
  }
  if (typeof body.max_per_hour === 'number' && body.max_per_hour >= 1 && body.max_per_hour <= 5000) {
    patch.max_per_hour = Math.round(body.max_per_hour);
  }
  if (typeof body.batch_size_per_tick === 'number' && body.batch_size_per_tick >= 1 && body.batch_size_per_tick <= 50) {
    patch.batch_size_per_tick = Math.round(body.batch_size_per_tick);
  }
  if (typeof body.html_content === 'string') {
    patch.html_content = body.html_content;
  }
  if (body.audience_filter && typeof body.audience_filter === 'object') {
    patch.audience_filter = body.audience_filter;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const { data, error } = await guard.ctx.sb
    .from('mailing_campaigns')
    .update(patch)
    .eq('id', campaign.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  if (campaign.status !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden borrar campañas en estado draft' }, { status: 409 });
  }

  // ON DELETE CASCADE en mailing_recipients se encarga de limpiar.
  const { error } = await guard.ctx.sb.from('mailing_campaigns').delete().eq('id', campaign.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
