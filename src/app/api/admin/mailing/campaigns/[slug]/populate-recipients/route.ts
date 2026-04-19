// POST /api/admin/mailing/campaigns/[slug]/populate-recipients
//   body: { audience: 'all' | 'claimed' | 'not_claimed', test_emails?: string }
//
// Carga la lista de destinatarios (inserta filas pending en mailing_recipients)
// respetando opt-outs y filtros de audiencia. Es idempotente: se puede relanzar
// sin duplicar.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import { populateRecipients, type AudienceType } from '@/lib/mailing/audience';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteParams = { params: Promise<{ slug: string }> };

const VALID_AUDIENCES = new Set<AudienceType>(['all', 'claimed', 'not_claimed']);

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const body = await request.json().catch(() => ({}));
  const audience = (body.audience || 'all') as AudienceType;
  const test_emails = typeof body.test_emails === 'string' ? body.test_emails.trim() : null;

  if (!VALID_AUDIENCES.has(audience)) {
    return NextResponse.json({ error: `Audiencia no válida: ${audience}` }, { status: 400 });
  }

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  if (campaign.status === 'archived' || campaign.status === 'sent') {
    return NextResponse.json({ error: 'No se puede recargar destinatarios en una campaña ya terminada' }, { status: 409 });
  }

  try {
    const result = await populateRecipients(guard.ctx.sb, campaign.id, { audience, test_emails });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || String(e) }, { status: 500 });
  }
}
