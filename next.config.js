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
};

module.exports = withNextIntl(nextConfig);
