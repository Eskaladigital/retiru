// GET  /api/admin/mailing/campaigns        → lista campañas (desde vista de stats)
// POST /api/admin/mailing/campaigns        → crea campaña draft (sin HTML)
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.ctx.sb
    .from('mailing_campaigns_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const subject: string = (body.subject || '').trim();
  const description: string = (body.description || '').trim();
  let slug: string = (body.slug || '').trim();

  if (!subject) {
    return NextResponse.json({ error: 'El asunto es obligatorio' }, { status: 400 });
  }
  if (!slug) slug = slugify(subject);
  slug = slugify(slug);
  if (!slug) return NextResponse.json({ error: 'El slug no puede quedar vacío' }, { status: 400 });

  const { data: existing } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Ya existe una campaña con el slug "${slug}"` }, { status: 409 });
  }

  // Autonumeramos: siguiente al máximo actual.
  const { data: maxRow } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('number')
    .order('number', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const number = ((maxRow?.number as number | null) || 0) + 1;

  const { data, error } = await guard.ctx.sb
    .from('mailing_campaigns')
    .insert({
      slug,
      number,
      subject,
      description: description || null,
      template_file: null,
      status: 'draft',
      audience_filter: {},
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
