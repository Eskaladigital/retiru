import type { Metadata } from 'next';
import { contactES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = contactES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
