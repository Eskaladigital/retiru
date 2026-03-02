import type { Metadata } from 'next';
import { aboutES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = aboutES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
