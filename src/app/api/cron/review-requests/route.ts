// POST /api/cron/review-requests — Request reviews 2 days after event ends
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { buildReviewRequestHtml } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'hola@retiru.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retiru.com';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminSupabase();
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const dateStr = twoDaysAgo.toISOString().split('T')[0];

    const { data: retreats } = await admin
      .from('retreats')
      .select('id, title_es, title_en, slug')
      .eq('status', 'published')
      .eq('end_date', dateStr);

    let sent = 0;

    for (const retreat of retreats || []) {
      await admin
        .from('bookings')
        .update({ status: 'completed', updated_at: now.toISOString() })
        .eq('retreat_id', retreat.id)
        .eq('status', 'confirmed');

      const { data: bookings } = await admin
        .from('bookings')
        .select(`
          id,
          profiles!attendee_id(email, full_name, preferred_locale)
        `)
        .eq('retreat_id', retreat.id)
        .eq('status', 'completed');

      const { data: existingReviews } = await admin
        .from('reviews')
        .select('booking_id')
        .eq('retreat_id', retreat.id);
      const reviewedBookings = new Set((existingReviews || []).map((r: any) => r.booking_id));

      for (const b of bookings || []) {
        if (reviewedBookings.has(b.id)) continue;

        const attendee = b.profiles as any;
        if (!attendee?.email) continue;

        const locale = (attendee.preferred_locale || 'es') as 'es' | 'en';
        const title = locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es);

        const subject = locale === 'es'
          ? `¿Qué te ha parecido? — ${title}`
          : `How was it? — ${title}`;

        const html = buildReviewRequestHtml({
          locale,
          eventTitle: title,
          retreatUrl: `${APP_URL}/${locale === 'es' ? 'es' : 'en'}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreat.slug}`,
        });

        try {
          await resend.emails.send({ from: FROM, to: attendee.email, subject, html });
          sent++;
        } catch (err) {
          console.error(`Failed review request for booking ${b.id}:`, err);
        }
      }
    }

    return NextResponse.json({ sent, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Review requests cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
