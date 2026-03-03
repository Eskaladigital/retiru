// /administrator/eventos — Gestión de retiros (admin)
import { createAdminSupabase } from '@/lib/supabase/server';
import { EventosTableClient } from './EventosTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminEventosPage() {
  const supabase = createAdminSupabase();

  const { data: retreats } = await supabase
    .from('retreats')
    .select(`
      id, title_es, slug, status, total_price, max_attendees, confirmed_bookings,
      start_date, end_date, created_at, published_at, reviewed_at, rejection_reason,
      organizer_profiles!organizer_id(id, business_name, slug, user_id,
        profiles!user_id(id, full_name, email)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(2000);

  const list = (retreats || []) as any[];
  const pending = list.filter((r) => r.status === 'pending_review').length;
  const published = list.filter((r) => r.status === 'published').length;
  const drafts = list.filter((r) => r.status === 'draft').length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Retiros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} total ·{' '}
            <span className={pending > 0 ? 'text-amber-600 font-semibold' : ''}>{pending} pendientes</span> ·{' '}
            {published} publicados · {drafts} borradores
          </p>
        </div>
      </div>

      <EventosTableClient retreats={list} />
    </div>
  );
}
