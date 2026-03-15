// /administrator/retiros/preview/[slug] — Vista previa de retiro (pendiente o cualquier estado)
import { unstable_noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getRetreatBySlugForAdmin } from '@/lib/data';
import { RetiroDetailContent } from '@/components/retreat/RetiroDetailContent';
import { AdminRetiroPreviewActions } from './AdminRetiroPreviewActions';

export const dynamic = 'force-dynamic';

export default async function AdminRetiroPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  unstable_noStore();
  const { slug } = await params;
  const retreat = await getRetreatBySlugForAdmin(slug);
  if (!retreat) notFound();

  const isPending = retreat.status === 'pending_review';

  return (
    <div>
      {isPending && (
        <AdminRetiroPreviewActions retreatId={retreat.id} />
      )}
      <RetiroDetailContent retreat={retreat} isPreview />
    </div>
  );
}
