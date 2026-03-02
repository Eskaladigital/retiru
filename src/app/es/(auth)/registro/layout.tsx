import type { Metadata } from 'next';
import { registerES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = registerES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
