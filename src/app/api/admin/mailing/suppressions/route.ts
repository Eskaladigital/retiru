// ============================================================================
// /api/admin/mailing/suppressions
//
// GET    → listar bajas (email_suppressions) con búsqueda opcional ?q=
// POST   → añadir manualmente una baja (source=admin); body: { email, reason? }
// DELETE → revertir una baja; body: { id } ó query ?id=<uuid>
//
// Solo administradores (requireAdmin). La tabla email_suppressions está en RLS
// deny-all; se opera con service_role dentro de requireAdmin().
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';

function isValidEmail(raw: string): boolean {
  if (!raw || raw.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();

  let query = guard.ctx.sb
    .from('email_suppressions')
    .select('id, email, reason, source, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (q) query = query.ilike('email', `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ suppressions: data || [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const emailRaw: string = (body?.email || '').toString().trim().toLowerCase();
  const reason: string | null = body?.reason ? String(body.reason).slice(0, 500) : null;

  if (!isValidEmail(emailRaw)) {
    return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
  }

  // Detectar duplicado sin depender del código 23505 del insert.
  const { data: existing } = await guard.ctx.sb
    .from('email_suppressions')
    .select('id')
    .ilike('email', emailRaw)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Este email ya está en la lista de bajas' },
      { status: 409 },
    );
  }

  // Marcar también los centros que tengan ese email como opt-out, para
  // coherencia con el flujo del formulario público.
  const { data: centers } = await guard.ctx.sb
    .from('centers')
    .select('id, marketing_opt_out_at')
    .ilike('email', emailRaw);

  const ids = (centers || [])
    .filter((c) => !c.marketing_opt_out_at)
    .map((c) => c.id);

  if (ids.length > 0) {
    await guard.ctx.sb
      .from('centers')
      .update({
        marketing_opt_out_at: new Date().toISOString(),
        marketing_opt_out_reason: reason || 'Añadido manualmente por admin',
      })
      .in('id', ids);
  }

  const { data, error } = await guard.ctx.sb
    .from('email_suppressions')
    .insert({ email: emailRaw, reason, source: 'admin' })
    .select('id, email, reason, source, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { suppression: data, centersMarkedOptOut: ids.length },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  let id = url.searchParams.get('id') || '';
  if (!id) {
    const body = await request.json().catch(() => ({}));
    id = body?.id || '';
  }

  if (!id) {
    return NextResponse.json({ error: 'Falta el id de la baja' }, { status: 400 });
  }

  // Solo borramos la fila de email_suppressions. Los centros que estén marcados
  // con marketing_opt_out_at siguen marcados: no sabemos si su opt-out vino del
  // formulario público o de otra vía; el admin puede limpiarlo a mano si quiere.
  const { data, error } = await guard.ctx.sb
    .from('email_suppressions')
    .delete()
    .eq('id', id)
    .select('id, email')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Baja no encontrada' }, { status: 404 });

  return NextResponse.json({ ok: true, removed: data });
}
