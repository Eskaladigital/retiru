// POST /api/cron/sla-deadlines
// Cancela reservas en `pending_confirmation` cuyo `sla_deadline` ha vencido
// (organizadores con `confirmation_type: 'manual'` que no han confirmado a
// tiempo) y notifica al asistente con `sendBookingExpiredEmail`. Si hubo pago,
// emite reembolso completo del PaymentIntent.
// También expira solicitudes sin pago (`reserved_no_payment` con sla_deadline
// y sin organizer_approved_at, flujo de confirmación manual sin pago por
// adelantado): no hay nada que reembolsar.
//
// Programación recomendada (vercel.json): cada hora; el coste es bajo porque la
// query filtra por `sla_deadline < now`. Se puede mantener junto a payment-deadlines.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendBookingExpiredEmail } from '@/lib/email';
import { issueRefund } from '@/lib/stripe';

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
  let cancelled = 0;
  let emailed = 0;
  let refunded = 0;
  let refundFailed = 0;

  try {
    const { data: expiredPaid } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, total_price,
        stripe_payment_intent_id, status, sla_deadline,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'pending_confirmation')
      .not('sla_deadline', 'is', null)
      .lt('sla_deadline', now);

    // Solicitudes sin pago que el organizador no ha respondido a tiempo
    const { data: expiredRequests } = await admin
      .from('bookings')
      .select(`
        id, booking_number, retreat_id, attendee_id, total_price,
        stripe_payment_intent_id, status, sla_deadline,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'reserved_no_payment')
      .is('organizer_approved_at', null)
      .not('sla_deadline', 'is', null)
      .lt('sla_deadline', now);

    const expired = [...(expiredPaid || []), ...(expiredRequests || [])];

    for (const bk of expired || []) {
      await admin
        .from('bookings')
        .update({
          status: 'sla_expired',
          cancellation_reason: 'SLA del organizador expirado sin confirmación',
          cancelled_at: now,
          updated_at: now,
        })
        .eq('id', bk.id);
      cancelled++;

      if (bk.stripe_payment_intent_id) {
        try {
          await issueRefund({
            paymentIntentId: bk.stripe_payment_intent_id,
            reason: 'SLA del organizador expirado',
          });
          refunded++;
        } catch (e) {
          refundFailed++;
          console.error('[cron/sla-deadlines] refund failed', { bookingId: bk.id, err: e instanceof Error ? e.message : e });
        }
      }

      const profile = bk.profiles as { email?: string | null; preferred_locale?: string | null } | null;
      if (profile?.email) {
        const locale = (profile.preferred_locale || 'es') as 'es' | 'en';
        const retreat = bk.retreats as { title_es?: string | null; title_en?: string | null } | null;
        const eventTitle = locale === 'es'
          ? (retreat?.title_es || 'Retiro')
          : (retreat?.title_en || retreat?.title_es || 'Retreat');
        try {
          await sendBookingExpiredEmail({
            to: profile.email,
            locale,
            eventTitle,
            bookingNumber: bk.booking_number,
            wasPaid: !!bk.stripe_payment_intent_id,
          });
          emailed++;
        } catch (e) {
          console.error('[cron/sla-deadlines] expired email failed', { bookingId: bk.id, err: e instanceof Error ? e.message : e });
        }
      }
    }

    return NextResponse.json({ cancelled, emailed, refunded, refundFailed, timestamp: now });
  } catch (error) {
    console.error('[cron/sla-deadlines] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
