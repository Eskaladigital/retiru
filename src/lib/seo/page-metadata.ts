// ============================================================================
// RETIRU · Page-level metadata definitions for all routes
// ============================================================================

import { generatePageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// ─── ES pages ───────────────────────────────────────────────────────────────

export const homeES: Metadata = generatePageMetadata({
  title: 'Retiru — Retiros y centros de yoga, meditación y ayurveda en España',
  description: 'Descubre y reserva retiros y eventos de yoga, meditación y ayurveda en España. Directorio de centros y tienda. Organizadores: sin suscripción; 20 % sobre el PVP, 80 % neto.',
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
  description: 'Centros de yoga, meditación y ayurveda: directorio sin cuota de alta. Organizadores: panel completo sin suscripción; 20 % comisión sobre el PVP (80 % neto).',
  locale: 'es',
  path: '/es/para-organizadores',
  altPath: '/en/for-organizers',
  keywords: ['publicar retiros', 'directorio centros yoga', 'organizar retiros', 'plataforma retiros gratis', 'ayurveda españa'],
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

// ─── EN pages ───────────────────────────────────────────────────────────────

export const homeEN: Metadata = generatePageMetadata({
  title: 'Retiru — Yoga, meditation & ayurveda retreats and centers in Spain',
  description: 'Discover and book yoga, meditation and ayurveda retreats and events in Spain. Center directory and shop. Organizers: no subscription; 20% on the PVP, 80% net.',
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
});

export const destinationsEN: Metadata = generatePageMetadata({
  title: 'Retreat destinations in Spain — Ibiza, Mallorca, Costa Brava & more',
  description: 'The best destinations for yoga, meditation and ayurveda retreats in Spain: Ibiza, Mallorca, Costa Brava, Sierra Nevada, Basque Country, Lanzarote and more.',
  locale: 'en',
  path: '/en/destinations',
  altPath: '/es/destinos',
});

export const centersEN: Metadata = generatePageMetadata({
  title: 'Yoga, meditation & ayurveda centers directory in Spain',
  description: 'Find yoga, meditation and ayurveda centers across Spain. Schedules, prices, reviews and direct contact.',
  locale: 'en',
  path: '/en/centers-retiru',
  altPath: '/es/centros-retiru',
});

export const shopEN: Metadata = generatePageMetadata({
  title: 'Retiru shop — Yoga, meditation & ayurveda products',
  description: 'Online store: yoga mats, meditation cushions, oils and accessories for your practice. Free shipping from 50€.',
  locale: 'en',
  path: '/en/shop',
  altPath: '/es/tienda',
});

export const forOrganizersEN: Metadata = generatePageMetadata({
  title: 'For centers & organizers — Retiru',
  description: 'Yoga, meditation and ayurveda centers: list in our directory with no listing fee. Organizers: full panel with no subscription; 20% commission on the PVP (80% net).',
  locale: 'en',
  path: '/en/for-organizers',
  altPath: '/es/para-organizadores',
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
