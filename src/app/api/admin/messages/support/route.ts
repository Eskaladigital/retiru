// POST /api/admin/messages/support — Admin crea o obtiene conversación de soporte con un usuario
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { targetUserId } = await req.json();
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId es obligatorio' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('is_support', true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversation_id: existing.id, created: false });
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const { data: conv, error } = await admin
    .from('conversations')
    .insert({
      user_id: targetUserId,
      attendee_id: targetUserId,
      is_support: true,
      last_message_at: new Date().toISOString(),
      attendee_unread: 0,
      organizer_unread: 0,
      admin_unread: 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversation_id: conv.id, created: true });
}
