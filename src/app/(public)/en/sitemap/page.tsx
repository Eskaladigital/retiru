import type { Metadata } from 'next';
import HtmlSitemap from '@/components/sitemap/HtmlSitemap';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sitemap | Retiru',
  description: 'Full index of Retiru pages (internal HTML view).',
  robots: { index: false, follow: true },
};

export default function SitemapEn() {
  return <HtmlSitemap locale="en" />;
}
