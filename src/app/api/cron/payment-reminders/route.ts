// POST /api/cron/payment-reminders — Send reminders for pending 80% payments
// Run daily via Vercel Cron or manual trigger
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendPaymentReminderEmail, sendBookingExpiredEmail, sendPaymentOverdueToOrganizerEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminSupabase();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // --- Reminders for upcoming due dates (7 days) ---
    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, organizer_amount, remaining_payment_due_date,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'confirmed')
      .eq('remaining_payment_status', 'pending')
      .lte('remaining_payment_due_date', sevenDaysFromNow.toISOString().split('T')[0])
      .gt('remaining_payment_due_date', now.toISOString().split('T')[0]);

    let sent = 0;
    let overdue = 0;
    let expired = 0;

    for (const b of bookings || []) {
      const attendee = b.profiles as any;
      const retreat = b.retreats as any;
      if (!attendee?.email) continue;

      const locale = (attendee.preferred_locale || 'es') as 'es' | 'en';
      const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      try {
        await sendPaymentReminderEmail({
          to: attendee.email,
          locale,
          eventTitle: locale === 'es' ? retreat?.title_es : (retreat?.title_en || retreat?.title_es),
          organizerAmount: b.organizer_amount,
          dueDate: dateFmt.format(new Date(b.remaining_payment_due_date!)),
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send reminder for booking ${b.id}:`, err);
      }
    }

    // --- Mark overdue bookings + notify organizer ---
    const { data: overdueBookings } = await admin
      .from('bookings')
      .select(`
        id, booking_number, remaining_payment_due_date, organizer_id,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, full_name, preferred_locale),
        organizer_profiles!organizer_id(user_id)
      `)
      .eq('status', 'confirmed')
      .eq('remaining_payment_status', 'pending')
      .lt('remaining_payment_due_date', now.toISOString().split('T')[0]);

    for (const b of overdueBookings || []) {
      await admin
        .from('bookings')
        .update({
          remaining_payment_status: 'overdue',
          updated_at: now.toISOString(),
        })
        .eq('id', b.id);
      overdue++;

      const orgProfile = b.organizer_profiles as any;
      const attendee = b.profiles as any;
      const retreat = b.retreats as any;

      if (orgProfile?.user_id) {
        try {
          const { data: orgUser } = await admin
            .from('profiles')
            .select('email, preferred_locale')
            .eq('id', orgProfile.user_id)
            .single();

          if (orgUser?.email) {
            const orgLocale = (orgUser.preferred_locale || 'es') as 'es' | 'en';
            const dateFmt = new Intl.DateTimeFormat(orgLocale === 'es' ? 'es-ES' : 'en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            });
            await sendPaymentOverdueToOrganizerEmail({
              to: orgUser.email,
              locale: orgLocale,
              eventTitle: orgLocale === 'en' ? (retreat?.title_en || retreat?.title_es) : retreat?.title_es,
              attendeeName: attendee?.full_name || 'Asistente',
              bookingNumber: b.booking_number || b.id.slice(0, 8),
              dueDate: dateFmt.format(new Date(b.remaining_payment_due_date!)),
            });
          }
        } catch (err) {
          console.error(`Failed to send overdue email to organizer for booking ${b.id}:`, err);
        }
      }
    }

    // --- Expire bookings overdue > 7 days + notify attendee ---
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: expiredBookings } = await admin
      .from('bookings')
      .select(`
        id, booking_number,
        retreats!retreat_id(title_es, title_en),
        profiles!attendee_id(email, preferred_locale)
      `)
      .eq('status', 'confirmed')
      .eq('remaining_payment_status', 'overdue')
      .lt('remaining_payment_due_date', sevenDaysAgo.toISOString().split('T')[0]);

    for (const b of expiredBookings || []) {
      await admin
        .from('bookings')
        .update({
          status: 'cancelled',
          remaining_payment_status: 'expired',
          updated_at: now.toISOString(),
        })
        .eq('id', b.id);
      expired++;

      const attendee = b.profiles as any;
      const retreat = b.retreats as any;
      if (!attendee?.email) continue;

      const locale = (attendee.preferred_locale || 'es') as 'es' | 'en';
      try {
        await sendBookingExpiredEmail({
          to: attendee.email,
          locale,
          eventTitle: locale === 'en' ? (retreat?.title_en || retreat?.title_es) : retreat?.title_es,
          bookingNumber: b.booking_number || b.id.slice(0, 8),
        });
      } catch (err) {
        console.error(`Failed to send expired email for booking ${b.id}:`, err);
      }
    }

    return NextResponse.json({ sent, overdue, expired, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Payment reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
