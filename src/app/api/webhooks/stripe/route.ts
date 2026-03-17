// /api/webhooks/stripe — Stripe webhook handler
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendBookingConfirmedEmail, sendNewBookingToOrganizerEmail } from '@/lib/email';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (!bookingId) {
          console.error('No booking_id in session metadata');
          break;
        }

        const { data: booking, error: fetchError } = await admin
          .from('bookings')
          .select(`
            id, booking_number, retreat_id, attendee_id, organizer_id,
            total_price, platform_fee, organizer_amount,
            retreats!retreat_id(title_es, title_en, start_date, confirmation_type, sla_hours, slug),
            profiles!attendee_id(email, full_name, preferred_locale),
            organizer_profiles!organizer_id(user_id)
          `)
          .eq('id', bookingId)
          .single();

        if (fetchError || !booking) {
          console.error('Booking not found:', bookingId, fetchError);
          break;
        }

        const retreat = booking.retreats as any;
        const attendee = booking.profiles as any;
        const orgProfile = booking.organizer_profiles as any;
        const isAutomatic = retreat?.confirmation_type === 'automatic';
        const locale = (attendee?.preferred_locale || 'es') as 'es' | 'en';

        const newStatus = isAutomatic ? 'confirmed' : 'pending_confirmation';
        const slaDeadline = !isAutomatic
          ? new Date(Date.now() + (retreat?.sla_hours || 48) * 60 * 60 * 1000).toISOString()
          : null;

        const updateData: Record<string, unknown> = {
          status: newStatus,
          platform_payment_status: 'paid',
          platform_paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        };

        if (isAutomatic) {
          updateData.confirmed_at = new Date().toISOString();
        } else {
          updateData.sla_deadline = slaDeadline;
        }

        await admin.from('bookings').update(updateData).eq('id', bookingId);

        if (isAutomatic) {
          await admin.rpc('increment_confirmed_bookings', { retreat_id_param: booking.retreat_id });
        }

        const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        const remainingDue = new Date(retreat?.start_date);
        remainingDue.setDate(remainingDue.getDate() - 7);

        if (attendee?.email) {
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
            console.error('Failed to send booking confirmation email:', emailErr);
          }
        }

        if (orgProfile?.user_id) {
          const { data: orgUser } = await admin
            .from('profiles')
            .select('email, preferred_locale')
            .eq('id', orgProfile.user_id)
            .single();

          if (orgUser?.email) {
            try {
              await sendNewBookingToOrganizerEmail({
                to: orgUser.email,
                locale: (orgUser.preferred_locale || 'es') as 'es' | 'en',
                bookingNumber: booking.booking_number,
                eventTitle: retreat?.title_es || 'Retiro',
                attendeeName: attendee?.full_name || 'Asistente',
                requiresConfirmation: !isAutomatic,
                slaHours: retreat?.sla_hours,
              });
            } catch (emailErr) {
              console.error('Failed to send new booking email to organizer:', emailErr);
            }
          }
        }

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          await admin
            .from('bookings')
            .update({
              status: 'cancelled_by_attendee',
              cancellation_reason: 'Payment session expired',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)
            .eq('status', 'pending_payment');
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const { data: booking } = await admin
            .from('bookings')
            .select('id, retreat_id, status')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

          if (booking) {
            const refundAmount = (charge.amount_refunded || 0) / 100;
            await admin
              .from('bookings')
              .update({
                status: 'refunded',
                platform_payment_status: 'refunded',
                refund_amount: refundAmount,
                refunded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', booking.id);

            if (booking.status === 'confirmed') {
              await admin.rpc('decrement_confirmed_bookings', { retreat_id_param: booking.retreat_id });
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
