// /robots.txt
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retiru.com';

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
