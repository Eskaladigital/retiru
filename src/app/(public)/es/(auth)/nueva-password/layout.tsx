import type { Metadata } from 'next';
import { newPasswordES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = newPasswordES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
