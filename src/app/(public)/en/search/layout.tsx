import type { Metadata } from 'next';
import { searchEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = searchEN;
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
