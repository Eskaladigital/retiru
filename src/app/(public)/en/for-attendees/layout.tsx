import type { Metadata } from 'next';
import { forAttendeesEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = forAttendeesEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
