// /api/checkout — Create Stripe Checkout session OR reserve-without-payment
// Accepts { retreatId, locale } for new bookings
// Accepts { bookingId, locale } to pay an existing reserved_no_payment booking
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';
import {
  sendReservationConfirmedEmail,
  sendMinViableReachedEmail,
  sendMinViableReachedToOrganizerEmail,
  sendNewBookingToOrganizerEmail,
} from '@/lib/email';

function generateBookingNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RT-${y}${m}-${rand}`;
}

function computePaymentDeadline(startDate: string): Date {
  const now = new Date();
  const seventyTwoH = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const oneDayBefore = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000);
  return seventyTwoH < oneDayBefore ? seventyTwoH : oneDayBefore;
}

function formatDeadlineForEmail(d: Date, locale: 'es' | 'en'): string {
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const locale = (body.locale || 'es') as 'es' | 'en';

    // ─── PATH B: Pay an existing reserved_no_payment booking ─────────
    if (body.bookingId) {
      return handlePayExistingBooking(body.bookingId, user, locale);
    }

    // ─── PATH A: New booking (reserve or pay) ────────────────────────
    const { retreatId } = body;
    if (!retreatId) {
      return NextResponse.json({ error: 'Missing retreatId' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: retreat, error: retreatError } = await admin
      .from('retreats')
      .select('id, title_es, title_en, slug, total_price, platform_fee, organizer_amount, currency, organizer_id, available_spots, confirmation_type, sla_hours, start_date, status, min_attendees, confirmed_bookings, max_attendees')
      .eq('id', retreatId)
      .single();

    if (retreatError || !retreat) {
      return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });
    }

    if (retreat.status !== 'published') {
      return NextResponse.json({ error: 'Retreat is not available' }, { status: 400 });
    }

    if (retreat.available_spots <= 0) {
      return NextResponse.json({ error: 'No spots available' }, { status: 400 });
    }

    const { data: existingBooking } = await admin
      .from('bookings')
      .select('id')
      .eq('retreat_id', retreatId)
      .eq('attendee_id', user.id)
      .in('status', ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed'])
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({
        error: locale === 'es' ? 'Ya tienes una reserva para este retiro' : 'You already have a booking for this retreat',
      }, { status: 409 });
    }

    const minAttendees = retreat.min_attendees ?? 1;
    const confirmedCount = retreat.confirmed_bookings ?? 0;

    const { count: reservedCount } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreatId)
      .eq('status', 'reserved_no_payment');

    const totalEnrolled = confirmedCount + (reservedCount ?? 0);
    const minAlreadyReached = totalEnrolled >= minAttendees;

    // ─── Min NOT reached: reserve without payment ────────────────────
    if (!minAlreadyReached && minAttendees > 1) {
      const bookingNumber = generateBookingNumber();

      const { data: booking, error: bookingError } = await admin
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          retreat_id: retreatId,
          attendee_id: user.id,
          organizer_id: retreat.organizer_id,
          total_price: retreat.total_price,
          platform_fee: retreat.platform_fee,
          organizer_amount: retreat.organizer_amount,
          currency: retreat.currency,
          status: 'reserved_no_payment',
          platform_payment_status: 'pending',
          remaining_payment_status: 'not_applicable',
        })
        .select('id')
        .single();

      if (bookingError || !booking) {
        console.error('Reservation creation error:', bookingError);
        return NextResponse.json({ error: 'Failed to reserve spot' }, { status: 500 });
      }

      const newTotalEnrolled = totalEnrolled + 1;

      // Email de confirmación de reserva al asistente
      try {
        await sendReservationConfirmedEmail({
          to: user.email!,
          locale,
          eventTitle: locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es),
          bookingNumber,
          minAttendees,
          currentReserved: newTotalEnrolled,
        });
      } catch (e) { console.error('sendReservationConfirmedEmail failed:', e); }

      // Check if THIS booking triggers the minimum
      if (newTotalEnrolled >= minAttendees) {
        await triggerMinViableReached(admin, retreat, locale);
      }

      return NextResponse.json({ reserved: true, bookingId: booking.id });
    }

    // ─── Min reached (or min=1): normal Stripe checkout ──────────────
    const bookingNumber = generateBookingNumber();

    const slaDeadline = retreat.confirmation_type === 'manual'
      ? new Date(Date.now() + (retreat.sla_hours || 48) * 60 * 60 * 1000).toISOString()
      : null;

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        retreat_id: retreatId,
        attendee_id: user.id,
        organizer_id: retreat.organizer_id,
        total_price: retreat.total_price,
        platform_fee: retreat.platform_fee,
        organizer_amount: retreat.organizer_amount,
        currency: retreat.currency,
        status: 'pending_payment',
        platform_payment_status: 'pending',
        remaining_payment_status: 'not_applicable',
        sla_deadline: slaDeadline,
      })
      .select('id')
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const eventTitle = locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es);

    const session = await createCheckoutSession({
      bookingId: booking.id,
      eventTitle,
      totalPrice: retreat.total_price,
      currency: retreat.currency,
      customerEmail: user.email!,
      locale,
      successUrl: `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?booking=${booking.id}&success=true`,
      cancelUrl: `${appUrl}/${locale}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreat.slug}?cancelled=true`,
    });

    await admin
      .from('bookings')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Handle payment for an existing reserved_no_payment booking ──────────────

async function handlePayExistingBooking(
  bookingId: string,
  user: { id: string; email?: string },
  locale: 'es' | 'en',
) {
  const admin = createAdminSupabase();

  const { data: booking, error } = await admin
    .from('bookings')
    .select(`
      id, booking_number, retreat_id, attendee_id, total_price, platform_fee,
      organizer_amount, currency, payment_deadline, status,
      retreats!retreat_id(title_es, title_en, slug, confirmation_type, sla_hours)
    `)
    .eq('id', bookingId)
    .eq('attendee_id', user.id)
    .eq('status', 'reserved_no_payment')
    .single();

  if (error || !booking) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'Reserva no encontrada o ya pagada'
        : 'Booking not found or already paid',
    }, { status: 404 });
  }

  if (booking.payment_deadline && new Date(booking.payment_deadline) < new Date()) {
    return NextResponse.json({
      error: locale === 'es'
        ? 'El plazo de pago ha expirado. Tu plaza ha sido liberada.'
        : 'Payment deadline has expired. Your spot has been released.',
    }, { status: 410 });
  }

  const retreat = booking.retreats as any;
  const slaDeadline = retreat?.confirmation_type === 'manual'
    ? new Date(Date.now() + (retreat.sla_hours || 48) * 60 * 60 * 1000).toISOString()
    : null;

  await admin
    .from('bookings')
    .update({
      status: 'pending_payment',
      sla_deadline: slaDeadline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const eventTitle = locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es);

  const session = await createCheckoutSession({
    bookingId: booking.id,
    eventTitle: eventTitle || 'Retiro',
    totalPrice: booking.total_price,
    currency: booking.currency,
    customerEmail: user.email!,
    locale,
    successUrl: `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?booking=${booking.id}&success=true`,
    cancelUrl: `${appUrl}/${locale}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreat?.slug || ''}?cancelled=true`,
  });

  await admin
    .from('bookings')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', bookingId);

  return NextResponse.json({ url: session.url });
}

// ─── Trigger min viable reached: set deadlines + notify ──────────────────────

async function triggerMinViableReached(
  admin: ReturnType<typeof createAdminSupabase>,
  retreat: any,
  locale: 'es' | 'en',
) {
  const deadline = computePaymentDeadline(retreat.start_date);
  const deadlineISO = deadline.toISOString();
  const deadlineStr = formatDeadlineForEmail(deadline, locale);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Set payment_deadline on all reserved_no_payment bookings for this retreat
  await admin
    .from('bookings')
    .update({ payment_deadline: deadlineISO, updated_at: new Date().toISOString() })
    .eq('retreat_id', retreat.id)
    .eq('status', 'reserved_no_payment');

  // Fetch those bookings to send emails
  const { data: reservedBookings } = await admin
    .from('bookings')
    .select('id, booking_number, attendee_id, total_price, profiles!attendee_id(email, preferred_locale)')
    .eq('retreat_id', retreat.id)
    .eq('status', 'reserved_no_payment');

  const eventTitleEs = retreat.title_es;
  const eventTitleEn = retreat.title_en || retreat.title_es;

  for (const bk of reservedBookings || []) {
    const profile = bk.profiles as any;
    if (!profile?.email) continue;
    const bkLocale = (profile.preferred_locale || 'es') as 'es' | 'en';
    const payUrl = `${appUrl}/${bkLocale}/${bkLocale === 'es' ? 'mis-reservas' : 'my-bookings'}?pay=${bk.id}`;
    try {
      await sendMinViableReachedEmail({
        to: profile.email,
        locale: bkLocale,
        eventTitle: bkLocale === 'es' ? eventTitleEs : eventTitleEn,
        bookingNumber: bk.booking_number,
        deadline: formatDeadlineForEmail(deadline, bkLocale),
        payUrl,
        totalPrice: bk.total_price,
      });
    } catch (e) { console.error('sendMinViableReachedEmail failed:', e); }
  }

  // Notify organizer
  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('user_id, profiles!user_id(email, preferred_locale)')
    .eq('id', retreat.organizer_id)
    .single();

  const orgUser = orgProfile?.profiles as any;
  if (orgUser?.email) {
    const orgLocale = (orgUser.preferred_locale || 'es') as 'es' | 'en';
    const { count: totalReserved } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreat.id)
      .eq('status', 'reserved_no_payment');

    try {
      await sendMinViableReachedToOrganizerEmail({
        to: orgUser.email,
        locale: orgLocale,
        eventTitle: orgLocale === 'es' ? eventTitleEs : eventTitleEn,
        minAttendees: retreat.min_attendees ?? 1,
        reservedCount: (totalReserved ?? 0) + (retreat.confirmed_bookings ?? 0),
        deadline: deadlineStr,
      });
    } catch (e) { console.error('sendMinViableReachedToOrganizerEmail failed:', e); }
  }
}
