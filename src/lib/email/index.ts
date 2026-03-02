// ============================================================================
// RETIRU · Email templates with Resend
// ============================================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'hola@retiru.com';

interface EmailOptions {
  to: string;
  locale: 'es' | 'en';
}

// ─── Booking Confirmed ──────────────────────────────────────────────────────
export async function sendBookingConfirmedEmail(
  options: EmailOptions & {
    bookingNumber: string;
    eventTitle: string;
    startDate: string;
    platformFee: number;
    organizerAmount: number;
    remainingPaymentDate: string;
  }
) {
  const { to, locale, bookingNumber, eventTitle, startDate, platformFee, organizerAmount, remainingPaymentDate } = options;

  const subject = locale === 'es'
    ? `¡Reserva confirmada! — ${eventTitle}`
    : `Booking confirmed! — ${eventTitle}`;

  const html = locale === 'es' ? `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #fefdfb; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Georgia', serif; color: #c85a30; font-size: 28px; margin: 0;">Retiru</h1>
      </div>
      <h2 style="color: #2d2319; font-size: 22px;">¡Tu plaza está confirmada!</h2>
      <p style="color: #6c503c; line-height: 1.6;">
        Tu reserva para <strong>${eventTitle}</strong> ha sido confirmada.
      </p>
      <div style="background: #f8f2e6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #2d2319;"><strong>Nº de reserva:</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0; color: #2d2319;"><strong>Fecha:</strong> ${startDate}</p>
        <p style="margin: 5px 0; color: #2d2319;"><strong>Pagado a Retiru:</strong> ${platformFee}€</p>
        <p style="margin: 5px 0; color: #c85a30;"><strong>Pendiente al organizador:</strong> ${organizerAmount}€ antes del ${remainingPaymentDate}</p>
      </div>
      <p style="color: #6c503c; line-height: 1.6;">
        El organizador se pondrá en contacto contigo. Puedes escribirle desde tu panel de reservas.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/es/mis-reservas" 
           style="background: #c85a30; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          Ver mi reserva
        </a>
      </div>
    </div>
  ` : `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #fefdfb; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Georgia', serif; color: #c85a30; font-size: 28px; margin: 0;">Retiru</h1>
      </div>
      <h2 style="color: #2d2319; font-size: 22px;">Your spot is confirmed!</h2>
      <p style="color: #6c503c; line-height: 1.6;">
        Your booking for <strong>${eventTitle}</strong> has been confirmed.
      </p>
      <div style="background: #f8f2e6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #2d2319;"><strong>Booking number:</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0; color: #2d2319;"><strong>Date:</strong> ${startDate}</p>
        <p style="margin: 5px 0; color: #2d2319;"><strong>Paid to Retiru:</strong> €${platformFee}</p>
        <p style="margin: 5px 0; color: #c85a30;"><strong>Remaining to organizer:</strong> €${organizerAmount} before ${remainingPaymentDate}</p>
      </div>
      <p style="color: #6c503c; line-height: 1.6;">
        The organizer will get in touch with you. You can message them from your bookings panel.
      </p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/my-bookings" 
           style="background: #c85a30; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          View my booking
        </a>
      </div>
    </div>
  `;

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Payment Reminder to Attendee ───────────────────────────────────────────
export async function sendPaymentReminderEmail(
  options: EmailOptions & {
    eventTitle: string;
    organizerAmount: number;
    dueDate: string;
  }
) {
  const { to, locale, eventTitle, organizerAmount, dueDate } = options;

  const subject = locale === 'es'
    ? `Recordatorio de pago — ${eventTitle}`
    : `Payment reminder — ${eventTitle}`;

  const html = locale === 'es'
    ? `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
        <h1 style="color: #c85a30;">Retiru</h1>
        <h2>Recordatorio de pago</h2>
        <p>Recuerda que tienes pendiente el pago de <strong>${organizerAmount}€</strong> al organizador de <strong>${eventTitle}</strong> antes del <strong>${dueDate}</strong>.</p>
        <p>El organizador te indicará cómo realizar el pago.</p>
      </div>`
    : `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
        <h1 style="color: #c85a30;">Retiru</h1>
        <h2>Payment reminder</h2>
        <p>This is a reminder that you have a pending payment of <strong>€${organizerAmount}</strong> to the organizer of <strong>${eventTitle}</strong> before <strong>${dueDate}</strong>.</p>
        <p>The organizer will let you know how to make the payment.</p>
      </div>`;

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── New Booking notification to Organizer ──────────────────────────────────
export async function sendNewBookingToOrganizerEmail(
  options: EmailOptions & {
    bookingNumber: string;
    eventTitle: string;
    attendeeName: string;
    requiresConfirmation: boolean;
    slaHours?: number;
  }
) {
  const { to, locale, bookingNumber, eventTitle, attendeeName, requiresConfirmation, slaHours } = options;

  const subject = locale === 'es'
    ? `Nueva reserva: ${attendeeName} — ${eventTitle}`
    : `New booking: ${attendeeName} — ${eventTitle}`;

  const actionText = requiresConfirmation
    ? (locale === 'es'
      ? `<p style="color: #c85a30; font-weight: bold;">⚠️ Tienes ${slaHours || 48} horas para confirmar o rechazar esta reserva.</p>`
      : `<p style="color: #c85a30; font-weight: bold;">⚠️ You have ${slaHours || 48} hours to confirm or reject this booking.</p>`)
    : (locale === 'es'
      ? '<p style="color: #47654b;">✅ La reserva se ha confirmado automáticamente.</p>'
      : '<p style="color: #47654b;">✅ The booking has been automatically confirmed.</p>');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
      <h1 style="color: #c85a30;">Retiru</h1>
      <h2>${locale === 'es' ? 'Nueva reserva recibida' : 'New booking received'}</h2>
      <p><strong>${attendeeName}</strong> ${locale === 'es' ? 'ha reservado plaza en' : 'has booked a spot in'} <strong>${eventTitle}</strong></p>
      <p>${locale === 'es' ? 'Nº de reserva' : 'Booking number'}: ${bookingNumber}</p>
      ${actionText}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/${locale === 'es' ? 'es' : 'en'}/panel/reservas" 
         style="display: inline-block; background: #c85a30; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin-top: 15px;">
        ${locale === 'es' ? 'Ver en mi panel' : 'View in my panel'}
      </a>
    </div>
  `;

  return resend.emails.send({ from: FROM, to, subject, html });
}
