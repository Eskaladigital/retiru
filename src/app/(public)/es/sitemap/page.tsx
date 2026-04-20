import type { Metadata } from 'next';
import HtmlSitemap from '@/components/sitemap/HtmlSitemap';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Mapa del sitio | Retiru',
  description: 'Índice completo de páginas de Retiru (vista HTML interna).',
  robots: { index: false, follow: true },
};

export default function MapaDelSitioEs() {
  return <HtmlSitemap locale="es" />;
}
