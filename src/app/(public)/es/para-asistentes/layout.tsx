import type { Metadata } from 'next';
import { forAttendeesES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = forAttendeesES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
