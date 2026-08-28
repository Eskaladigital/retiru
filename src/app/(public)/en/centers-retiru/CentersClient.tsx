'use client';

import DirectoryMapView from '@/components/directory/DirectoryMapView';
import type { DirectoryCenter } from '@/components/directory/DirectoryLeafletMap';

export default function CentersClientEN({ centers }: { centers: DirectoryCenter[] }) {
  return <DirectoryMapView locale="en" centers={centers} />;
}
