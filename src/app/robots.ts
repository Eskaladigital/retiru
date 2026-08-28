// /robots.txt — siempre URLs de producción
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();

/** Crawlers de asistentes de IA (GEO): molde Furgocasa / ACTTAX. */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'meta-externalagent',
];

const disallow = [
  '/es/mis-reservas',
  '/es/mis-centros',
  '/es/mis-eventos',
  '/es/mis-eventos/',
  '/es/mensajes',
  '/es/perfil',
  '/es/facturas',
  '/es/panel',
  '/es/panel/',
  '/en/panel',
  '/en/panel/',
  '/es/admin',
  '/es/admin/',
  '/es/reclamar/',
  '/en/claim/',
  '/administrator',
  '/administrator/',
  '/es/login',
  '/es/registro',
  '/en/login',
  '/en/register',
  '/api/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
