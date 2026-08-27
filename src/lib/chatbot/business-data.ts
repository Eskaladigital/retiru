import { CONTACT_EMAIL, SITE_URL, type ChatLocale } from './config'

export function buildBusinessDataBlock(locale: ChatLocale, directoryLive: string): string {
  const facts =
    locale === 'en'
      ? `LIVE FACTS (highest priority):
- Marketplace: Retiru lists yoga, meditation and ayurveda centers and lets people book classes, day events and multi-day retreats.
- Site: ${SITE_URL}  ES: ${SITE_URL}/es  EN: ${SITE_URL}/en
- Help: ${SITE_URL}/en/help  Contact: ${SITE_URL}/en/contact  Email: ${CONTACT_EMAIL}
- Organizers: no monthly subscription. First retreat 0% commission, second 10%, from the third 20% of PVP. Attendee always pays the listed PVP.
- Directory listing: 20 €/month after a 6-month courtesy period for selected centers at launch.
- Payments: Stripe (card) when online checkout is on. If online payment is not active yet (launch) or the event has a minimum group size not yet met, the attendee can hold a spot without paying and gets an email when it is time to pay. Always the listed PVP; see help for cancel rules. 48h cooling-off 100% refund if the event starts in more than 7 days.
- This widget is Roy (AI guide). Human support is Andrea (login required). WhatsApp is not the chat of this site.
- Product languages: Spanish and English only. Reply in the visitor's language; do not invent a third language for URLs.
- Do not invent availability, medical claims, or that a retreat includes lodging unless the event card says so.`
      : `DATOS EN TIEMPO REAL (prioridad máxima):
- Marketplace: Retiru es directorio de centros de yoga, meditación y ayurveda, y reserva de clases, eventos de un día y retiros de varios días.
- Web: ${SITE_URL}  ES: ${SITE_URL}/es  EN: ${SITE_URL}/en
- Ayuda: ${SITE_URL}/es/ayuda  Contacto: ${SITE_URL}/es/contacto  Email: ${CONTACT_EMAIL}
- Organizadores: sin suscripción. Primer retiro 0 % de comisión, segundo 10 %, a partir del tercero 20 % del PVP. El asistente paga el PVP publicado.
- Directorio: 20 €/mes tras 6 meses de cortesía para centros seleccionados en el lanzamiento.
- Pagos: con cobro online, Stripe (tarjeta) y el PVP publicado. Si el cobro aún no está activo (lanzamiento) o hay un mínimo de plazas no alcanzado, se puede reservar sin pagar y llega un email cuando toca pagar. Cancelación: ver ayuda. 48 h de arrepentimiento con 100 % si faltan más de 7 días para el inicio.
- Este widget es Roy (guía con IA). El soporte humano es Andrea (hace falta iniciar sesión). WhatsApp no es el chat de esta web.
- Idiomas del producto: solo español e inglés. Responde en el idioma del visitante; no inventes una tercera lengua en las URLs.
- No inventes disponibilidad, claims médicos, ni que un retiro incluye alojamiento salvo que la ficha lo diga.`

  return `${facts}

${directoryLive}`
}
