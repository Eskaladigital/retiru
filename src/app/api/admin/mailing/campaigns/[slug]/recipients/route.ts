// GET /api/admin/mailing/campaigns/[slug]/recipients?status=pending&limit=50&offset=0
//
// Listado paginado y filtrable por status. Devuelve también counters por
// status para pintar contadores en la UI sin otra llamada.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ slug: string }> };

const VALID_STATUSES = new Set(['pending', 'sent', 'failed', 'skipped_opt_out', 'skipped_no_email', 'bounced']);

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 50), 500);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  let query = guard.ctx.sb
    .from('mailing_recipients')
    .select('id, email, nombre_centro, location, status, failed_reason, sent_at, updated_at, created_at', { count: 'exact' })
    .eq('campaign_id', campaign.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && VALID_STATUSES.has(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    recipients: data || [],
    total: count || 0,
    limit,
    offset,
  });
}
