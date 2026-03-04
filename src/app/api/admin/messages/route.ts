import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// GET /api/admin/messages — listar todas las conversaciones (solo admin)
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const retreatFilter = searchParams.get('retreat_id');
  const userFilter = searchParams.get('user_id');

  let query = supabase
    .from('conversations')
    .select(`
      id, retreat_id, user_id, organizer_id, last_message_at,
      attendee_unread, organizer_unread, created_at,
      retreats!retreat_id(id, title_es, slug),
      profiles!user_id(id, full_name, email),
      organizer_profiles!organizer_id(id, business_name, user_id)
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (retreatFilter) query = query.eq('retreat_id', retreatFilter);
  if (userFilter) query = query.eq('user_id', userFilter);

  const { data: conversations, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Obtener último mensaje de cada conversación
  const convIds = (conversations || []).map((c: any) => c.id);
  let lastMessages: Record<string, any> = {};

  if (convIds.length > 0) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, message_type')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    for (const m of msgs || []) {
      if (!lastMessages[m.conversation_id]) {
        lastMessages[m.conversation_id] = m;
      }
    }
  }

  const enriched = (conversations || []).map((c: any) => ({
    ...c,
    retreat: c.retreats,
    user_profile: c.profiles,
    organizer: c.organizer_profiles,
    last_message: lastMessages[c.id] || null,
    total_unread: (c.attendee_unread || 0) + (c.organizer_unread || 0),
  }));

  return NextResponse.json({ conversations: enriched });
}
