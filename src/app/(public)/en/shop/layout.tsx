import type { Metadata } from 'next';
import { shopEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = shopEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
