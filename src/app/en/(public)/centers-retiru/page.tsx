// /en/centers-retiru — Centers directory with search engine
import type { Metadata } from 'next';
import { centersEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = centersEN;

import CentersClientEN from './CentersClient';
export default function CentersPageEN() {
  return <CentersClientEN />;
}
