import type { Metadata } from 'next';
import { loginES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = loginES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
