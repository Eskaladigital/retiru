// GET /api/organizer/events/[id]/communications — Communication timeline for an event
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: retreatId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { data: retreat } = await admin
      .from('retreats')
      .select('id')
      .eq('id', retreatId)
      .eq('organizer_id', orgProfile.id)
      .single();

    if (!retreat) return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });

    const { data: conversations } = await admin
      .from('conversations')
      .select(`
        id, attendee_id, last_message_at, attendee_unread, organizer_unread,
        profiles!attendee_id(full_name, email),
        messages(id, sender_id, content, message_type, created_at)
      `)
      .eq('retreat_id', retreatId)
      .order('last_message_at', { ascending: false });

    const timeline = (conversations || []).map((conv: any) => ({
      conversationId: conv.id,
      attendeeName: conv.profiles?.full_name || 'Asistente',
      attendeeEmail: conv.profiles?.email || '',
      unread: conv.organizer_unread || 0,
      lastMessageAt: conv.last_message_at,
      messageCount: conv.messages?.length || 0,
      messages: (conv.messages || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-3)
        .map((m: any) => ({
          id: m.id,
          content: m.content,
          type: m.message_type,
          isOrganizer: m.sender_id === user!.id,
          createdAt: m.created_at,
        })),
    }));

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('Communications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
