// /api/checkout — Create Stripe Checkout session for a retreat booking
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';

function generateBookingNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RT-${y}${m}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { retreatId, locale = 'es' } = await request.json();

    if (!retreatId) {
      return NextResponse.json({ error: 'Missing retreatId' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: retreat, error: retreatError } = await admin
      .from('retreats')
      .select('id, title_es, title_en, slug, total_price, platform_fee, organizer_amount, currency, organizer_id, available_spots, confirmation_type, sla_hours, start_date, status')
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
      .in('status', ['pending_payment', 'pending_confirmation', 'confirmed'])
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: locale === 'es' ? 'Ya tienes una reserva para este retiro' : 'You already have a booking for this retreat' }, { status: 409 });
    }

    const bookingNumber = generateBookingNumber();
    const remainingPaymentDueDate = new Date(retreat.start_date);
    remainingPaymentDueDate.setDate(remainingPaymentDueDate.getDate() - 7);

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
        remaining_payment_status: 'pending',
        remaining_payment_due_date: remainingPaymentDueDate.toISOString().split('T')[0],
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
      platformFee: retreat.platform_fee,
      currency: retreat.currency,
      customerEmail: user.email!,
      locale: locale as 'es' | 'en',
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
