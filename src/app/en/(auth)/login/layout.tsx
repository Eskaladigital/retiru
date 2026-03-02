import type { Metadata } from 'next';
import { loginEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = loginEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
