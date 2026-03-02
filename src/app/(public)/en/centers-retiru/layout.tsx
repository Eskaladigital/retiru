import type { Metadata } from 'next';
import { centersEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = centersEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
