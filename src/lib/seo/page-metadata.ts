// ============================================================================
// RETIRU · Page-level metadata definitions for all routes
// ============================================================================

import { generatePageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// ─── ES pages ───────────────────────────────────────────────────────────────

export const homeES: Metadata = generatePageMetadata({
  title: 'Retiru — Retiros, Centros de Bienestar y Tienda Wellness en España',
  description: 'Descubre y reserva retiros de yoga, meditación, naturaleza y wellness en España. Directorio de centros y tienda de productos de bienestar. Sin comisiones para organizadores.',
  locale: 'es',
  path: '/es',
  altPath: '/en',
  keywords: ['retiros españa', 'retiro yoga', 'retiro meditación', 'centros yoga', 'wellness españa', 'escapadas bienestar', 'productos wellness'],
});

export const searchES: Metadata = generatePageMetadata({
  title: 'Buscar retiros y centros de bienestar en España',
  description: 'Busca y filtra retiros de yoga, meditación, detox, naturaleza y centros de bienestar en toda España. Reserva online con confirmación inmediata.',
  locale: 'es',
  path: '/es/buscar',
  altPath: '/en/search',
  keywords: ['buscar retiros', 'retiros yoga españa', 'retiros meditación', 'centros bienestar', 'buscar centros yoga'],
});

export const categoriesES: Metadata = generatePageMetadata({
  title: 'Retiros y escapadas — Yoga, Meditación, Naturaleza, Detox y más',
  description: 'Explora retiros y escapadas por tipo: yoga, meditación, naturaleza, gastronomía, detox, aventura, wellness y creatividad. Encuentra tu experiencia ideal en España.',
  locale: 'es',
  path: '/es/retiros-retiru',
  altPath: '/en/retreats-retiru',
  keywords: ['retiros escapadas', 'tipos retiros', 'retiro yoga', 'retiro meditación', 'retiro naturaleza', 'retiro detox'],
});

export const destinationsES: Metadata = generatePageMetadata({
  title: 'Destinos para retiros en España — Ibiza, Mallorca, Costa Brava y más',
  description: 'Los mejores destinos para retiros y escapadas de bienestar en España: Ibiza, Mallorca, Costa Brava, Sierra Nevada, País Vasco, Lanzarote y más.',
  locale: 'es',
  path: '/es/destinos',
  altPath: '/en/destinations',
  keywords: ['destinos retiros', 'retiros ibiza', 'retiros mallorca', 'retiros costa brava', 'retiros españa'],
});

export const centersES: Metadata = generatePageMetadata({
  title: 'Directorio de centros de yoga, meditación, wellness y spa en España',
  description: 'Encuentra los mejores centros de yoga, meditación, wellness y spa en toda España. Horarios, precios, reseñas y contacto directo.',
  locale: 'es',
  path: '/es/centros-retiru',
  altPath: '/en/centers-retiru',
  keywords: ['centros yoga españa', 'centros meditación', 'centros wellness', 'spa españa', 'directorio yoga'],
});

export const shopES: Metadata = generatePageMetadata({
  title: 'Tienda wellness — Esterillas, accesorios y productos de bienestar',
  description: 'Tienda online de productos de bienestar: esterillas de yoga, cojines de meditación, extractores de zumos, ropa orgánica y más. Envío gratis desde 50€.',
  locale: 'es',
  path: '/es/tienda',
  altPath: '/en/shop',
  ogType: 'website',
  keywords: ['tienda yoga', 'esterilla yoga', 'accesorios meditación', 'productos wellness', 'tienda bienestar'],
});

export const forOrganizersES: Metadata = generatePageMetadata({
  title: 'Para centros y organizadores — Únete a Retiru gratis',
  description: 'Si tienes un centro de bienestar, aparece en nuestro directorio gratis. Si organizas retiros, publica y gestiona tus retiros con un panel completo sin comisiones.',
  locale: 'es',
  path: '/es/para-organizadores',
  altPath: '/en/for-organizers',
  keywords: ['publicar retiros', 'directorio centros yoga', 'organizar retiros', 'plataforma retiros gratis', 'centros wellness españa'],
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
  title: 'Sobre Retiru — Nuestra misión y equipo',
  description: 'Retiru es la plataforma líder para descubrir retiros, centros y productos de bienestar en España. Conoce nuestra misión, modelo y equipo.',
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
  title: 'Blog — Artículos sobre yoga, meditación, bienestar y retiros',
  description: 'Lee nuestros artículos sobre yoga, meditación, bienestar, nutrición y experiencias de retiros en España.',
  locale: 'es',
  path: '/es/blog',
  altPath: '/en/blog',
  keywords: ['blog yoga', 'blog meditación', 'blog bienestar', 'artículos retiros'],
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
  title: 'Retiru — Retreats, Wellness Centers & Shop in Spain',
  description: 'Discover and book yoga, meditation, nature and wellness retreats in Spain. Wellness center directory and shop. Free for organizers.',
  locale: 'en',
  path: '/en',
  altPath: '/es',
  keywords: ['retreats spain', 'yoga retreat', 'meditation retreat', 'wellness centers', 'wellness spain', 'wellness getaway'],
});

export const searchEN: Metadata = generatePageMetadata({
  title: 'Search retreats and wellness centers in Spain',
  description: 'Search and filter yoga, meditation, detox, nature retreats and wellness centers across Spain. Book online with instant confirmation.',
  locale: 'en',
  path: '/en/search',
  altPath: '/es/buscar',
  keywords: ['search retreats', 'yoga retreats spain', 'meditation retreats', 'wellness centers', 'find yoga centers'],
});

export const categoriesEN: Metadata = generatePageMetadata({
  title: 'Retreats & getaways — Yoga, Meditation, Nature, Detox & more',
  description: 'Explore retreats and getaways by type: yoga, meditation, nature, gastronomy, detox, adventure, wellness and creativity. Find your ideal experience in Spain.',
  locale: 'en',
  path: '/en/retreats-retiru',
  altPath: '/es/retiros-retiru',
});

export const destinationsEN: Metadata = generatePageMetadata({
  title: 'Retreat destinations in Spain — Ibiza, Mallorca, Costa Brava & more',
  description: 'The best destinations for retreats and wellness getaways in Spain: Ibiza, Mallorca, Costa Brava, Sierra Nevada, Basque Country, Lanzarote and more.',
  locale: 'en',
  path: '/en/destinations',
  altPath: '/es/destinos',
});

export const centersEN: Metadata = generatePageMetadata({
  title: 'Yoga, meditation, wellness & spa centers directory in Spain',
  description: 'Find the best yoga, meditation, wellness and spa centers across Spain. Schedules, prices, reviews and direct contact.',
  locale: 'en',
  path: '/en/centers-retiru',
  altPath: '/es/centros-retiru',
});

export const shopEN: Metadata = generatePageMetadata({
  title: 'Wellness shop — Mats, accessories & wellness products',
  description: 'Online wellness product store: yoga mats, meditation cushions, juicers, organic apparel and more. Free shipping from 50€.',
  locale: 'en',
  path: '/en/shop',
  altPath: '/es/tienda',
});

export const forOrganizersEN: Metadata = generatePageMetadata({
  title: 'For centers & organizers — Join Retiru for free',
  description: 'If you have a wellness center, appear in our directory for free. If you organize retreats, publish and manage your retreats with a complete panel. No commissions.',
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
  title: 'About Retiru — Our mission and team',
  description: 'Retiru is the leading platform for discovering retreats, centers and wellness products in Spain. Learn about our mission, model and team.',
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
  title: 'Blog — Articles about yoga, meditation, wellness and retreats',
  description: 'Read our articles about yoga, meditation, wellness, nutrition and retreat experiences in Spain.',
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
