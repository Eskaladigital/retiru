// /en/provinces/[slug] — DEPRECATED (2026-04-22).
// The multi-discipline provincial hub was removed due to cannibalization
// with /en/centers/[type]/[province]. All slugs redirect 301 to the
// canonical of the dominant discipline. See §8.1 of docs/SEO-LANDINGS.md.

import { permanentRedirect } from 'next/navigation';
import { getDominantCenterTypeForProvince } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ProvincesRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dom = await getDominantCenterTypeForProvince(slug);
  permanentRedirect(`/en/centers/${dom}/${slug}`);
}
