'use client';

import DirectoryMapView from '@/components/directory/DirectoryMapView';
import type { DirectoryCenter } from '@/components/directory/DirectoryLeafletMap';

export default function CentrosClient({ centers }: { centers: DirectoryCenter[] }) {
  return <DirectoryMapView locale="es" centers={centers} />;
}
