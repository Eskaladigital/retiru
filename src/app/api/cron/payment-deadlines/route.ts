// POST /api/cron/payment-deadlines — Procesa plazos de pago de reservas sin pago
// 1. Gracia: si el deadline ha vencido pero no se ha enviado reminder → +24h + email
// 2. Cancelación: si el deadline ha vencido Y el reminder ya fue enviado → cancelar
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendPaymentDeadlineReminderEmail, sendBookingCancelledEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  let sent = 0;
  let cancelled = 0;

  try {
    // ─── Phase 1: Grace period (+24h) ───────────────────────────────
    const { data: graceBookings } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, total_price, payment_deadline,
        retreats!retreat_id(title_es, title_en, slug),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'reserved_no_payment')
      .eq('payment_reminder_sent', false)
      .not('payment_deadline', 'is', null)
      .lt('payment_deadline', now);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com';

    for (const bk of graceBookings || []) {
      const newDeadline = new Date(new Date(bk.payment_deadline!).getTime() + 24 * 60 * 60 * 1000);
      await admin
        .from('bookings')
        .update({
          payment_deadline: newDeadline.toISOString(),
          payment_reminder_sent: true,
          updated_at: now,
        })
        .eq('id', bk.id);

      const profile = bk.profiles as any;
      if (profile?.email) {
        const locale = (profile.preferred_locale || 'es') as 'es' | 'en';
        const retreat = bk.retreats as any;
        const eventTitle = locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es);
        const payUrl = `${appUrl}/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}?pay=${bk.id}`;
        try {
          await sendPaymentDeadlineReminderEmail({
            to: profile.email,
            locale,
            eventTitle: eventTitle || 'Retiro',
            bookingNumber: bk.booking_number,
            newDeadline: newDeadline.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            }),
            payUrl,
            totalPrice: bk.total_price,
          });
          sent++;
        } catch (e) { console.error('Reminder email failed:', e); }
      }
    }

    // ─── Phase 2: Cancel expired (reminder already sent) ────────────
    const { data: expiredBookings } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, total_price,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'reserved_no_payment')
      .eq('payment_reminder_sent', true)
      .not('payment_deadline', 'is', null)
      .lt('payment_deadline', now);

    for (const bk of expiredBookings || []) {
      await admin
        .from('bookings')
        .update({
          status: 'cancelled_by_attendee',
          cancellation_reason: 'Payment deadline expired',
          cancelled_at: now,
          updated_at: now,
        })
        .eq('id', bk.id);

      cancelled++;

      const profile = bk.profiles as any;
      if (profile?.email) {
        const locale = (profile.preferred_locale || 'es') as 'es' | 'en';
        const retreat = bk.retreats as any;
        const eventTitle = locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es);
        try {
          await sendBookingCancelledEmail({
            to: profile.email,
            locale,
            bookingNumber: bk.booking_number,
            eventTitle: eventTitle || 'Retiro',
            cancelledBy: 'system',
            reason: locale === 'es'
              ? 'El plazo de pago ha expirado'
              : 'Payment deadline expired',
          });
        } catch (e) { console.error('Cancellation email failed:', e); }
      }
    }

    return NextResponse.json({ sent, cancelled, timestamp: now });
  } catch (error) {
    console.error('payment-deadlines cron error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
