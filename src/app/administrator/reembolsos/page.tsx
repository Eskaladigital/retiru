// /administrator/reembolsos — Gestión de reembolsos (admin)
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import { ReembolsosTableClient } from './ReembolsosTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminReembolsosPage() {
  unstable_noStore();
  const supabase = createAdminSupabase();

  const { data: refunds, error } = await supabase
    .from('refunds')
    .select('id, attendee_id, retreat_id, amount, reason, reason_detail, status, requested_at, processed_at')
    .order('requested_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching refunds:', error);
  }

  const attendeeIds = [...new Set((refunds || []).map((r: any) => r.attendee_id).filter(Boolean))];
  const retreatIds = [...new Set((refunds || []).map((r: any) => r.retreat_id).filter(Boolean))];

  let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  let retreatMap: Record<string, { title_es: string | null; slug: string | null }> = {};

  if (attendeeIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', attendeeIds);
    profileMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
      acc[p.id] = { full_name: p.full_name, email: p.email };
      return acc;
    }, {});
  }
  if (retreatIds.length > 0) {
    const { data: retreats } = await supabase.from('retreats').select('id, title_es, slug').in('id', retreatIds);
    retreatMap = (retreats || []).reduce((acc: Record<string, any>, t: any) => {
      acc[t.id] = { title_es: t.title_es, slug: t.slug };
      return acc;
    }, {});
  }

  const list = (refunds || []).map((r: any) => {
    const p = profileMap[r.attendee_id] || {};
    const t = retreatMap[r.retreat_id] || {};
    return {
      id: r.id,
      attendee: p.full_name || p.email || '—',
      attendee_email: (p.email as string | null) || null,
      event: t.title_es || '—',
      retreat_slug: t.slug,
      amount: Number(r.amount || 0),
      reason: r.reason || '—',
      reason_detail: r.reason_detail,
      status: r.status,
      date: r.requested_at,
      processed_at: r.processed_at,
    };
  });

  const pending = list.filter((r: { status: string }) => r.status === 'pending').length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reembolsos</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        {list.length} total · {pending} pendientes de procesar
      </p>
      <ReembolsosTableClient refunds={list} />
    </div>
  );
}
