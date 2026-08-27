import type { ChatLocale } from './config'

export type MenuItem = { id: string; label: string; message?: string; children?: MenuItem[] }

const menusEs: MenuItem[] = [
  {
    id: 'centros',
    label: 'Centros',
    message: 'Busco un centro de yoga, meditación o ayurveda. ¿Cómo funciona el directorio?',
  },
  {
    id: 'retiros',
    label: 'Retiros y clases',
    message: '¿Qué retiros o clases hay publicados ahora y cómo reservo?',
  },
  {
    id: 'blog',
    label: 'Consejos del blog',
    message: 'Dame un consejo del blog para elegir un retiro o una práctica.',
  },
  {
    id: 'reservar',
    label: 'Reservar y pagos',
    message: '¿Cómo funciona la reserva, el pago y la cancelación en Retiru?',
  },
  {
    id: 'org',
    label: 'Organizadores',
    message: 'Quiero publicar un retiro o reclamar mi centro. ¿Cómo empiezo?',
  },
]

const menusEn: MenuItem[] = [
  {
    id: 'centros',
    label: 'Centers',
    message: 'I am looking for a yoga, meditation or ayurveda center. How does the directory work?',
  },
  {
    id: 'retiros',
    label: 'Retreats & classes',
    message: 'What retreats or classes are listed now, and how do I book?',
  },
  {
    id: 'blog',
    label: 'Blog tips',
    message: 'Give me a tip from the blog to choose a retreat or a practice.',
  },
  {
    id: 'reservar',
    label: 'Booking & payments',
    message: 'How do booking, payment and cancellation work on Retiru?',
  },
  {
    id: 'org',
    label: 'Organizers',
    message: 'I want to publish a retreat or claim my center. How do I start?',
  },
]

export function topicMenus(locale: ChatLocale): MenuItem[] {
  return locale === 'en' ? menusEn : menusEs
}

export function welcomeMessage(locale: ChatLocale): string {
  return locale === 'en'
    ? "Hi, I'm Roy, Retiru's guide. I can point you to yoga, meditation and ayurveda centers, upcoming retreats and classes, and practical tips from the blog. What are you looking for?"
    : 'Hola, soy Roy, la guía de Retiru. Te oriento por el directorio de centros, los retiros y clases que hay ahora, y los consejos del blog. ¿Qué buscas?'
}

export function placeholder(locale: ChatLocale): string {
  return locale === 'en' ? 'Ask about a center, retreat or practice…' : 'Pregunta por un centro, retiro o práctica…'
}

export function errorFallback(locale: ChatLocale): string {
  return locale === 'en'
    ? 'Sorry, something went wrong. You can write to contacto@retiru.com or try again in a moment.'
    : 'Lo siento, ha ocurrido un error. Puedes escribir a contacto@retiru.com o probar de nuevo en un momento.'
}
