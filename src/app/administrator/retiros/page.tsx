// /administrator/retiros — Gestión de retiros (admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { RetirosTableClient } from './RetirosTableClient';

export const dynamic = 'force-dynamic';

type RetirosFilterParam = 'all' | 'pending_review' | 'draft' | 'published' | 'in_progress' | 'expired' | 'finished' | 'rejected' | 'archived' | 'cancelled';

function filterFromSearchParams(raw: string | string[] | undefined): RetirosFilterParam | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const allowed: RetirosFilterParam[] = [
    'all',
    'pending_review',
    'draft',
    'published',
    'in_progress',
    'expired',
    'finished',
    'rejected',
    'archived',
    'cancelled',
  ];
  return v && allowed.includes(v as RetirosFilterParam) ? (v as RetirosFilterParam) : undefined;
}

export default async function AdminRetirosPage({
  searchParams,
}: {
  searchParams?: { filter?: string | string[] };
}) {
  const supabase = createAdminSupabase();
  const initialFilter = filterFromSearchParams(searchParams?.filter);

  const { data: retreats, error } = await supabase
    .from('retreats')
    .select(`
      id, title_es, slug, status, total_price, max_attendees, confirmed_bookings,
      start_date, end_date, created_at, published_at, reviewed_at, rejection_reason,
      organizer_id,
      retreat_images ( url, is_cover, sort_order )
    `)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('Error fetching retreats:', error);
  }

  const list = (retreats || []) as any[];

  // Fetch organizer info separately to avoid join failures
  const organizerIds = [...new Set(list.map((r) => r.organizer_id).filter(Boolean))];
  let organizerMap: Record<string, { business_name: string; email: string | null; organizer_status: string }> = {};

  if (organizerIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizer_profiles')
      .select('id, business_name, status, user_id, profiles!user_id(email)')
      .in('id', organizerIds);

    if (orgs) {
      for (const o of orgs as any[]) {
        organizerMap[o.id] = {
          business_name: o.business_name || '',
          email: o.profiles?.email || null,
          organizer_status: o.status || 'pending',
        };
      }
    }
  }

  function coverUrlFromRetreat(r: {
    retreat_images?: { url: string; is_cover: boolean; sort_order?: number }[] | null;
  }): string | null {
    const imgs = r.retreat_images;
    if (!imgs?.length) return null;
    const cover = imgs.find((i) => i.is_cover);
    if (cover?.url) return cover.url;
    const sorted = [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return sorted[0]?.url ?? null;
  }

  const enriched = list.map((r) => {
    const { retreat_images: _ri, ...rest } = r;
    return {
      ...rest,
      cover_image_url: coverUrlFromRetreat(r),
      organizer_name: organizerMap[r.organizer_id]?.business_name || null,
      organizer_email: organizerMap[r.organizer_id]?.email || null,
      organizer_status: organizerMap[r.organizer_id]?.organizer_status || 'pending',
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const pending = list.filter((r) => r.status === 'pending_review').length;
  const drafts = list.filter((r) => r.status === 'draft').length;
  const publishedActive = list.filter(
    (r) => r.status === 'published' && r.start_date > today,
  ).length;
  const inProgress = list.filter(
    (r) => r.status === 'published' && r.start_date <= today && r.end_date >= today && r.confirmed_bookings > 0,
  ).length;
  const expired = list.filter(
    (r) => r.status === 'published' && r.start_date <= today && r.confirmed_bookings === 0,
  ).length;
  const finished = list.filter(
    (r) => r.status === 'published' && r.end_date < today && r.confirmed_bookings > 0,
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Retiros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} total ·{' '}
            <span className={pending > 0 ? 'text-amber-600 font-semibold' : ''}>{pending} pendientes</span> ·{' '}
            {publishedActive} publicados · {inProgress > 0 ? `${inProgress} en curso · ` : ''}{expired > 0 ? `${expired} expirados · ` : ''}{finished > 0 ? `${finished} finalizados · ` : ''}{drafts} borradores
          </p>
        </div>
      </div>

      <RetirosTableClient retreats={enriched} initialFilter={initialFilter} />
    </div>
  );
}
