import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { PanelEventosClient } from '@/components/panel/PanelEventosClient';
import { ContratoOrganizador } from '@/components/panel/ContratoOrganizador';
import { VerificacionBanner } from '@/components/panel/VerificacionBanner';

export default async function PanelEventosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/panel/eventos');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id, status, contract_accepted_at')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile || !orgProfile.contract_accepted_at) {
    return <ContratoOrganizador />;
  }

  let verificationProgress = { submitted: 0, approved: 0, total: 5 };
  if (orgProfile.status !== 'verified') {
    const { data: steps } = await admin
      .from('organizer_verification_steps')
      .select('status')
      .eq('organizer_id', orgProfile.id);

    if (steps) {
      verificationProgress = {
        submitted: steps.filter((s: { status: string }) => s.status === 'submitted' || s.status === 'in_review' || s.status === 'approved').length,
        approved: steps.filter((s: { status: string }) => s.status === 'approved').length,
        total: steps.length,
      };
    }
  }

  let retreats: any[] = [];
  if (orgProfile) {
    const { data, error: retreatsErr } = await admin
      .from('retreats')
      .select(`
        id, slug, title_es, status, start_date, end_date,
        max_attendees, min_attendees, confirmed_bookings, total_price,
        series_id, is_series_next,
        retreat_images(url, is_cover)
      `)
      .eq('organizer_id', orgProfile.id)
      .order('start_date', { ascending: false });
    if (retreatsErr) {
      console.error('[panel/eventos] Error cargando retiros:', retreatsErr.message);
    }
    // Eventos periódicos: mostrar la próxima fecha + pasadas + cualquier
    // ocurrencia futura con inscripciones activas (para gestionar esas reservas).
    const today = new Date().toISOString().slice(0, 10);
    const allRows = data || [];
    const allIds = allRows.map((r: any) => r.id);
    const withActiveBookings = new Set<string>();
    if (allIds.length > 0) {
      const { data: activeRows } = await admin
        .from('bookings')
        .select('retreat_id')
        .in('retreat_id', allIds)
        .in('status', ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed']);
      for (const row of activeRows || []) {
        if (row.retreat_id) withActiveBookings.add(row.retreat_id);
      }
    }
    retreats = allRows.filter(
      (r: any) =>
        !r.series_id ||
        r.is_series_next ||
        (r.start_date && r.start_date < today) ||
        withActiveBookings.has(r.id),
    );
  }

  const retreatIds = retreats.map((r: any) => r.id);
  const reservedMap: Record<string, number> = {};
  if (retreatIds.length > 0) {
    const { data: reservedRows } = await admin
      .from('bookings')
      .select('retreat_id')
      .in('retreat_id', retreatIds)
      .in('status', ['reserved_no_payment', 'pending_payment', 'pending_confirmation']);
    for (const row of reservedRows || []) {
      reservedMap[row.retreat_id] = (reservedMap[row.retreat_id] || 0) + 1;
    }
  }

  const list = retreats.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title_es: r.title_es,
    status: r.status,
    start_date: r.start_date,
    end_date: r.end_date,
    max_attendees: r.max_attendees,
    min_attendees: r.min_attendees ?? 1,
    confirmed_bookings: r.confirmed_bookings || 0,
    reserved_bookings: reservedMap[r.id] || 0,
    total_price: r.total_price,
    cover: r.retreat_images?.find((i: any) => i.is_cover)?.url || r.retreat_images?.[0]?.url || null,
    series_id: r.series_id ?? null,
  }));

  return (
    <div>
      {orgProfile.status !== 'verified' && (
        <VerificacionBanner
          organizerStatus={orgProfile.status}
          progress={verificationProgress}
        />
      )}
      <PanelEventosClient retreats={list} baseHref="/es/panel/eventos" />
    </div>
  );
}
