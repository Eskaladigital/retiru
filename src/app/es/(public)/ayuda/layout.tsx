import type { Metadata } from 'next';
import { helpES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = helpES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
