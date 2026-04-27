// ============================================================================
// RETIRU · Page-level metadata definitions for all routes
// ============================================================================

import { generatePageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// ─── ES pages ───────────────────────────────────────────────────────────────

export const homeES: Metadata = generatePageMetadata({
  title: 'Retiru — Retiros y centros de yoga, meditación y ayurveda en España',
  description: 'Descubre y reserva retiros y eventos de yoga, meditación y ayurveda en España. Directorio de centros y tienda. Organizadores: sin suscripción; primer retiro gratis, después 10 % y 20 % sobre el PVP.',
  locale: 'es',
  path: '/es',
  altPath: '/en',
  keywords: ['retiros españa', 'retiro yoga', 'retiro meditación', 'ayurveda españa', 'centros yoga', 'retiros ayurveda'],
});

export const searchES: Metadata = generatePageMetadata({
  title: 'Buscar retiros y centros de yoga, meditación y ayurveda',
  description: 'Busca y filtra retiros y centros de yoga, meditación y ayurveda en toda España. Reserva online con confirmación inmediata.',
  locale: 'es',
  path: '/es/buscar',
  altPath: '/en/search',
  keywords: ['buscar retiros', 'retiros yoga españa', 'retiros meditación', 'ayurveda españa', 'buscar centros yoga'],
});

export const categoriesES: Metadata = generatePageMetadata({
  title: 'Retiros y eventos — Yoga, meditación y ayurveda',
  description: 'Explora retiros y eventos de yoga, meditación y ayurveda en España. Encuentra tu experiencia ideal.',
  locale: 'es',
  path: '/es/retiros-retiru',
  altPath: '/en/retreats-retiru',
  keywords: ['retiros yoga', 'retiros meditación', 'retiros ayurveda', 'eventos yoga españa'],
});

export const destinationsES: Metadata = generatePageMetadata({
  title: 'Destinos para retiros en España — Ibiza, Mallorca, Costa Brava y más',
  description: 'Los mejores destinos para retiros de yoga, meditación y ayurveda en España: Ibiza, Mallorca, Costa Brava, Sierra Nevada, País Vasco, Lanzarote y más.',
  locale: 'es',
  path: '/es/destinos',
  altPath: '/en/destinations',
  keywords: ['destinos retiros', 'retiros ibiza', 'retiros mallorca', 'retiros costa brava', 'retiros españa'],
});

export const centersES: Metadata = generatePageMetadata({
  title: 'Directorio de centros de yoga, meditación y ayurveda en España',
  description: 'Encuentra centros de yoga, meditación y ayurveda en toda España. Horarios, precios, reseñas y contacto directo.',
  locale: 'es',
  path: '/es/centros-retiru',
  altPath: '/en/centers-retiru',
  keywords: ['centros yoga españa', 'centros meditación', 'ayurveda españa', 'directorio yoga'],
});

export const shopES: Metadata = generatePageMetadata({
  title: 'Tienda Retiru — Productos para yoga, meditación y ayurveda',
  description: 'Tienda online: esterillas de yoga, cojines de meditación, aceites y accesorios para tu práctica. Envío gratis desde 50€.',
  locale: 'es',
  path: '/es/tienda',
  altPath: '/en/shop',
  ogType: 'website',
  keywords: ['tienda yoga', 'esterilla yoga', 'accesorios meditación', 'ayurveda productos', 'tienda retiru'],
});

export const forOrganizersES: Metadata = generatePageMetadata({
  title: 'Para centros y organizadores — Retiru',
  description: 'Centros de yoga, meditación y ayurveda: directorio con 6 meses de cortesía y después 20 €/mes. Organizadores de retiros: sin suscripción; primer retiro gratis (0 %), segundo al 10 %, después 20 % del PVP.',
  locale: 'es',
  path: '/es/para-organizadores',
  altPath: '/en/for-organizers',
  keywords: ['publicar retiros', 'directorio centros yoga', 'organizar retiros', 'plataforma retiros gratis', 'ayurveda españa'],
});

export const forAttendeesES: Metadata = generatePageMetadata({
  title: 'Para asistentes — Reserva retiros con garantía | Retiru',
  description: 'Reserva retiros de yoga, meditación y ayurveda con pago seguro, organizadores verificados y soporte dedicado. Tu dinero protegido hasta que el evento se confirma.',
  locale: 'es',
  path: '/es/para-asistentes',
  altPath: '/en/for-attendees',
  keywords: ['reservar retiro seguro', 'retiros verificados', 'pago seguro retiro', 'retiros yoga garantía', 'retiros meditación españa'],
});

export const helpES: Metadata = generatePageMetadata({
  title: 'Centro de ayuda — Preguntas frecuentes sobre Retiru',
  description: 'Respuestas a las preguntas más comunes sobre reservas, pagos, cancelaciones, organización de retiros y uso de la plataforma Retiru.',
  locale: 'es',
  path: '/es/ayuda',
  altPath: '/en/help',
  keywords: ['ayuda retiru', 'preguntas frecuentes', 'cómo reservar retiro', 'cancelar reserva'],
});

export const aboutES: Metadata = generatePageMetadata({
  title: 'Sobre nosotros — Andrea y Roi, fundadores de Retiru',
  description: 'Andrea y Roi cuentan cómo nace Retiru: bienestar, viajes, Nueva Zelanda, formación en ayurveda en India y el sueño de conectar personas con retiros y centros en España.',
  locale: 'es',
  path: '/es/sobre-nosotros',
  altPath: '/en/about',
});

export const contactES: Metadata = generatePageMetadata({
  title: 'Contacto — Escríbenos',
  description: 'Contacta con el equipo de Retiru. Respondemos en menos de 24h. Email: contacto@retiru.com.',
  locale: 'es',
  path: '/es/contacto',
  altPath: '/en/contact',
});

export const blogES: Metadata = generatePageMetadata({
  title: 'Blog — Yoga, meditación, ayurveda y retiros',
  description: 'Artículos sobre yoga, meditación, ayurveda y experiencias de retiros en España.',
  locale: 'es',
  path: '/es/blog',
  altPath: '/en/blog',
  keywords: ['blog yoga', 'blog meditación', 'ayurveda blog', 'artículos retiros'],
});

export const loginES: Metadata = generatePageMetadata({
  title: 'Iniciar sesión',
  description: 'Inicia sesión en tu cuenta de Retiru para gestionar tus reservas, mensajes y perfil.',
  locale: 'es',
  path: '/es/login',
  altPath: '/en/login',
  noIndex: true,
});

export const registerES: Metadata = generatePageMetadata({
  title: 'Crear cuenta',
  description: 'Crea tu cuenta en Retiru para reservar retiros, guardar favoritos y contactar con organizadores.',
  locale: 'es',
  path: '/es/registro',
  altPath: '/en/register',
  noIndex: true,
});

export const forgotPasswordES: Metadata = generatePageMetadata({
  title: 'Recuperar contraseña',
  description: 'Recupera tu contraseña de Retiru. Te enviaremos un enlace a tu email para restablecerla.',
  locale: 'es',
  path: '/es/recuperar-password',
  altPath: '/en/forgot-password',
  noIndex: true,
});

export const newPasswordES: Metadata = generatePageMetadata({
  title: 'Nueva contraseña',
  description: 'Elige una nueva contraseña para tu cuenta de Retiru.',
  locale: 'es',
  path: '/es/nueva-password',
  altPath: '/en/new-password',
  noIndex: true,
});

export const termsES: Metadata = generatePageMetadata({
  title: 'Términos legales',
  description: 'Términos y condiciones legales de uso de la plataforma Retiru.',
  locale: 'es',
  path: '/es/legal/terminos',
  altPath: '/en/legal/terminos',
});

export const privacyES: Metadata = generatePageMetadata({
  title: 'Política de privacidad',
  description: 'Política de privacidad y protección de datos de Retiru.',
  locale: 'es',
  path: '/es/legal/privacidad',
  altPath: '/en/legal/privacidad',
});

export const cookiesES: Metadata = generatePageMetadata({
  title: 'Política de cookies',
  description: 'Política de cookies de Retiru.',
  locale: 'es',
  path: '/es/legal/cookies',
  altPath: '/en/legal/cookies',
});

export const conditionsES: Metadata = generatePageMetadata({
  title: 'Condiciones de uso y precios',
  description: 'Cómo funcionan los precios en Retiru. Cuánto pagas, a quién y cómo se financia la plataforma. Transparencia total.',
  locale: 'es',
  path: '/es/condiciones',
  altPath: '/en/condiciones',
});

export const organizerContractES: Metadata = generatePageMetadata({
  title: 'Contrato del organizador',
  description: 'Texto íntegro del contrato que cada organizador acepta antes de publicar su primer retiro en Retiru: comisiones, KYC, cancelaciones, payouts, RGPD y aceptación electrónica.',
  locale: 'es',
  path: '/es/legal/contrato-organizador',
  altPath: '/en/legal/contrato-organizador',
});

export const centerContractES: Metadata = generatePageMetadata({
  title: 'Contrato del centro (directorio)',
  description: 'Contrato del directorio de centros de Retiru: tarifa mensual de 20 €, periodo de cortesía de 6 meses, veracidad de la ficha, reseñas, RGPD y baja del servicio.',
  locale: 'es',
  path: '/es/legal/contrato-centro',
  altPath: '/en/legal/contrato-centro',
});

// ─── EN pages ───────────────────────────────────────────────────────────────

export const homeEN: Metadata = generatePageMetadata({
  title: 'Retiru — Yoga, meditation & ayurveda retreats and centers in Spain',
  description: 'Discover and book yoga, meditation and ayurveda retreats and events in Spain. Center directory and shop. Organizers: no subscription; first retreat free, then 10% and 20% on the PVP.',
  locale: 'en',
  path: '/en',
  altPath: '/es',
  keywords: ['retreats spain', 'yoga retreat', 'meditation retreat', 'ayurveda spain', 'yoga centers spain'],
});

export const searchEN: Metadata = generatePageMetadata({
  title: 'Search yoga, meditation and ayurveda retreats and centers',
  description: 'Search and filter yoga, meditation and ayurveda retreats and centers across Spain. Book online with instant confirmation.',
  locale: 'en',
  path: '/en/search',
  altPath: '/es/buscar',
  keywords: ['search retreats', 'yoga retreats spain', 'meditation retreats', 'ayurveda spain', 'find yoga centers'],
});

export const categoriesEN: Metadata = generatePageMetadata({
  title: 'Retreats & events — Yoga, meditation & ayurveda',
  description: 'Explore yoga, meditation and ayurveda retreats and events in Spain. Find your ideal experience.',
  locale: 'en',
  path: '/en/retreats-retiru',
  altPath: '/es/retiros-retiru',
  keywords: ['yoga retreats', 'meditation retreats', 'ayurveda retreats', 'yoga events spain'],
});

export const destinationsEN: Metadata = generatePageMetadata({
  title: 'Retreat destinations in Spain — Ibiza, Mallorca, Costa Brava & more',
  description: 'The best destinations for yoga, meditation and ayurveda retreats in Spain: Ibiza, Mallorca, Costa Brava, Sierra Nevada, Basque Country, Lanzarote and more.',
  locale: 'en',
  path: '/en/destinations',
  altPath: '/es/destinos',
  keywords: ['retreat destinations', 'retreats ibiza', 'retreats mallorca', 'retreats costa brava', 'retreats spain'],
});

export const centersEN: Metadata = generatePageMetadata({
  title: 'Yoga, meditation & ayurveda centers directory in Spain',
  description: 'Find yoga, meditation and ayurveda centers across Spain. Schedules, prices, reviews and direct contact.',
  locale: 'en',
  path: '/en/centers-retiru',
  altPath: '/es/centros-retiru',
  keywords: ['yoga centers spain', 'meditation centers', 'ayurveda spain', 'yoga directory'],
});

export const shopEN: Metadata = generatePageMetadata({
  title: 'Retiru shop — Yoga, meditation & ayurveda products',
  description: 'Online store: yoga mats, meditation cushions, oils and accessories for your practice. Free shipping from 50€.',
  locale: 'en',
  path: '/en/shop',
  altPath: '/es/tienda',
  keywords: ['yoga shop', 'yoga mat', 'meditation accessories', 'ayurveda products', 'retiru shop'],
});

export const forOrganizersEN: Metadata = generatePageMetadata({
  title: 'For centers & organizers — Retiru',
  description: 'Yoga, meditation and ayurveda centers: directory with 6-month courtesy, then €20/month. Retreat organizers: no subscription; first retreat free (0%), second at 10%, then 20% of the PVP.',
  locale: 'en',
  path: '/en/for-organizers',
  altPath: '/es/para-organizadores',
});

export const forAttendeesEN: Metadata = generatePageMetadata({
  title: 'For attendees — Book retreats with full confidence | Retiru',
  description: 'Book yoga, meditation and ayurveda retreats with secure payment, verified organizers and dedicated support. Your money protected until the event is confirmed.',
  locale: 'en',
  path: '/en/for-attendees',
  altPath: '/es/para-asistentes',
  keywords: ['book retreat safely', 'verified retreats', 'secure retreat payment', 'yoga retreats guarantee', 'meditation retreats spain'],
});

export const helpEN: Metadata = generatePageMetadata({
  title: 'Help Center — Frequently asked questions about Retiru',
  description: 'Answers to the most common questions about bookings, payments, cancellations, retreat organization and using the Retiru platform.',
  locale: 'en',
  path: '/en/help',
  altPath: '/es/ayuda',
});

export const aboutEN: Metadata = generatePageMetadata({
  title: 'About us — Andrea & Roi, founders of Retiru',
  description: 'Andrea and Roi share how Retiru was born: wellbeing, travel, New Zealand, ayurveda training in India, and connecting people with retreats and centres in Spain.',
  locale: 'en',
  path: '/en/about',
  altPath: '/es/sobre-nosotros',
});

export const contactEN: Metadata = generatePageMetadata({
  title: 'Contact us',
  description: 'Contact the Retiru team. We respond within 24h. Email: contacto@retiru.com.',
  locale: 'en',
  path: '/en/contact',
  altPath: '/es/contacto',
});

export const blogEN: Metadata = generatePageMetadata({
  title: 'Blog — Yoga, meditation, ayurveda and retreats',
  description: 'Articles about yoga, meditation, ayurveda and retreat experiences in Spain.',
  locale: 'en',
  path: '/en/blog',
  altPath: '/es/blog',
  keywords: ['yoga blog', 'meditation blog', 'ayurveda blog', 'retreat articles'],
});

export const loginEN: Metadata = generatePageMetadata({
  title: 'Sign in',
  description: 'Sign in to your Retiru account to manage bookings, messages and profile.',
  locale: 'en',
  path: '/en/login',
  altPath: '/es/login',
  noIndex: true,
});

export const registerEN: Metadata = generatePageMetadata({
  title: 'Create account',
  description: 'Create your Retiru account to book retreats, save favorites and contact organizers.',
  locale: 'en',
  path: '/en/register',
  altPath: '/es/registro',
  noIndex: true,
});

export const forgotPasswordEN: Metadata = generatePageMetadata({
  title: 'Forgot password',
  description: 'Recover your Retiru password. We will send you a reset link by email.',
  locale: 'en',
  path: '/en/forgot-password',
  altPath: '/es/recuperar-password',
  noIndex: true,
});

export const newPasswordEN: Metadata = generatePageMetadata({
  title: 'New password',
  description: 'Choose a new password for your Retiru account.',
  locale: 'en',
  path: '/en/new-password',
  altPath: '/es/nueva-password',
  noIndex: true,
});

export const termsEN: Metadata = generatePageMetadata({
  title: 'Legal terms',
  description: 'Legal terms and conditions for using the Retiru platform.',
  locale: 'en',
  path: '/en/legal/terminos',
  altPath: '/es/legal/terminos',
});

export const privacyEN: Metadata = generatePageMetadata({
  title: 'Privacy policy',
  description: 'Privacy policy and data protection of Retiru.',
  locale: 'en',
  path: '/en/legal/privacidad',
  altPath: '/es/legal/privacidad',
});

export const cookiesEN: Metadata = generatePageMetadata({
  title: 'Cookies policy',
  description: 'Cookies policy of Retiru.',
  locale: 'en',
  path: '/en/legal/cookies',
  altPath: '/es/legal/cookies',
});

export const conditionsEN: Metadata = generatePageMetadata({
  title: 'Conditions and pricing',
  description: 'How pricing works on Retiru. How much you pay, to whom, and how the platform is funded. Total transparency.',
  locale: 'en',
  path: '/en/condiciones',
  altPath: '/es/condiciones',
});

export const organizerContractEN: Metadata = generatePageMetadata({
  title: 'Organizer agreement',
  description: 'Full text of the agreement every organizer signs electronically before publishing their first retreat on Retiru: commissions, KYC, cancellations, payouts, GDPR and electronic acceptance.',
  locale: 'en',
  path: '/en/legal/contrato-organizador',
  altPath: '/es/legal/contrato-organizador',
});

export const centerContractEN: Metadata = generatePageMetadata({
  title: 'Center directory agreement',
  description: 'Center directory agreement on Retiru: €20/month subscription, 6-month courtesy period, listing accuracy, reviews, GDPR and exit from the service.',
  locale: 'en',
  path: '/en/legal/contrato-centro',
  altPath: '/es/legal/contrato-centro',
});

// ─── Dashboard / Panel / Admin (noIndex) ────────────────────────────────────

export const dashboardMeta: Metadata = generatePageMetadata({
  title: 'Mi cuenta',
  description: 'Panel de usuario de Retiru.',
  locale: 'es',
  path: '/es/mis-reservas',
  noIndex: true,
});

export const organizerPanelMeta: Metadata = generatePageMetadata({
  title: 'Panel de organizador',
  description: 'Panel de gestión para organizadores de retiros.',
  locale: 'es',
  path: '/es/panel',
  noIndex: true,
});

export const adminMeta: Metadata = generatePageMetadata({
  title: 'Administración',
  description: 'Panel de administración de Retiru.',
  locale: 'es',
  path: '/administrator',
  noIndex: true,
});
