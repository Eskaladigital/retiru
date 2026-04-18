import type { Metadata } from 'next';
import { newPasswordEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = newPasswordEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
