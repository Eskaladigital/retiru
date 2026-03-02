import type { Metadata } from 'next';
import { aboutEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = aboutEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
