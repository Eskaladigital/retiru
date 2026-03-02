import type { Metadata } from 'next';
import { searchES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = searchES;
export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
