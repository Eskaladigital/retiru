import type { Metadata } from 'next';
import { destinationsES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = destinationsES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
