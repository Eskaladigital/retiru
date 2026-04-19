// GET /api/admin/mailing/references
//
// Lista las campañas con html_content disponible para ser usadas como
// referencia de estilo al generar con Nia. Ordenadas por fecha desc.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.ctx.sb
    .from('mailing_campaigns_stats')
    .select('id, slug, subject, number, status, created_at, has_html')
    .eq('has_html', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ references: data || [] });
}
