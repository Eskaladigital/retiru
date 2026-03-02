import type { Metadata } from 'next';
import { shopES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = shopES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
