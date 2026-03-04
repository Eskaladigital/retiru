import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const WELCOME_MSG =
  'Hola, soy Andrea, responsable de atención al cliente de Retiru. ¿En qué puedo ayudarte?';

// POST /api/messages/support — crear o recuperar conversación de soporte
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_support', true)
    .single();

  if (existing) {
    return NextResponse.json({ conversation_id: existing.id, created: false });
  }

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      attendee_id: user.id,
      is_support: true,
      last_message_at: new Date().toISOString(),
      attendee_unread: 1,
      organizer_unread: 0,
      admin_unread: 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_id: user.id,
    content: WELCOME_MSG,
    message_type: 'system',
    is_read: false,
  });

  return NextResponse.json({ conversation_id: conv.id, created: true });
}
