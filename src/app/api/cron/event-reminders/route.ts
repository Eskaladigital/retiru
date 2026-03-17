// POST /api/cron/event-reminders — Send pre-event reminders (7d and 2d before)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { Resend } from 'resend';

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
    let sent = 0;

    for (const daysBefore of [7, 2]) {
      const targetDate = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: retreats } = await admin
        .from('retreats')
        .select('id, title_es, title_en, start_date, address')
        .eq('status', 'published')
        .eq('start_date', dateStr);

      for (const retreat of retreats || []) {
        const { data: bookings } = await admin
          .from('bookings')
          .select(`
            id, booking_number, form_responses,
            profiles!attendee_id(email, full_name, preferred_locale)
          `)
          .eq('retreat_id', retreat.id)
          .eq('status', 'confirmed');

        for (const b of bookings || []) {
          const attendee = b.profiles as any;
          if (!attendee?.email) continue;

          const locale = (attendee.preferred_locale || 'es') as 'es' | 'en';
          const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          });

          const formComplete = b.form_responses && Object.keys(b.form_responses as object).length > 0;
          const formReminder = !formComplete
            ? `<p style="color: #c85a30; font-weight: bold;">📝 ${locale === 'es' ? 'Recuerda completar tu formulario de inscripción' : 'Remember to complete your registration form'}: <a href="${APP_URL}/${locale === 'es' ? 'es' : 'en'}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}/${b.id}/formulario" style="color: #c85a30;">${locale === 'es' ? 'Rellenar formulario' : 'Fill form'}</a></p>`
            : '';

          const subject = locale === 'es'
            ? `${daysBefore === 7 ? '¡1 semana' : '¡2 días'} para tu retiro! — ${retreat.title_es}`
            : `${daysBefore === 7 ? '1 week' : '2 days'} to your retreat! — ${retreat.title_en || retreat.title_es}`;

          const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
              <h1 style="color: #c85a30;">Retiru</h1>
              <h2>${locale === 'es' ? `¡Tu retiro es en ${daysBefore} días!` : `Your retreat is in ${daysBefore} days!`}</h2>
              <p><strong>${locale === 'es' ? retreat.title_es : (retreat.title_en || retreat.title_es)}</strong></p>
              <p>📅 ${dateFmt.format(new Date(retreat.start_date))}</p>
              ${retreat.address ? `<p>📍 ${retreat.address}</p>` : ''}
              <p>${locale === 'es' ? `Nº de reserva: ${b.booking_number}` : `Booking number: ${b.booking_number}`}</p>
              ${formReminder}
              <a href="${APP_URL}/${locale === 'es' ? 'es' : 'en'}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}/${b.id}"
                 style="display: inline-block; background: #c85a30; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin-top: 15px;">
                ${locale === 'es' ? 'Ver mi reserva' : 'View my booking'}
              </a>
            </div>
          `;

          try {
            await resend.emails.send({ from: FROM, to: attendee.email, subject, html });
            sent++;
          } catch (err) {
            console.error(`Failed reminder for booking ${b.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({ sent, timestamp: now.toISOString() });
  } catch (error) {
    console.error('Event reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
