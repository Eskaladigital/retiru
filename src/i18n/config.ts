// ============================================================================
// RETIRU · i18n Configuration
// ============================================================================

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

// Route mappings between locales
export const routeMap: Record<string, Record<Locale, string>> = {
  home:            { es: '',                  en: '' },
  search:          { es: 'buscar',            en: 'search' },
  retreats:        { es: 'retiros',           en: 'retreats' },
  categories:      { es: 'retiros-retiru',     en: 'retreats-retiru' },
  destinations:    { es: 'destinos',          en: 'destinations' },
  organizerPublic: { es: 'organizador',       en: 'organizer' },
  forOrganizers:   { es: 'para-organizadores', en: 'for-organizers' },
  forAttendees:    { es: 'para-asistentes',    en: 'for-attendees' },
  help:            { es: 'ayuda',             en: 'help' },
  login:           { es: 'login',             en: 'login' },
  register:        { es: 'registro',          en: 'register' },
  myBookings:      { es: 'mis-reservas',      en: 'my-bookings' },
  messages:        { es: 'mensajes',          en: 'messages' },
  profile:         { es: 'perfil',            en: 'profile' },
  invoices:        { es: 'facturas',          en: 'invoices' },
};

export function getLocalizedPath(route: string, locale: Locale): string {
  const mapped = routeMap[route]?.[locale] ?? route;
  return `/${locale}/${mapped}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}
