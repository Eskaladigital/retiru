// ============================================================================
// RETIRU · Mailing · Helper de autorización admin para los endpoints del CRM
//
// Centraliza la validación de "este usuario es admin" para que todos los
// route handlers bajo /api/admin/mailing/ tengan el mismo comportamiento
// sin repetir 5 líneas cada uno.
// ============================================================================

import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminCtx = {
  userId: string;
  sb: SupabaseClient;
};

export type AdminGuardResult =
  | { ok: true; ctx: AdminCtx }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!adminRole) {
    return { ok: false, response: NextResponse.json({ error: 'Solo administradores' }, { status: 403 }) };
  }
  return { ok: true, ctx: { userId: user.id, sb: createAdminSupabase() } };
}
