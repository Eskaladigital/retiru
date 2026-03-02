import type { Metadata } from 'next';
import { blogES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = blogES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
