import type { Metadata } from 'next';
import { destinationsEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = destinationsEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
