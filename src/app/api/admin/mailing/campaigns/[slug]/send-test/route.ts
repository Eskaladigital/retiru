// POST /api/admin/mailing/campaigns/[slug]/send-test
//   body: { to: string, centerSlug?: string }
//
// Envía un correo de prueba real por SMTP, con los placeholders renderizados.
// No toca mailing_recipients (es solo preview real).
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import { buildTransport } from '@/lib/mailing/transport';
import { sendTestEmail } from '@/lib/mailing/send';
import { defaultFinMembresia, finMembresiaFromCenterCreatedAt } from '@/lib/mailing/render';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const body = await request.json().catch(() => ({}));
  const to: string = typeof body.to === 'string' ? body.to.trim() : '';
  const centerSlug: string | null = typeof body.centerSlug === 'string' ? body.centerSlug.trim() || null : null;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'Email de destino no válido' }, { status: 400 });
  }

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, subject, html_content')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  if (!campaign.html_content) {
    return NextResponse.json({ error: 'La campaña no tiene HTML todavía' }, { status: 400 });
  }

  let nombreCentro = 'tu centro';
  let location = 'tu zona';
  let finMembresia: string | null = defaultFinMembresia();
  let centerId: string | null = null;

  if (centerSlug) {
    const { data: center } = await guard.ctx.sb
      .from('centers')
      .select('id, name, city, province, created_at')
      .eq('slug', centerSlug)
      .maybeSingle();
    if (center) {
      centerId = center.id;
      nombreCentro = center.name || nombreCentro;
      location = [center.city, center.province].filter(Boolean).join(', ') || location;
      finMembresia = finMembresiaFromCenterCreatedAt(center.created_at) || finMembresia;
    }
  }

  try {
    const transport = buildTransport();
    await transport.verify();
    const info = await sendTestEmail(guard.ctx.sb, transport, {
      to,
      subject: `[TEST] ${campaign.subject}`,
      html_content: campaign.html_content,
      centerId,
      nombreCentro,
      location,
      finMembresia,
    });
    return NextResponse.json({ ok: true, messageId: info.messageId, to });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || String(e) }, { status: 500 });
  }
}
