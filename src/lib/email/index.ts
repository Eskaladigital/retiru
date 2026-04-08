// ============================================================================
// RETIRU · Email templates with Resend
// Layout idéntico a mailing/retiru-bienvenida-centro.html:
// Tablas HTML, condicionales MSO (Outlook), responsive 600px,
// logo, firma, footer con nav + cancelar suscripción.
// ============================================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'hola@retiru.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com';

interface EmailOptions {
  to: string;
  locale: 'es' | 'en';
}

// ─── Shared Layout ──────────────────────────────────────────────────────────

function t(locale: 'es' | 'en', es: string, en: string) {
  return locale === 'es' ? es : en;
}

interface CtaButton {
  href: string;
  label: string;
}

export function emailLayout(opts: {
  locale: 'es' | 'en';
  preheader: string;
  title: string;
  body: string;
  cta?: CtaButton;
  footnote?: string;
}): string {
  const { locale, preheader, title, body, cta, footnote } = opts;

  const ctaHtml = cta ? `
                    <tr>
                        <td style="padding: 0 40px 8px; text-align: center;" class="section-padding">
                            <!--[if mso]><table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td bgcolor="#c85a30" style="padding: 14px 36px;"><a href="${cta.href}" style="color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; font-family: Arial, sans-serif;">${cta.label}</a></td></tr></table><![endif]-->
                            <!--[if !mso]><!-->
                            <table cellpadding="0" cellspacing="0" border="0" align="center">
                                <tr>
                                    <td style="border-radius: 8px; background-color: #c85a30;">
                                        <a href="${cta.href}" style="display: block; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; font-family: Arial, sans-serif; padding: 14px 36px;" class="cta-btn">
                                            ${cta.label}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <!--<![endif]-->
                        </td>
                    </tr>` : '';

  const footnoteHtml = footnote ? `
                    <tr>
                        <td style="padding: 8px 40px 0; text-align: center;" class="section-padding">
                            <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif; line-height: 1.6;">${footnote}</p>
                        </td>
                    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!--[if mso]><style>body, table, td {font-family: Arial, sans-serif !important;}</style><![endif]-->
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        a { color: inherit; }
        @media only screen and (max-width: 600px) {
            .hero-title { font-size: 24px !important; }
            .section-padding { padding: 28px 20px !important; }
            .cta-btn { padding: 16px 28px !important; font-size: 15px !important; }
            .footer-nav td { display: block !important; padding: 4px 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7;">
        <tr>
            <td align="center" style="padding: 24px 16px;">
                <!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #ffffff;"><tr><td><![endif]-->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden;">

                    <!-- HEADER -->
                    <tr>
                        <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #eee;">
                            <a href="${APP_URL}" style="text-decoration: none;">
                                <img src="${APP_URL}/images/logo.png" alt="Retiru" width="130" style="display: block; margin: 0 auto; max-width: 130px; height: auto; border: 0;" />
                            </a>
                        </td>
                    </tr>

                    <!-- TITLE -->
                    <tr>
                        <td style="padding: 40px 40px 16px; text-align: center;" class="section-padding">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.3; font-family: Georgia, serif;" class="hero-title">${title}</h1>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding: 0 40px 32px;" class="section-padding">
                            ${body}
                        </td>
                    </tr>

                    <!-- CTA -->
                    ${ctaHtml}

                    <!-- FOOTNOTE -->
                    ${footnoteHtml}

                    <!-- SPACER -->
                    <tr><td style="height: 16px;"></td></tr>

                    <!-- SEPARATOR -->
                    <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #eee;"></div></td></tr>

                    <!-- SIGNATURE -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 0;">
                            <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #1a1a1a; font-family: Arial, sans-serif;">
                                ${t(locale, 'Un abrazo del equipo de Retiru', 'Warm regards from the Retiru team')}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif; line-height: 1.5;">
                                ${t(locale, 'Hecho con cari&ntilde;o desde Murcia', 'Made with love from Murcia')} &middot; <a href="${APP_URL}" style="color: #c85a30; text-decoration: underline;">retiru.com</a>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 28px 30px; text-align: center; border-top: 1px solid #eee;">
                            <a href="${APP_URL}" style="text-decoration: none;">
                                <img src="${APP_URL}/images/logo.png" alt="Retiru" width="100" style="display: block; margin: 0 auto; max-width: 100px; height: auto; border: 0;" />
                            </a>
                            <div style="height: 12px;"></div>
                            <table cellpadding="0" cellspacing="0" border="0" align="center" class="footer-nav">
                                <tr>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}/${t(locale, 'es/centros-retiru', 'en/centers-retiru')}" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">${t(locale, 'Centros', 'Centers')}</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}/${t(locale, 'es/retiros-retiru', 'en/retreats-retiru')}" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">${t(locale, 'Retiros', 'Retreats')}</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}/${t(locale, 'es/para-organizadores', 'en/for-organizers')}" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">${t(locale, 'Para organizadores', 'For organizers')}</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="${APP_URL}/${t(locale, 'es/blog', 'en/blog')}" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">Blog</a></td>
                                </tr>
                            </table>
                            <p style="margin: 14px 0 0 0; font-size: 10px; color: #bbbbbb; font-family: Arial, sans-serif; line-height: 1.6;">
                                &copy; 2026 Retiru. ${t(locale, 'Todos los derechos reservados.', 'All rights reserved.')}<br>
                                ${t(locale, 'Hecho con', 'Made with')} &#10084;&#65039; ${t(locale, 'en Murcia', 'in Murcia')} &middot; <a href="https://www.eskaladigital.com" style="color: #bbbbbb; text-decoration: underline;">Web por ESKALA</a>
                            </p>
                        </td>
                    </tr>

                </table>
                <!--[if mso]></td></tr></table><![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Helper: info box (beige rounded card)
function infoBox(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="background-color: #f8f2e6; border-radius: 12px; padding: 20px;">
            ${content}
        </td>
    </tr>
</table>`;
}

