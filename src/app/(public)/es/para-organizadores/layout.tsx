import type { Metadata } from 'next';
import { forOrganizersES } from '@/lib/seo/page-metadata';
export const metadata: Metadata = forOrganizersES;
export default function L({ children }: { children: React.ReactNode }) { return children; }
