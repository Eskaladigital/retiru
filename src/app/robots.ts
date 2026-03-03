// /robots.txt — siempre URLs de producción
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const SITE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/es/mis-reservas',
          '/es/mensajes',
          '/es/perfil',
          '/es/facturas',
          '/es/panel',
          '/es/panel/',
          '/es/admin',
          '/es/admin/',
          '/administrator',
          '/administrator/',
          '/es/login',
          '/es/registro',
          '/en/login',
          '/en/register',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
