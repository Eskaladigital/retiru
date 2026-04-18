const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  /**
   * Las carpetas `centros-[tipo]` / `centers-[type]` hacían que Next interpretara un segmento
   * dinámico que robaba `/es/retiro/...` (confundía "retiro" con tipo de centro). URLs nuevas:
   * `/es/centros/yoga`, `/en/centers/meditation`, etc.
   */
  async redirects() {
    return [
      { source: '/es/centros-yoga', destination: '/es/centros/yoga', permanent: true },
      { source: '/es/centros-yoga/:provincia', destination: '/es/centros/yoga/:provincia', permanent: true },
      { source: '/es/centros-meditacion', destination: '/es/centros/meditacion', permanent: true },
      { source: '/es/centros-meditacion/:provincia', destination: '/es/centros/meditacion/:provincia', permanent: true },
      { source: '/es/centros-ayurveda', destination: '/es/centros/ayurveda', permanent: true },
      { source: '/es/centros-ayurveda/:provincia', destination: '/es/centros/ayurveda/:provincia', permanent: true },
      { source: '/en/centers-yoga', destination: '/en/centers/yoga', permanent: true },
      { source: '/en/centers-yoga/:province', destination: '/en/centers/yoga/:province', permanent: true },
      { source: '/en/centers-meditation', destination: '/en/centers/meditation', permanent: true },
      { source: '/en/centers-meditation/:province', destination: '/en/centers/meditation/:province', permanent: true },
      { source: '/en/centers-ayurveda', destination: '/en/centers/ayurveda', permanent: true },
      { source: '/en/centers-ayurveda/:province', destination: '/en/centers/ayurveda/:province', permanent: true },
    ];
  },
  /**
   * Cabeceras de seguridad básicas. NO se añade Content-Security-Policy aquí porque Retiru
   * carga scripts de Stripe, Google Maps, Google Analytics y TinyMCE; una CSP estricta
   * requiere nonces por request (ver middleware). Se añadirá en un segundo paso.
   */
  async headers() {
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
      { key: 'X-XSS-Protection', value: '0' },
    ];
    return [
      { source: '/:path*', headers: securityHeaders },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
