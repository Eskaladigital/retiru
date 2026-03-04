import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const SYSTEM_WARNING = 'Bienvenido a la conversación. Recuerda: compartir datos de contacto o intentar contactar por canales externos a Retiru puede conllevar la expulsión de la plataforma.';

// GET /api/messages/conversations — listar conversaciones del usuario actual
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const { data: orgProfile } = await supabase
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id, retreat_id, user_id, organizer_id, last_message_at,
      attendee_unread, organizer_unread, admin_unread, is_support, created_at,
      retreats!retreat_id(id, title_es, title_en, slug),
      profiles!user_id(id, full_name, avatar_url),
      organizer_profiles!organizer_id(id, business_name, logo_url, user_id)
    `)
    .or(
      `user_id.eq.${user.id}${orgProfile ? `,organizer_id.eq.${orgProfile.id}` : ''}`
    )
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (conversations || []).map((c: any) => {
    if (c.is_support) {
      return {
        ...c,
        unread_count: c.attendee_unread,
        my_role: 'user',
        retreat: null,
        other_participant: { id: 'support', business_name: 'Andrea - Soporte Retiru', logo_url: '/favicon.png' },
      };
    }
    const isOrganizer = orgProfile && c.organizer_id === orgProfile.id;
    return {
      ...c,
      unread_count: isOrganizer ? c.organizer_unread : c.attendee_unread,
      my_role: isOrganizer ? 'organizer' : 'user',
      retreat: c.retreats,
      other_participant: isOrganizer ? c.profiles : c.organizer_profiles,
    };
  });

  return NextResponse.json({ conversations: enriched });
}

// POST /api/messages/conversations — crear o recuperar conversación
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { retreat_id } = body;
  if (!retreat_id) return NextResponse.json({ error: 'retreat_id requerido' }, { status: 400 });

  const { data: retreat } = await supabase
    .from('retreats')
    .select('id, organizer_id, status')
    .eq('id', retreat_id)
    .single();

  if (!retreat) return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 });
  if (retreat.status !== 'published') return NextResponse.json({ error: 'Retiro no publicado' }, { status: 400 });

  const { data: orgProfile } = await supabase
    .from('organizer_profiles')
    .select('id, user_id')
    .eq('id', retreat.organizer_id)
    .single();

  if (!orgProfile) return NextResponse.json({ error: 'Organizador no encontrado' }, { status: 404 });
  if (orgProfile.user_id === user.id) return NextResponse.json({ error: 'No puedes escribir a tu propio retiro' }, { status: 400 });

  // Buscar conversación existente
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('retreat_id', retreat_id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ conversation_id: existing.id, created: false });
  }

  // Crear nueva conversación
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({
      retreat_id,
      user_id: user.id,
      attendee_id: user.id,
      organizer_id: retreat.organizer_id,
      last_message_at: new Date().toISOString(),
      attendee_unread: 0,
      organizer_unread: 1,
    })
    .select('id')
    .single();

  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

  // Insertar mensaje de sistema (aviso)
  await supabase.from('messages').insert({
    conversation_id: conv.id,
    sender_id: user.id,
    content: SYSTEM_WARNING,
    message_type: 'system',
    is_read: false,
  });

  return NextResponse.json({ conversation_id: conv.id, created: true });
}
