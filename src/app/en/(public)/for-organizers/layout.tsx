import type { Metadata } from 'next';
import { forOrganizersEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = forOrganizersEN;
export default function L({ children }: { children: React.ReactNode }) { return children; }
