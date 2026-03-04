import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/messages/conversations/[id] — obtener mensajes de una conversación
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verificar participación
  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id, retreat_id, user_id, organizer_id, attendee_unread, organizer_unread,
      retreats!retreat_id(id, title_es, title_en, slug),
      profiles!user_id(id, full_name, avatar_url),
      organizer_profiles!organizer_id(id, business_name, logo_url, user_id)
    `)
    .eq('id', id)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

  const orgUserId = (conv as any).organizer_profiles?.user_id;
  const isOrganizer = orgUserId === user.id;
  const isUser = conv.user_id === user.id;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  if (!isUser && !isOrganizer && !isAdmin) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  // Obtener mensajes
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, conversation_id, sender_id, content, message_type, is_read, created_at,
      profiles!sender_id(id, full_name, avatar_url)
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Marcar como leídos los mensajes del otro participante
  if (isUser || isOrganizer) {
    const otherMessages = (messages || []).filter(
      (m: any) => m.sender_id !== user.id && !m.is_read
    );
    if (otherMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', otherMessages.map((m: any) => m.id));

      // Resetear contador de no leídos
      const updateField = isUser ? 'attendee_unread' : 'organizer_unread';
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', id);
    }
  }

  return NextResponse.json({
    conversation: {
      ...conv,
      retreat: (conv as any).retreats,
      user_profile: (conv as any).profiles,
      organizer: (conv as any).organizer_profiles,
    },
    messages: messages || [],
    my_role: isOrganizer ? 'organizer' : isAdmin ? 'admin' : 'user',
  });
}

// POST /api/messages/conversations/[id] — enviar mensaje
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { content } = body;
  if (!content?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });

  // Verificar participación
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, user_id, organizer_id, organizer_profiles!organizer_id(user_id)')
    .eq('id', id)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

  const orgUserId = (conv as any).organizer_profiles?.user_id;
  const isOrganizer = orgUserId === user.id;
  const isUser = conv.user_id === user.id;

  if (!isUser && !isOrganizer) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  // Insertar mensaje
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'text',
    })
    .select('id, conversation_id, sender_id, content, message_type, is_read, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Actualizar last_message_at y contador de no leídos del otro
  const unreadField = isUser ? 'organizer_unread' : 'attendee_unread';
  await supabase.rpc('increment_field', { table_name: 'conversations', field_name: unreadField, row_id: id });

  // Fallback si no existe la función RPC
  const { data: currentConv } = await supabase
    .from('conversations')
    .select(unreadField)
    .eq('id', id)
    .single();

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      [unreadField]: ((currentConv as any)?.[unreadField] ?? 0) + 1,
    })
    .eq('id', id);

  return NextResponse.json({ message: msg });
}
