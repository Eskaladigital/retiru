// /es/centros-retiru — Mapa del directorio
import { Suspense } from 'react';
import { getActiveCenters } from '@/lib/data';
import DirectoryMapView from '@/components/directory/DirectoryMapView';

export default async function CentrosPage() {
  const { centers } = await getActiveCenters({ all: true });
  const slim = centers.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type,
    city: c.city,
    province: c.province,
    country: c.country,
    cover_url: c.cover_url || (Array.isArray(c.images) ? c.images[0] : null),
    latitude: c.latitude,
    longitude: c.longitude,
    avg_rating: c.avg_rating,
    review_count: c.review_count,
    description_es: c.description_es?.slice(0, 180) ?? null,
    description_en: c.description_en?.slice(0, 180) ?? null,
  }));

  return (
    <Suspense fallback={<div className="h-full bg-sand-50" />}>
      <DirectoryMapView locale="es" centers={slim} />
    </Suspense>
  );
}
