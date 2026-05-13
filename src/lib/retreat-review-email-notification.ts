/**
 * Estado del envío de email al organizador tras aprobar/rechazar (admin).
 * Módulo sin nodemailer: seguro para importar en componentes cliente.
 */
export type RetreatReviewEmailNotification =
  | { sent: true }
  | { sent: false; reason: 'no_org_profile' | 'no_organizer_email' | 'send_failed' };

export function retreatReviewEmailUserHintEs(n: RetreatReviewEmailNotification | undefined): string | null {
  if (!n || n.sent) return null;
  if (n.reason === 'no_org_profile') return 'El retiro se guardó pero no hay organizador vinculado para enviar la notificación por email.';
  if (n.reason === 'no_organizer_email') return 'El retiro se guardó pero el organizador no tiene email en perfil.';
  return 'El retiro se publicó pero no se envió el email al organizador. Revisa en Vercel (entorno Producción) las variables SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD, y los logs de la ruta si sigue fallando.';
}