function paragraph(text: string): string {
  return `<p style="margin: 0 0 14px 0; font-size: 15px; color: #555555; line-height: 1.7; font-family: Arial, sans-serif;">${text}</p>`;
}

function accentParagraph(text: string): string {
  return `<p style="margin: 0 0 14px 0; font-size: 15px; color: #c85a30; line-height: 1.7; font-family: Arial, sans-serif; font-weight: 600;">${text}</p>`;
}

function infoLine(label: string, value: string): string {
  return `<p style="margin: 4px 0; font-size: 14px; color: #333333; font-family: Arial, sans-serif;"><strong>${label}:</strong> ${value}</p>`;
}

// ─── Booking Confirmed ──────────────────────────────────────────────────────

export async function sendBookingConfirmedEmail(
  options: EmailOptions & {
    bookingNumber: string;
    eventTitle: string;
    startDate: string;
    totalPrice: number;
  }
) {
  const { to, locale, bookingNumber, eventTitle, startDate, totalPrice } = options;

  const subject = t(locale,
    `¡Reserva confirmada! — ${eventTitle}`,
    `Booking confirmed! — ${eventTitle}`
  );

  const body = [
    paragraph(t(locale,
      `Tu reserva para <strong>${eventTitle}</strong> ha sido confirmada. El pago completo ha sido procesado correctamente.`,
      `Your booking for <strong>${eventTitle}</strong> has been confirmed. Your payment has been processed successfully.`
    )),
    infoBox([
      infoLine(t(locale, 'N&ordm; de reserva', 'Booking number'), bookingNumber),
      infoLine(t(locale, 'Fecha', 'Date'), startDate),
      infoLine(t(locale, 'Importe pagado', 'Amount paid'), `${totalPrice}&euro;`),
    ].join('')),
    paragraph(t(locale,
      'El organizador se pondr&aacute; en contacto contigo con los detalles pr&aacute;cticos. Tambi&eacute;n puedes escribirle desde tu panel de reservas.',
      'The organizer will get in touch with you with practical details. You can also message them from your bookings panel.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, '&iexcl;Tu plaza est&aacute; confirmada!', 'Your spot is confirmed!'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/mis-reservas', 'en/my-bookings')}`,
      label: t(locale, 'Ver mi reserva', 'View my booking'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Payment Reminder to Attendee (DEPRECATED — full payment model) ─────────
// Kept as no-op to avoid breaking existing imports.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendPaymentReminderEmail(_options: EmailOptions & { eventTitle: string; organizerAmount: number; dueDate: string }) {
  return null;
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

  const subject = t(locale,
    `Nueva reserva: ${attendeeName} — ${eventTitle}`,
    `New booking: ${attendeeName} — ${eventTitle}`
  );

  const actionText = requiresConfirmation
    ? accentParagraph(t(locale,
        `&#9888;&#65039; Tienes ${slaHours || 48} horas para confirmar o rechazar esta reserva.`,
        `&#9888;&#65039; You have ${slaHours || 48} hours to confirm or reject this booking.`
      ))
    : `<p style="margin: 0 0 14px 0; font-size: 15px; color: #47654b; line-height: 1.7; font-family: Arial, sans-serif; font-weight: 600;">&#9989; ${t(locale, 'La reserva se ha confirmado autom&aacute;ticamente.', 'The booking has been automatically confirmed.')}</p>`;

  const body = [
    paragraph(`<strong>${attendeeName}</strong> ${t(locale, 'ha reservado plaza en', 'has booked a spot in')} <strong>${eventTitle}</strong>`),
    infoBox(infoLine(t(locale, 'N&ordm; de reserva', 'Booking number'), bookingNumber)),
    actionText,
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, 'Nueva reserva recibida', 'New booking received'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/panel/reservas', 'en/panel/bookings')}`,
      label: t(locale, 'Ver en mi panel', 'View in my panel'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Claim Approved ─────────────────────────────────────────────────────────

export async function sendClaimApprovedEmail(
  options: EmailOptions & {
    centerName: string;
    centerSlug: string;
  }
) {
  const { to, locale, centerName, centerSlug } = options;

  const subject = t(locale,
    `¡Tu centro ha sido verificado! — ${centerName}`,
    `Your center has been verified! — ${centerName}`
  );

  const body = [
    paragraph(t(locale,
      `Tu solicitud para gestionar <strong>${centerName}</strong> ha sido aprobada. Ya puedes editar la ficha de tu centro, actualizar fotos, horarios y publicar eventos.`,
      `Your request to manage <strong>${centerName}</strong> has been approved. You can now edit your center profile, update photos, schedules and publish events.`
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, '&iexcl;Enhorabuena! Tu centro ha sido verificado', 'Congratulations! Your center is verified'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/mis-centros', 'en/my-centers')}`,
      label: t(locale, 'Gestionar mi centro', 'Manage my center'),
    },
    footnote: `<a href="${APP_URL}/${t(locale, 'es/centro', 'en/center')}/${centerSlug}" style="color: #c85a30; text-decoration: underline;">${t(locale, 'Ver la ficha p&uacute;blica de tu centro', 'View your center&#39;s public page')}</a>`,
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Claim Rejected ─────────────────────────────────────────────────────────

export async function sendClaimRejectedEmail(
  options: EmailOptions & {
    centerName: string;
    adminNotes?: string;
  }
) {
  const { to, locale, centerName, adminNotes } = options;

  const subject = t(locale,
    `Solicitud de centro no aprobada — ${centerName}`,
    `Center claim not approved — ${centerName}`
  );

  const notesHtml = adminNotes
    ? infoBox(`<p style="margin: 0; font-size: 14px; color: #555555; font-family: Arial, sans-serif;"><strong>${t(locale, 'Motivo', 'Reason')}:</strong> ${adminNotes}</p>`)
    : '';

  const body = [
    paragraph(t(locale,
      `Tu solicitud para gestionar <strong>${centerName}</strong> no ha sido aprobada en esta ocasi&oacute;n.`,
      `Your request to manage <strong>${centerName}</strong> has not been approved at this time.`
    )),
    notesHtml,
    paragraph(t(locale,
      'Si crees que se trata de un error, puedes contactarnos respondiendo a este email o a trav&eacute;s de nuestro chat de soporte.',
      'If you believe this is a mistake, please contact us by replying to this email or through our support chat.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, 'Solicitud no aprobada', 'Claim not approved'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/contacto', 'en/contact')}`,
      label: t(locale, 'Contactar soporte', 'Contact support'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Retreat Approved ───────────────────────────────────────────────────────

export async function sendRetreatApprovedEmail(
  options: EmailOptions & {
    eventTitle: string;
    eventSlug: string;
  }
) {
  const { to, locale, eventTitle, eventSlug } = options;

  const subject = t(locale,
    `¡Tu retiro ha sido publicado! — ${eventTitle}`,
    `Your retreat has been published! — ${eventTitle}`
  );

  const body = [
    paragraph(t(locale,
      `<strong>${eventTitle}</strong> ha sido revisado y aprobado. Ya es visible para los usuarios de Retiru y puede recibir reservas.`,
      `<strong>${eventTitle}</strong> has been reviewed and approved. It&#39;s now visible to Retiru users and can receive bookings.`
    )),
    paragraph(t(locale,
      'Comparte el enlace de tu retiro en redes sociales y WhatsApp para atraer m&aacute;s asistentes.',
      'Share your retreat link on social media and WhatsApp to attract more attendees.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, '&iexcl;Tu retiro ya est&aacute; publicado!', 'Your retreat is now live!'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/retiro', 'en/retreat')}/${eventSlug}`,
      label: t(locale, 'Ver mi retiro publicado', 'View my published retreat'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Retreat Rejected ───────────────────────────────────────────────────────

export async function sendRetreatRejectedEmail(
  options: EmailOptions & {
    eventTitle: string;
    rejectionReason?: string;
  }
) {
  const { to, locale, eventTitle, rejectionReason } = options;

  const subject = t(locale,
    `Tu retiro necesita cambios — ${eventTitle}`,
    `Your retreat needs changes — ${eventTitle}`
  );

  const reasonHtml = rejectionReason
    ? infoBox(`<p style="margin: 0; font-size: 14px; color: #555555; font-family: Arial, sans-serif;"><strong>${t(locale, 'Motivo', 'Reason')}:</strong> ${rejectionReason}</p>`)
    : '';

  const body = [
    paragraph(t(locale,
      `Hemos revisado <strong>${eventTitle}</strong> y necesita algunos ajustes antes de poder publicarse.`,
      `We&#39;ve reviewed <strong>${eventTitle}</strong> and it needs some adjustments before it can be published.`
    )),
    reasonHtml,
    paragraph(t(locale,
      'Puedes corregirlo desde tu panel y volver a enviarlo a revisi&oacute;n. Si tienes dudas, contacta con nuestro equipo.',
      'You can fix it from your panel and resubmit for review. If you have questions, contact our team.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, 'Tu retiro necesita algunos cambios', 'Your retreat needs some changes'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/mis-eventos', 'en/my-events')}`,
      label: t(locale, 'Editar mi retiro', 'Edit my retreat'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── New Message Notification ───────────────────────────────────────────────

export async function sendNewMessageEmail(
  options: EmailOptions & {
    senderName: string;
    messagePreview: string;
    conversationUrl: string;
    context?: string;
  }
) {
  const { to, locale, senderName, messagePreview, conversationUrl, context } = options;

  const subject = t(locale,
    `Nuevo mensaje de ${senderName} en Retiru`,
    `New message from ${senderName} on Retiru`
  );

  const contextLine = context
    ? `<p style="margin: 0 0 14px 0; font-size: 13px; color: #999999; font-family: Arial, sans-serif;">${context}</p>`
    : '';

  const preview = messagePreview.length > 200 ? messagePreview.slice(0, 200) + '&hellip;' : messagePreview;

  const body = [
    contextLine,
    infoBox([
      `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1a1a1a; font-family: Arial, sans-serif;">${senderName}</p>`,
      `<p style="margin: 0; font-size: 14px; color: #555555; line-height: 1.6; font-family: Arial, sans-serif; white-space: pre-line;">${preview}</p>`,
    ].join('')),
  ].join('');

  const html = emailLayout({
    locale, preheader: `${senderName}: ${messagePreview.slice(0, 80)}`,
    title: t(locale, 'Tienes un nuevo mensaje', 'You have a new message'),
    body,
    cta: {
      href: conversationUrl,
      label: t(locale, 'Responder', 'Reply'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Booking Cancelled ──────────────────────────────────────────────────────

export async function sendBookingCancelledEmail(
  options: EmailOptions & {
    bookingNumber: string;
    eventTitle: string;
    cancelledBy: 'attendee' | 'organizer' | 'system';
    reason?: string;
    refundAmount?: number;
  }
) {
  const { to, locale, bookingNumber, eventTitle, cancelledBy, reason, refundAmount } = options;

  const subject = t(locale,
    `Reserva cancelada — ${eventTitle}`,
    `Booking cancelled — ${eventTitle}`
  );

  const cancelledByText = {
    attendee: t(locale, 'el asistente', 'the attendee'),
    organizer: t(locale, 'el organizador', 'the organizer'),
    system: t(locale, 'el sistema (plazo expirado)', 'the system (deadline expired)'),
  }[cancelledBy];

  const reasonLine = reason
    ? infoLine(t(locale, 'Motivo', 'Reason'), reason)
    : '';
  const refundLine = refundAmount !== undefined && refundAmount > 0
    ? `<p style="margin: 4px 0; font-size: 14px; color: #47654b; font-family: Arial, sans-serif;"><strong>${t(locale, 'Reembolso', 'Refund')}:</strong> ${refundAmount}&euro;</p>`
    : '';

  const body = [
    paragraph(t(locale,
      `La reserva para <strong>${eventTitle}</strong> ha sido cancelada por ${cancelledByText}.`,
      `The booking for <strong>${eventTitle}</strong> has been cancelled by ${cancelledByText}.`
    )),
    infoBox([
      infoLine(t(locale, 'N&ordm; de reserva', 'Booking number'), bookingNumber),
      reasonLine,
      refundLine,
    ].join('')),
    paragraph(t(locale,
      'Si tienes alguna duda, contacta con nuestro equipo de soporte.',
      'If you have any questions, please contact our support team.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, 'Reserva cancelada', 'Booking cancelled'),
    body,
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Booking Rejected (to attendee) ────────────────────────────────────────

export async function sendBookingRejectedEmail(
  options: EmailOptions & {
    bookingNumber: string;
    eventTitle: string;
    reason?: string;
    refundAmount?: number;
  }
) {
  const { to, locale, bookingNumber, eventTitle, reason, refundAmount } = options;

  const subject = t(locale,
    `Reserva no aceptada — ${eventTitle}`,
    `Booking not accepted — ${eventTitle}`
  );

  const reasonHtml = reason
    ? infoBox(`<p style="margin: 0; font-size: 14px; color: #555555; font-family: Arial, sans-serif;"><strong>${t(locale, 'Motivo', 'Reason')}:</strong> ${reason}</p>`)
    : '';

  const refundLine = refundAmount !== undefined && refundAmount > 0
    ? `<p style="margin: 0 0 14px 0; font-size: 15px; color: #47654b; line-height: 1.7; font-family: Arial, sans-serif;">${t(locale,
        `Se ha procesado un reembolso de <strong>${refundAmount}&euro;</strong> a tu m&eacute;todo de pago original.`,
        `A refund of <strong>&euro;${refundAmount}</strong> has been processed to your original payment method.`
      )}</p>`
    : '';

  const body = [
    paragraph(t(locale,
      `El organizador no ha aceptado tu reserva (N&ordm; ${bookingNumber}) para <strong>${eventTitle}</strong>.`,
      `The organizer has not accepted your booking (N&ordm; ${bookingNumber}) for <strong>${eventTitle}</strong>.`
    )),
    reasonHtml,
    refundLine,
    paragraph(t(locale,
      'Puedes buscar otros retiros que se adapten a lo que buscas.',
      'You can browse other retreats that might suit you.'
    )),
  ].join('');

  const html = emailLayout({
    locale, preheader: subject,
    title: t(locale, 'Reserva no aceptada', 'Booking not accepted'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/retiros-retiru', 'en/retreats-retiru')}`,
      label: t(locale, 'Explorar retiros', 'Explore retreats'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Event Reminder (pre-event) ─────────────────────────────────────────────

export function buildEventReminderHtml(opts: {
  locale: 'es' | 'en';
  daysBefore: number;
  eventTitle: string;
  startDate: string;
  address?: string;
  bookingNumber: string;
  formReminder?: string;
  bookingUrl: string;
}): string {
  const { locale, daysBefore, eventTitle, startDate, address, bookingNumber, formReminder, bookingUrl } = opts;

  const body = [
    paragraph(`<strong>${eventTitle}</strong>`),
    infoBox([
      infoLine('&#128197; ' + t(locale, 'Fecha', 'Date'), startDate),
      address ? infoLine('&#128205; ' + t(locale, 'Lugar', 'Location'), address) : '',
      infoLine(t(locale, 'N&ordm; de reserva', 'Booking number'), bookingNumber),
    ].join('')),
    formReminder ? accentParagraph(formReminder) : '',
  ].join('');

  return emailLayout({
    locale,
    preheader: t(locale,
      `¡Tu retiro es en ${daysBefore} días!`,
      `Your retreat is in ${daysBefore} days!`
    ),
    title: t(locale,
      `&iexcl;Tu retiro es en ${daysBefore} d&iacute;as!`,
      `Your retreat is in ${daysBefore} days!`
    ),
    body,
    cta: {
      href: bookingUrl,
      label: t(locale, 'Ver mi reserva', 'View my booking'),
    },
  });
}

// ─── Review Request (post-event) ────────────────────────────────────────────

export function buildReviewRequestHtml(opts: {
  locale: 'es' | 'en';
  eventTitle: string;
  retreatUrl: string;
}): string {
  const { locale, eventTitle, retreatUrl } = opts;

  const body = [
    paragraph(t(locale,
      `Tu experiencia en <strong>${eventTitle}</strong> ha terminado. &iquest;Nos cuentas qu&eacute; te ha parecido?`,
      `Your experience at <strong>${eventTitle}</strong> has ended. Would you like to share your thoughts?`
    )),
    paragraph(t(locale,
      'Tu opini&oacute;n ayuda a otros viajeros y al organizador a mejorar.',
      'Your review helps other travelers and the organizer improve.'
    )),
  ].join('');

  return emailLayout({
    locale,
    preheader: t(locale, `¿Qué te ha parecido ${eventTitle}?`, `How was ${eventTitle}?`),
    title: t(locale, '&iexcl;Esperamos que hayas disfrutado!', 'We hope you enjoyed it!'),
    body,
    cta: {
      href: retreatUrl,
      label: t(locale, 'Dejar rese&ntilde;a', 'Leave a review'),
    },
  });
}

// ─── Broadcast (organizer → attendees) ──────────────────────────────────────

export function buildBroadcastHtml(opts: {
  locale: 'es' | 'en';
  organizerName: string;
  eventTitle: string;
  message: string;
}): string {
  const { locale, organizerName, eventTitle, message } = opts;

  const body = [
    `<p style="margin: 0 0 14px 0; font-size: 13px; color: #999999; font-family: Arial, sans-serif;">${t(locale, 'Mensaje sobre', 'Message about')} <strong>${eventTitle}</strong></p>`,
    infoBox([
      `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1a1a1a; font-family: Arial, sans-serif;">${organizerName}</p>`,
      `<p style="margin: 0; font-size: 14px; color: #555555; line-height: 1.6; font-family: Arial, sans-serif; white-space: pre-line;">${message}</p>`,
    ].join('')),
  ].join('');

  return emailLayout({
    locale,
    preheader: `${organizerName}: ${message.slice(0, 80)}`,
    title: t(locale, `Mensaje de ${organizerName}`, `Message from ${organizerName}`),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/mensajes', 'en/messages')}`,
      label: t(locale, 'Responder en Retiru', 'Reply on Retiru'),
    },
  });
}

// ─── Welcome Email (after signup verification) ──────────────────────────────

export async function sendWelcomeEmail(
  options: EmailOptions & { fullName: string }
) {
  const { to, locale, fullName } = options;

  const subject = t(locale,
    '¡Bienvenido/a a Retiru!',
    'Welcome to Retiru!'
  );

  const body = [
    paragraph(t(locale,
      `&iexcl;Hola <strong>${fullName}</strong>! Tu cuenta en Retiru ya est&aacute; activa.`,
      `Hi <strong>${fullName}</strong>! Your Retiru account is now active.`
    )),
    paragraph(t(locale,
      'Ya puedes explorar retiros, guardar favoritos, reservar experiencias y mucho m&aacute;s.',
      'You can now explore retreats, save favourites, book experiences and much more.'
    )),
    accentParagraph(t(locale,
      '&iquest;Organizas retiros o tienes un centro? Solicita tu perfil de organizador desde tu panel.',
      'Do you organise retreats or own a centre? Request your organiser profile from your dashboard.'
    )),
  ].join('');

  const html = emailLayout({
    locale,
    preheader: t(locale, 'Tu cuenta está activa — explora retiros', 'Your account is active — explore retreats'),
    title: t(locale, '&iexcl;Bienvenido/a a Retiru!', 'Welcome to Retiru!'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/retiros-retiru', 'en/retreats-retiru')}`,
      label: t(locale, 'Explorar retiros', 'Explore retreats'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Retreat Sent to Review (→ admin) ───────────────────────────────────────

export async function sendRetreatPendingReviewEmail(
  options: { organizerName: string; eventTitle: string; retreatId: string }
) {
  const { organizerName, eventTitle, retreatId } = options;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contacto@retiru.com';

  const body = [
    paragraph(`El organizador <strong>${organizerName}</strong> ha enviado un retiro a revisi&oacute;n.`),
    infoBox([
      infoLine('Retiro', eventTitle),
      infoLine('Organizador', organizerName),
    ].join('')),
    paragraph('Entra al panel de administraci&oacute;n para revisarlo y aprobarlo o rechazarlo.'),
  ].join('');

  const html = emailLayout({
    locale: 'es',
    preheader: `Nuevo retiro pendiente: ${eventTitle}`,
    title: 'Retiro pendiente de revisi&oacute;n',
    body,
    cta: {
      href: `${APP_URL}/administrator/retiros`,
      label: 'Revisar en panel',
    },
  });

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔔 Retiro pendiente de revisión: ${eventTitle}`,
    html,
  });
}

// ─── Booking Expired (SLA / session) → attendee ─────────────────────────────

export async function sendBookingExpiredEmail(
  options: EmailOptions & { eventTitle: string; bookingNumber: string }
) {
  const { to, locale, eventTitle, bookingNumber } = options;

  const subject = t(locale,
    `Reserva expirada — ${eventTitle}`,
    `Booking expired — ${eventTitle}`
  );

  const body = [
    paragraph(t(locale,
      `Tu reserva <strong>#${bookingNumber}</strong> para <strong>${eventTitle}</strong> ha expirado porque el organizador no la confirm&oacute; a tiempo.`,
      `Your booking <strong>#${bookingNumber}</strong> for <strong>${eventTitle}</strong> has expired because the organizer did not confirm it in time.`
    )),
    paragraph(t(locale,
      'Se ha procesado el reembolso completo autom&aacute;ticamente. Recibir&aacute;s el importe en 5-10 d&iacute;as h&aacute;biles.',
      'A full refund has been processed automatically. You will receive the amount within 5-10 business days.'
    )),
    paragraph(t(locale,
      'Si a&uacute;n quieres asistir, puedes volver a reservar mientras haya plazas disponibles.',
      'If you still want to attend, you can rebook while spots are still available.'
    )),
  ].join('');

  const html = emailLayout({
    locale,
    preheader: t(locale, 'Tu reserva ha expirado', 'Your booking has expired'),
    title: t(locale, 'Reserva expirada', 'Booking expired'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/retiros-retiru', 'en/retreats-retiru')}`,
      label: t(locale, 'Ver retiros disponibles', 'View available retreats'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Retreat Cancelled → all attendees ──────────────────────────────────────

export async function sendRetreatCancelledToAttendeeEmail(
  options: EmailOptions & { eventTitle: string; organizerName: string }
) {
  const { to, locale, eventTitle, organizerName } = options;

  const subject = t(locale,
    `Retiro cancelado: ${eventTitle}`,
    `Retreat cancelled: ${eventTitle}`
  );

  const body = [
    paragraph(t(locale,
      `Lamentamos informarte de que el retiro <strong>${eventTitle}</strong>, organizado por <strong>${organizerName}</strong>, ha sido cancelado.`,
      `We regret to inform you that the retreat <strong>${eventTitle}</strong>, organised by <strong>${organizerName}</strong>, has been cancelled.`
    )),
    paragraph(t(locale,
      'Si hab&iacute;as realizado alg&uacute;n pago, se procesar&aacute; el reembolso completo autom&aacute;ticamente. Recibir&aacute;s el importe en 5-10 d&iacute;as h&aacute;biles.',
      'If you had made any payment, a full refund will be processed automatically. You will receive the amount within 5-10 business days.'
    )),
    paragraph(t(locale,
      'Mientras tanto, te invitamos a explorar otros retiros que podr&iacute;an interesarte.',
      'In the meantime, we invite you to explore other retreats that might interest you.'
    )),
  ].join('');

  const html = emailLayout({
    locale,
    preheader: t(locale, `El retiro ${eventTitle} ha sido cancelado`, `The retreat ${eventTitle} has been cancelled`),
    title: t(locale, 'Retiro cancelado', 'Retreat cancelled'),
    body,
    cta: {
      href: `${APP_URL}/${t(locale, 'es/retiros-retiru', 'en/retreats-retiru')}`,
      label: t(locale, 'Explorar retiros', 'Explore retreats'),
    },
  });

  return resend.emails.send({ from: FROM, to, subject, html });
}

// ─── New Claim Pending → admin ──────────────────────────────────────────────

export async function sendNewClaimPendingEmail(
  options: { userName: string; userEmail: string; centerName: string; centerId: string }
) {
  const { userName, userEmail, centerName, centerId } = options;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contacto@retiru.com';

  const body = [
    paragraph(`El usuario <strong>${userName}</strong> (${userEmail}) ha solicitado reclamar un centro.`),
    infoBox([
      infoLine('Centro', centerName),
      infoLine('Usuario', `${userName} — ${userEmail}`),
    ].join('')),
    paragraph('Entra al panel de administraci&oacute;n para revisarlo.'),
  ].join('');

  const html = emailLayout({
    locale: 'es',
    preheader: `Nuevo claim: ${centerName}`,
    title: 'Nuevo claim de centro pendiente',
    body,
    cta: {
      href: `${APP_URL}/administrator/claims`,
      label: 'Revisar claims',
    },
  });

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔔 Nuevo claim pendiente: ${centerName}`,
    html,
  });
}

// ─── New center proposal (user) → admin ───────────────────────────────────────

export async function sendNewCenterProposalEmail(options: {
  userName: string;
  userEmail: string;
  centerName: string;
  city: string;
  province: string;
  centerId: string;
}) {
  const { userName, userEmail, centerName, city, province, centerId } = options;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contacto@retiru.com';

  const body = [
    paragraph(`Un usuario ha propuesto un <strong>nuevo centro</strong> desde el directorio (pendiente de tu revisi&oacute;n).`),
    infoBox([
      infoLine('Centro', centerName),
      infoLine('Ubicaci&oacute;n', `${city}, ${province}`),
      infoLine('ID', centerId),
      infoLine('Usuario', `${userName} — ${userEmail}`),
    ].join('')),
    paragraph('Rev&iacute;salo en la lista de centros (estado &laquo;Propuesta pendiente&raquo;) y aprueba o rechaza.'),
  ].join('');

  const html = emailLayout({
    locale: 'es',
    preheader: `Nueva propuesta: ${centerName}`,
    title: 'Nueva propuesta de centro',
    body,
    cta: {
      href: `${APP_URL}/administrator/centros`,
      label: 'Ver centros',
    },
  });

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `📍 Nueva propuesta de centro: ${centerName}`,
    html,
  });
}

// ─── Payment Overdue → organizer (DEPRECATED — full payment model) ──────────
// Kept as no-op to avoid breaking existing imports.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendPaymentOverdueToOrganizerEmail(_options: EmailOptions & { eventTitle: string; attendeeName: string; bookingNumber: string; dueDate: string }) {
  return null;
}
