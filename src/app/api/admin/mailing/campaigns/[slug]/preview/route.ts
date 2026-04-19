// GET /api/admin/mailing/campaigns/[slug]/preview?centerSlug=yoga-sala-madrid
//
// Devuelve el HTML de la campaña renderizado con los placeholders sustituidos
// por los datos reales del centro (o valores por defecto si no se especifica).
// Se usa como `src` de un <iframe> en el panel.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';
import {
  renderTemplate,
  defaultFinMembresia,
  finMembresiaFromCenterCreatedAt,
  unsubscribeUrlFor,
} from '@/lib/mailing/render';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, subject, html_content')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  if (!campaign.html_content) {
    return new NextResponse(
      '<!doctype html><html><body style="font-family:system-ui;padding:2rem;color:#7a6b5d"><p>Esta campaña todavía no tiene HTML. Genera el mail con la IA para verlo aquí.</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const { searchParams } = new URL(request.url);
  const centerSlug = searchParams.get('centerSlug');

  let nombre = 'tu centro';
  let location = 'tu zona';
  let fin = defaultFinMembresia();
  let token: string | null = null;

  if (centerSlug) {
    const { data: center } = await guard.ctx.sb
      .from('centers')
      .select('name, city, province, created_at, marketing_opt_out_token')
      .eq('slug', centerSlug)
      .maybeSingle();
    if (center) {
      nombre = center.name || nombre;
      location = [center.city, center.province].filter(Boolean).join(', ') || location;
      fin = finMembresiaFromCenterCreatedAt(center.created_at) || fin;
      token = center.marketing_opt_out_token || null;
    }
  }

  const html = renderTemplate(campaign.html_content, {
    NOMBRE_CENTRO: nombre,
    LOCATION: location,
    FIN_MEMBRESIA: fin,
    UNSUBSCRIBE_URL: unsubscribeUrlFor(token),
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
