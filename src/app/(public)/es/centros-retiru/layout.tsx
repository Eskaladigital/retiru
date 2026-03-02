import type { Metadata } from 'next';
import { centersES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = centersES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
