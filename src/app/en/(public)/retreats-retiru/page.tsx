// /en/retreats-retiru — Events & retreats: search engine
import type { Metadata } from 'next';
import { categoriesEN } from '@/lib/seo/page-metadata';
export const metadata: Metadata = categoriesEN;

import EventsClientEN from './EventsClient';
export default function CategoriesPageEN() {
  return <EventsClientEN />;
}
