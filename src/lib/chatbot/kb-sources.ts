import { createHash } from 'crypto'
import { CONTACT_EMAIL, SITE_URL } from './config'
import type { IngestChunk } from './types'

export function makeChunk(
  source: string,
  locale: IngestChunk['locale'],
  title: string,
  content: string
): IngestChunk {
  const normalized = content.trim()
  return {
    source,
    locale,
    title,
    content: normalized,
    content_hash: createHash('sha256')
      .update(`${source}:${locale}:${title}:${normalized}`)
      .digest('hex'),
  }
}

export function chunksFromPlataforma(): IngestChunk[] {
  return [
    makeChunk(
      'plataforma',
      'es',
      'Qué es Retiru',
      `Retiru es un marketplace de yoga, meditación y ayurveda. Tres caminos: directorio de centros, clases y actividades de un día, y retiros de varios días. Los eventos se organizan desde España y pueden celebrarse también en Portugal y Marruecos. Web: ${SITE_URL}/es`
    ),
    makeChunk(
      'plataforma',
      'en',
      'What Retiru is',
      `Retiru is a yoga, meditation and ayurveda marketplace. Three paths: a directory of centers, day classes and activities, and multi-day retreats. Events are organized from Spain and may also take place in Portugal and Morocco. Site: ${SITE_URL}/en`
    ),
    makeChunk(
      'plataforma',
      'es',
      'Directorio de centros',
      `El directorio lista centros de yoga, meditación y ayurveda. Ficha: /es/centro/{slug}. Hubs: ${SITE_URL}/es/centros/yoga, ${SITE_URL}/es/centros/meditacion, ${SITE_URL}/es/centros/ayurveda. Buscador: ${SITE_URL}/es/buscar. Reclamar un centro: botón en la ficha. Proponer uno nuevo: Mis centros. Cuota 20 €/mes tras 6 meses de cortesía en el lanzamiento para centros seleccionados.`
    ),
    makeChunk(
      'plataforma',
      'en',
      'Centers directory',
      `The directory lists yoga, meditation and ayurveda centers. Profile: /en/center/{slug}. Hubs: ${SITE_URL}/en/centers/yoga, ${SITE_URL}/en/centers/meditation, ${SITE_URL}/en/centers/ayurveda. Search: ${SITE_URL}/en/search. Claim a center from its page. Suggest a new one from My centers. Listing fee 20 €/month after a 6-month courtesy period at launch for selected centers.`
    ),
    makeChunk(
      'plataforma',
      'es',
      'Contacto y Roy',
      `Email: ${CONTACT_EMAIL}. Contacto: ${SITE_URL}/es/contacto. Ayuda: ${SITE_URL}/es/ayuda. El chat flotante de la web es Roy (guía con IA sobre directorio, blog y retiros). El soporte humano se llama Andrea y pide iniciar sesión. WhatsApp no es el chat de esta web.`
    ),
    makeChunk(
      'plataforma',
      'en',
      'Contact and Roy',
      `Email: ${CONTACT_EMAIL}. Contact: ${SITE_URL}/en/contact. Help: ${SITE_URL}/en/help. The floating chat is Roy (AI guide for the directory, blog and retreats). Human support is Andrea and requires login. WhatsApp is not this site's chat.`
    ),
  ]
}

