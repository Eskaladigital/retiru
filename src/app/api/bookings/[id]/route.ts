// /api/bookings/[id] — Organizer confirm/reject booking
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendBookingConfirmedEmail } from '@/lib/email';
import { issueRefund } from '@/lib/stripe';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { action, reason } = await request.json();

    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "confirm" or "reject"' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) {
      return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });
    }

    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, organizer_id, 
        platform_fee, organizer_amount, stripe_payment_intent_id, status,
        retreats!retreat_id(title_es, title_en, start_date),
        profiles!attendee_id(email, full_name, preferred_locale)
      `)
      .eq('id', bookingId)
      .eq('organizer_id', orgProfile.id)
      .eq('status', 'pending_confirmation')
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found or not pending confirmation' }, { status: 404 });
    }

    const retreat = booking.retreats as any;
    const attendee = booking.profiles as any;
    const locale = (attendee?.preferred_locale || 'es') as 'es' | 'en';

    if (action === 'confirm') {
      await admin
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      await admin.rpc('increment_confirmed_bookings', { retreat_id_param: booking.retreat_id });

      if (attendee?.email) {
        const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        const remainingDue = new Date(retreat?.start_date);
        remainingDue.setDate(remainingDue.getDate() - 7);

        try {
          await sendBookingConfirmedEmail({
            to: attendee.email,
            locale,
            bookingNumber: booking.booking_number,
            eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
            startDate: dateFmt.format(new Date(retreat?.start_date)),
            platformFee: booking.platform_fee,
            organizerAmount: booking.organizer_amount,
            remainingPaymentDate: dateFmt.format(remainingDue),
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      }

      return NextResponse.json({ status: 'confirmed' });
    }

    // Reject: refund the platform fee
    await admin
      .from('bookings')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Rejected by organizer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (booking.stripe_payment_intent_id) {
      try {
        await issueRefund({
          paymentIntentId: booking.stripe_payment_intent_id,
          reason: 'Booking rejected by organizer',
        });
      } catch (refundErr) {
        console.error('Refund failed:', refundErr);
      }
    }

    return NextResponse.json({ status: 'rejected' });
  } catch (error) {
    console.error('Booking action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
