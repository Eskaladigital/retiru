// POST /api/organizer/events/[id]/broadcast — Send message to all attendees
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { buildBroadcastHtml } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'hola@retiru.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: retreatId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { message, sendEmail = false, filter = 'all' } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { data: retreat } = await admin
      .from('retreats')
      .select('id, title_es, organizer_id')
      .eq('id', retreatId)
      .eq('organizer_id', orgProfile.id)
      .single();

    if (!retreat) return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });

    let statusFilter = ['confirmed', 'completed'];
    if (filter === 'pending_payment') {
      statusFilter = ['confirmed'];
    }

    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, attendee_id, remaining_payment_status,
        profiles!attendee_id(email, full_name, preferred_locale)
      `)
      .eq('retreat_id', retreatId)
      .in('status', statusFilter);

    let filtered = bookings || [];
    if (filter === 'pending_payment') {
      filtered = filtered.filter((b: any) => b.remaining_payment_status === 'pending');
    }

    let messagesSent = 0;
    let emailsSent = 0;

    for (const b of filtered) {
      const { data: existingConv } = await admin
        .from('conversations')
        .select('id')
        .eq('retreat_id', retreatId)
        .or(`attendee_id.eq.${b.attendee_id},user_id.eq.${b.attendee_id}`)
        .maybeSingle();

      let convId = existingConv?.id;

      if (!convId) {
        const { data: newConv } = await admin
          .from('conversations')
          .insert({
            retreat_id: retreatId,
            attendee_id: b.attendee_id,
            user_id: b.attendee_id,
            organizer_id: orgProfile.id,
          })
          .select('id')
          .single();
        convId = newConv?.id;
      }

      if (convId) {
        await admin.from('messages').insert({
          conversation_id: convId,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text',
        });

        await admin
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            attendee_unread: admin.rpc ? 1 : 1,
          })
          .eq('id', convId);

        messagesSent++;
      }

      if (sendEmail) {
        const attendee = b.profiles as any;
        if (attendee?.email) {
          try {
            const locale = (attendee.preferred_locale || 'es') as 'es' | 'en';
            const html = buildBroadcastHtml({
              locale,
              organizerName: orgProfile.business_name || 'Organizador',
              eventTitle: retreat.title_es,
              message: message.trim(),
            });
            await resend.emails.send({
              from: FROM,
              to: attendee.email,
              subject: `${locale === 'es' ? 'Mensaje de' : 'Message from'} ${orgProfile.business_name} — ${retreat.title_es}`,
              html,
            });
            emailsSent++;
          } catch {
            // continue
          }
        }
      }
    }

    return NextResponse.json({ messagesSent, emailsSent });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
