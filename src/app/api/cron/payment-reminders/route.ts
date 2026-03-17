// POST /api/cron/payment-reminders — Send reminders for pending 80% payments
// Run daily via Vercel Cron or manual trigger
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendPaymentReminderEmail } from '@/lib/email';

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

    const { data: overdueBookings } = await admin
      .from('bookings')
      .select('id')
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
    }

    return NextResponse.json({ sent, overdue, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Payment reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
