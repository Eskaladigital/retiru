import type { Metadata } from 'next';
import { helpEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = helpEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
