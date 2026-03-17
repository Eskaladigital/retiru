import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendNewMessageEmail } from '@/lib/email';

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
      id, retreat_id, user_id, organizer_id, attendee_unread, organizer_unread, admin_unread, is_support,
      retreats!retreat_id(id, title_es, title_en, slug),
      profiles!user_id(id, full_name, avatar_url),
      organizer_profiles!organizer_id(id, business_name, logo_url, user_id)
    `)
    .eq('id', id)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

  const isSupport = !!(conv as any).is_support;
  const orgUserId = (conv as any).organizer_profiles?.user_id;
  const isOrganizer = !isSupport && orgUserId === user.id;
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

      const updateField = isUser ? 'attendee_unread' : 'organizer_unread';
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', id);
    }
  }

  // Admin: al revisar, resetear contadores (usa admin client para bypassear RLS)
  if (isAdmin) {
    const admin = createAdminSupabase();
    if (isSupport) {
      await admin.from('conversations').update({ admin_unread: 0 }).eq('id', id);
    } else {
      await admin.from('conversations').update({ attendee_unread: 0, organizer_unread: 0 }).eq('id', id);
    }
  }

  return NextResponse.json({
    conversation: {
      ...conv,
      is_support: isSupport,
      retreat: (conv as any).retreats,
      user_profile: (conv as any).profiles,
      organizer: isSupport ? null : (conv as any).organizer_profiles,
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
    .select('id, user_id, organizer_id, is_support, organizer_profiles!organizer_id(user_id)')
    .eq('id', id)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });

  const isSupport = !!(conv as any).is_support;
  const orgUserId = (conv as any).organizer_profiles?.user_id;
  const isOrganizer = !isSupport && orgUserId === user.id;
  const isUser = conv.user_id === user.id;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  // En conversaciones de soporte: admin y usuario pueden escribir
  // En conversaciones normales: usuario y organizador pueden escribir
  if (isSupport) {
    if (!isUser && !isAdmin) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  } else {
    if (!isUser && !isOrganizer) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  }

  // Insertar mensaje (admin usa adminSupabase para bypassear RLS de sender_id)
  const insertClient = isAdmin ? createAdminSupabase() : supabase;
  const { data: msg, error } = await insertClient
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
  const updateClient = (isAdmin || isSupport) ? createAdminSupabase() : supabase;
  let unreadField: string;
  if (isSupport) {
    unreadField = isAdmin ? 'attendee_unread' : 'admin_unread';
  } else {
    unreadField = isUser ? 'organizer_unread' : 'attendee_unread';
  }

  const { data: currentConv } = await updateClient
    .from('conversations')
    .select(unreadField)
    .eq('id', id)
    .single();

  await updateClient
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      [unreadField]: ((currentConv as any)?.[unreadField] ?? 0) + 1,
    })
    .eq('id', id);

  // Enviar notificación por email al destinatario (fire-and-forget)
  try {
    const adminClient = createAdminSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com';

    const { data: senderProfile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const senderName = senderProfile?.full_name || 'Retiru';

    let recipientUserId: string | null = null;

    if (isSupport) {
      if (isAdmin) {
        recipientUserId = conv.user_id;
      }
      // Users messaging support: no email to admin (admin checks dashboard)
    } else {
      if (isUser) {
        const orgP = (conv as any).organizer_profiles;
        recipientUserId = orgP?.user_id || null;
      } else if (isOrganizer) {
        recipientUserId = conv.user_id;
      }
    }

    if (recipientUserId) {
      const { data: recipient } = await adminClient
        .from('profiles')
        .select('email, preferred_locale')
        .eq('id', recipientUserId)
        .single();

      if (recipient?.email) {
        const locale = (recipient.preferred_locale || 'es') as 'es' | 'en';
        const convUrl = `${appUrl}/${locale === 'es' ? 'es' : 'en'}/${locale === 'es' ? 'mensajes' : 'messages'}/${id}`;

        let context: string | undefined;
        if (isSupport) {
          context = locale === 'es' ? 'Chat de soporte — Retiru' : 'Support chat — Retiru';
        }

        await sendNewMessageEmail({
          to: recipient.email,
          locale,
          senderName: isAdmin ? 'Retiru — Soporte' : senderName,
          messagePreview: content.trim(),
          conversationUrl: convUrl,
          context,
        });
      }
    }
  } catch (emailErr) {
    console.error('Failed to send message notification email:', emailErr);
  }

  return NextResponse.json({ message: msg });
}
