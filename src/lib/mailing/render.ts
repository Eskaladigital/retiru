// ============================================================================
// RETIRU · Mailing · Render de placeholders
//
// Reemplaza las variables dinámicas de una plantilla HTML de mailing:
//   {{NOMBRE_CENTRO}}  {{LOCATION}}  {{FIN_MEMBRESIA}}  {{UNSUBSCRIBE_URL}}
//
// Mantener alineado con scripts/mailing.mjs · renderTemplate().
// ============================================================================

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export function formatFechaLargaEs(date: Date): string {
  return `${date.getDate()} de ${MESES_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function defaultFinMembresia(from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 6);
  return formatFechaLargaEs(d);
}

export function finMembresiaFromCenterCreatedAt(createdAt: string | Date | null | undefined): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 6);
  return formatFechaLargaEs(d);
}

export type RenderVars = {
  NOMBRE_CENTRO?: string | null;
  LOCATION?: string | null;
  FIN_MEMBRESIA?: string | null;
  UNSUBSCRIBE_URL?: string | null;
  [key: string]: string | null | undefined;
};

export function renderTemplate(html: string, vars: RenderVars): string {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v ?? '');
  }
  return out;
}

export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retiru.com').replace(/\/$/, '');
}

export function unsubscribeUrlFor(token: string | null | undefined): string {
  return token
    ? `${baseUrl()}/api/unsubscribe?t=${token}`
    : `${baseUrl()}/api/unsubscribe`;
}
