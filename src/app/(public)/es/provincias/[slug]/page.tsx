// /es/provincias/[slug] — DESCARTADA (2026-04-22).
// Este hub multi-disciplina canibalizaba con /es/centros/[tipo]/[provincia].
// Todos los slugs se redirigen 301 al canonical de la disciplina dominante.
// Ver §8.1 de docs/SEO-LANDINGS.md.

import { permanentRedirect } from 'next/navigation';
import { getDominantCenterTypeForProvince } from '@/lib/data';
import { CENTER_TYPE_URL_ES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProvinciasRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dom = await getDominantCenterTypeForProvince(slug);
  const urlType = CENTER_TYPE_URL_ES[dom] || dom;
  permanentRedirect(`/es/centros/${urlType}/${slug}`);
}
