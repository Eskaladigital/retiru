import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ messageId: string }> };

// DELETE /api/admin/messages/[messageId] — borrar mensaje (solo admin)
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { messageId } = await ctx.params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden borrar mensajes' }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from('messages').delete().eq('id', messageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