export function chunksFromFaqs(): IngestChunk[] {
  return [
    makeChunk(
      'faqs',
      'es',
      '¿Cómo funciona la reserva?',
      `P: ¿Cómo funciona la reserva?\nR: Con cobro online, en la mayoría de retiros pagas el PVP (precio publicado por persona) con tarjeta (Stripe). Si hay un mínimo de plazas o el cobro aún no está activo, puedes reservar sin pagar y te avisamos por email. Detalle: ${SITE_URL}/es/ayuda`
    ),
    makeChunk(
      'faqs',
      'en',
      'How does booking work?',
      `Q: How does booking work?\nA: When online payment is on, you pay the listed PVP per person by card (Stripe). If there is a minimum group size or online payment is not active yet, you can hold a spot without paying and we email you. Details: ${SITE_URL}/en/help`
    ),
    makeChunk(
      'faqs',
      'es',
      '¿Puedo cancelar mi reserva?',
      `P: ¿Puedo cancelar?\nR: Sí, en Mis reservas. 48 h de garantía de reembolso 100 % si faltan más de 7 días para el inicio. Después aplica la política del evento (la flexible: 100 % hasta 7 días antes y 50 % hasta 3). El reembolso va íntegro a tu tarjeta. ${SITE_URL}/es/ayuda`
    ),
    makeChunk(
      'faqs',
      'en',
      'Can I cancel my booking?',
      `Q: Can I cancel?\nA: Yes, from My bookings. 48h 100% refund if the event starts in more than 7 days. After that the event policy applies (flexible: 100% until 7 days before, 50% until 3). Refunds go in full to your card. ${SITE_URL}/en/help`
    ),
    makeChunk(
      'faqs',
      'es',
      '¿Cuánto cuesta publicar retiros?',
      `P: ¿Cuánto cuesta publicar?\nR: Sin suscripción. Primer retiro 0 % de comisión; segundo 10 %; a partir del tercero 20 % del PVP. El asistente paga el PVP sin recargo. Empieza en ${SITE_URL}/es/para-organizadores`
    ),
    makeChunk(
      'faqs',
      'en',
      'How much does it cost to publish retreats?',
      `Q: How much to publish?\nA: No subscription. First retreat 0% commission; second 10%; from the third 20% of PVP. The attendee pays the listed PVP. Start at ${SITE_URL}/en/for-organizers`
    ),
    makeChunk(
      'faqs',
      'es',
      '¿Cómo reclamo mi centro?',
      `P: ¿Cómo reclamo o propongo un centro?\nR: Si ya está, ábrelo y «Reclamar este centro». Si no, Mis centros → Proponer nuevo centro (Google Maps). El equipo revisa. ${SITE_URL}/es/ayuda`
    ),
    makeChunk(
      'faqs',
      'en',
      'How do I claim my center?',
      `Q: How do I claim or suggest a center?\nA: If it is listed, open it and Claim this center. If not, My centers → Suggest a new center (Google Maps). The team reviews it. ${SITE_URL}/en/help`
    ),
    makeChunk(
      'faqs',
      'es',
      '¿El precio incluye alojamiento?',
      `P: ¿El precio incluye alojamiento?\nR: Depende de cada retiro. Hay que mirar «Qué incluye» en la ficha. Roy no debe afirmarlo si la ficha viva no lo dice.`
    ),
    makeChunk(
      'faqs',
      'en',
      'Does the price include accommodation?',
      `Q: Does the price include lodging?\nA: It depends on each retreat. Check What's included on the event page. Roy must not claim it unless the live card says so.`
    ),
    makeChunk(
      'faqs',
      'es',
      'Eventos periódicos',
      `P: ¿Puedo apuntarme a una clase semanal?\nR: Sí. En un evento periódico puedes reservar una fecha o varias (hasta 7 semanas). Cada día es una reserva. El organizador marca «Evento periódico». Listados: ${SITE_URL}/es/retiros-retiru`
    ),
    makeChunk(
      'faqs',
      'en',
      'Recurring events',
      `Q: Can I join a weekly class?\nA: Yes. On a recurring event you can book one date or several (up to 7 weeks). Each day is its own booking. Organizers tick Recurring event. Listings: ${SITE_URL}/en/retreats-retiru`
    ),
  ]
}

export function chunkFromArticle(
  locale: 'es' | 'en',
  article: {
    title_es?: string | null
    title_en?: string | null
    slug?: string | null
    slug_en?: string | null
    excerpt_es?: string | null
    excerpt_en?: string | null
    content_es?: string | null
    content_en?: string | null
    category?: string | null
  }
): IngestChunk | null {
  const title = (locale === 'en' ? article.title_en || article.title_es : article.title_es || article.title_en)?.trim()
  const slug =
    locale === 'en'
      ? (article.slug_en || article.slug || '').trim()
      : (article.slug || '').trim()
  if (!title || !slug) return null
  const html = locale === 'en' ? article.content_en || article.content_es : article.content_es || article.content_en
  const plain = stripHtml(html || '')
  const intro = plain.slice(0, 900)
  const excerpt =
    (locale === 'en' ? article.excerpt_en || article.excerpt_es : article.excerpt_es || article.excerpt_en)?.trim() ||
    intro.slice(0, 280)
  if (!excerpt && !intro) return null
  const path = locale === 'en' ? `/en/blog/${slug}` : `/es/blog/${slug}`
  const cat = article.category || (locale === 'en' ? 'General' : 'General')
  return makeChunk(
    'blog',
    locale,
    title,
    locale === 'en'
      ? `Article: ${title}\nCategory: ${cat}\nExcerpt: ${excerpt}\n${intro ? `Intro: ${intro}` : ''}\nLink: ${SITE_URL}${path}`
      : `Artículo: ${title}\nCategoría: ${cat}\nExtracto: ${excerpt}\n${intro ? `Introducción: ${intro}` : ''}\nEnlace: ${SITE_URL}${path}`
  )
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function collectStaticChunks(): IngestChunk[] {
  return [...chunksFromPlataforma(), ...chunksFromFaqs()]
}
