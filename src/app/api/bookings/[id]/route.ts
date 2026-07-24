// /api/bookings/[id] — PATCH: organizer confirm/reject · POST: attendee cancel
// Confirmación manual sin pago por adelantado: las solicitudes llegan como
// reserved_no_payment; "confirm" las aprueba (organizer_approved_at) y, si el
// mínimo está cubierto, envía el enlace de pago con plazo.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import {
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendBookingCancelledEmail,
  sendBookingRequestApprovedEmail,
} from '@/lib/email';
import { issueRefund } from '@/lib/stripe';
import { getCancellationRefund } from '@/lib/utils';

function computePaymentDeadline(startDate: string): Date {
  const now = new Date();
  const seventyTwoH = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const oneDayBefore = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
  return seventyTwoH < oneDayBefore ? seventyTwoH : oneDayBefore;
}

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
        total_price, platform_fee, organizer_amount, stripe_payment_intent_id, status,
        organizer_approved_at,
        retreats!retreat_id(id, title_es, title_en, start_date, confirmation_type, min_attendees, confirmed_bookings),
        profiles!attendee_id(email, full_name, preferred_locale)
      `)
      .eq('id', bookingId)
      .eq('organizer_id', orgProfile.id)
      .in('status', ['pending_confirmation', 'reserved_no_payment'])
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found or not pending confirmation' }, { status: 404 });
    }

    const retreat = booking.retreats as any;
    const attendee = booking.profiles as any;
    const locale = (attendee?.preferred_locale || 'es') as 'es' | 'en';

    // ─── Solicitud sin pago (confirmación manual): aprobar ───────────
    if (booking.status === 'reserved_no_payment' && action === 'confirm') {
      if (retreat?.confirmation_type !== 'manual') {
        return NextResponse.json({ error: 'This booking is awaiting the participant minimum, no approval needed' }, { status: 400 });
      }
      if (booking.organizer_approved_at) {
        return NextResponse.json({ status: 'approved' });
      }

      const nowISO = new Date().toISOString();
      await admin
        .from('bookings')
        .update({
          organizer_approved_at: nowISO,
          sla_deadline: null,
          confirmed_by: user.id,
          updated_at: nowISO,
        })
        .eq('id', bookingId);

      // Gate del mínimo: solo se envía enlace de pago si está cubierto
      const minAttendees = retreat?.min_attendees ?? 1;
      const confirmedCount = retreat?.confirmed_bookings ?? 0;
      const { count: reservedCount } = await admin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('retreat_id', booking.retreat_id)
        .eq('status', 'reserved_no_payment');
      const minReached = confirmedCount + (reservedCount ?? 0) >= minAttendees;

      let payUrl: string | undefined;
      let deadlineStr: string | undefined;
      if (minReached) {
        const deadline = computePaymentDeadline(retreat?.start_date);
        await admin
          .from('bookings')
          .update({ payment_deadline: deadline.toISOString(), updated_at: new Date().toISOString() })
          .eq('id', bookingId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com';
        payUrl = `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?pay=${bookingId}`;
        deadlineStr = deadline.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      }

      if (attendee?.email) {
        try {
          await sendBookingRequestApprovedEmail({
            to: attendee.email,
            locale,
            eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
            bookingNumber: booking.booking_number,
            totalPrice: booking.total_price,
            payUrl,
            deadline: deadlineStr,
          });
        } catch (emailErr) {
          console.error('Failed to send request approved email:', emailErr);
        }
      }

      return NextResponse.json({ status: 'approved', paymentRequested: minReached });
    }

    // ─── Solicitud sin pago: rechazar (no hay nada que reembolsar) ───
    if (booking.status === 'reserved_no_payment' && action === 'reject') {
      await admin
        .from('bookings')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || 'Rejected by organizer',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (attendee?.email) {
        try {
          await sendBookingRejectedEmail({
            to: attendee.email,
            locale,
            bookingNumber: booking.booking_number,
            eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
            reason: reason || undefined,
          });
        } catch (emailErr) {
          console.error('Failed to send booking rejected email:', emailErr);
        }
      }

      return NextResponse.json({ status: 'rejected' });
    }

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

        try {
          await sendBookingConfirmedEmail({
            to: attendee.email,
            locale,
            bookingNumber: booking.booking_number,
            eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
            startDate: dateFmt.format(new Date(retreat?.start_date)),
            totalPrice: booking.total_price,
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

    if (attendee?.email) {
      try {
        await sendBookingRejectedEmail({
          to: attendee.email,
          locale,
          bookingNumber: booking.booking_number,
          eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
          reason: reason || undefined,
          refundAmount: booking.total_price,
        });
      } catch (emailErr) {
        console.error('Failed to send booking rejected email:', emailErr);
      }
    }

    return NextResponse.json({ status: 'rejected' });
  } catch (error) {
    console.error('Booking action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings/[id] — Cancelación por el asistente.
// Aplica la garantía Retiru de 48 h y los tramos de la política del evento,
// y emite el reembolso (total o parcial) vía Stripe si la reserva estaba pagada.
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    if (body.action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action. Must be "cancel"' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, organizer_id, status, created_at,
        total_price, platform_payment_status, stripe_payment_intent_id,
        retreats!retreat_id(title_es, title_en, start_date, cancellation_policy),
        profiles!attendee_id(email, full_name, preferred_locale),
        organizer_profiles!organizer_id(user_id)
      `)
      .eq('id', bookingId)
      .eq('attendee_id', user.id)
      .in('status', ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed'])
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found or not cancellable' }, { status: 404 });
    }

    const retreat = booking.retreats as any;
    const attendee = booking.profiles as any;
    const locale = (attendee?.preferred_locale || 'es') as 'es' | 'en';

    if (retreat?.start_date && new Date(retreat.start_date).getTime() < Date.now()) {
      return NextResponse.json({ error: 'The event has already started' }, { status: 400 });
    }

    const { percent, graceApplies } = getCancellationRefund(
      retreat?.cancellation_policy,
      retreat?.start_date,
      booking.created_at,
    );

    const hasPaid = booking.platform_payment_status === 'paid' && !!booking.stripe_payment_intent_id;
    const refundAmount = hasPaid
      ? Math.round(Number(booking.total_price) * percent) / 100
      : 0;

    const reason = body.reason || (graceApplies
      ? 'Cancelled by attendee (48h grace period)'
      : 'Cancelled by attendee');

    const { error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'cancelled_by_attendee',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_reason: 'cancelled_by_attendee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('status', booking.status);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (booking.status === 'confirmed') {
      await admin.rpc('decrement_confirmed_bookings', { retreat_id_param: booking.retreat_id });
    }

    if (refundAmount > 0) {
      try {
        await issueRefund({
          paymentIntentId: booking.stripe_payment_intent_id,
          amount: refundAmount >= Number(booking.total_price) ? undefined : refundAmount,
          reason,
        });
      } catch (refundErr) {
        console.error('Refund failed:', refundErr);
      }
    }

    const eventTitle = locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es);

    if (attendee?.email) {
      try {
        await sendBookingCancelledEmail({
          to: attendee.email,
          locale,
          bookingNumber: booking.booking_number,
          eventTitle,
          cancelledBy: 'attendee',
          refundAmount,
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation email to attendee:', emailErr);
      }
    }

    const orgProfile = booking.organizer_profiles as any;
    if (orgProfile?.user_id) {
      const { data: orgUser } = await admin
        .from('profiles')
        .select('email, preferred_locale')
        .eq('id', orgProfile.user_id)
        .single();

      if (orgUser?.email) {
        const orgLocale = (orgUser.preferred_locale || 'es') as 'es' | 'en';
        try {
          await sendBookingCancelledEmail({
            to: orgUser.email,
            locale: orgLocale,
            bookingNumber: booking.booking_number,
            eventTitle: orgLocale === 'es' ? (retreat?.title_es || 'Retiro') : (retreat?.title_en || retreat?.title_es || 'Retreat'),
            cancelledBy: 'attendee',
            refundAmount,
          });
        } catch (emailErr) {
          console.error('Failed to send cancellation email to organizer:', emailErr);
        }
      }
    }

    return NextResponse.json({
      status: 'cancelled_by_attendee',
      refund_percent: percent,
      refund_amount: refundAmount,
      grace_applied: graceApplies,
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
