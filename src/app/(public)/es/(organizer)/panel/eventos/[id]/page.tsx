import { redirect, notFound } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { EditarEventoForm } from '@/app/(public)/es/(dashboard)/mis-eventos/[id]/EditarEventoForm';

type Props = { params: Promise<{ id: string }> };

export default async function PanelEditarEventoPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/es/login?redirect=/es/panel/eventos/${id}`);

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) notFound();

  const { data: retreat } = await admin
    .from('retreats')
    .select(`
      id, title_es, title_en, slug, summary_es, summary_en,
      description_es, description_en, includes_es, includes_en,
      start_date, end_date, duration_hours, series_id, total_price, max_attendees, min_attendees,
      destination_id, address, confirmation_type, languages, status,
      rejection_reason, reviewed_at, updated_at, schedule,
      retreat_categories(category_id),
      retreat_images(url, is_cover, sort_order)
    `)
    .eq('id', id)
    .eq('organizer_id', orgProfile.id)
    .single();

  if (!retreat) notFound();

  // Evento periódico: serie y fechas programadas
  let seriesInfo = null;
  if (retreat.series_id) {
    const { data: series } = await admin
      .from('retreat_series')
      .select('id, interval_days, is_active, series_end_date')
      .eq('id', retreat.series_id)
      .maybeSingle();

    if (series) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: occurrences } = await admin
        .from('retreats')
        .select('id, start_date, status')
        .eq('series_id', series.id)
        .eq('status', 'published')
        .gte('start_date', today)
        .order('start_date', { ascending: true });

      const occIds = (occurrences || []).map((o: any) => o.id);
      const bookingCounts = new Map<string, number>();
      if (occIds.length > 0) {
        const { data: bookings } = await admin
          .from('bookings')
          .select('retreat_id')
          .in('retreat_id', occIds)
          .in('status', ['reserved_no_payment', 'pending_payment', 'pending_confirmation', 'confirmed']);
        for (const b of bookings || []) {
          bookingCounts.set(b.retreat_id, (bookingCounts.get(b.retreat_id) || 0) + 1);
        }
      }

      seriesInfo = {
        id: series.id as string,
        interval_days: series.interval_days as number,
        is_active: Boolean(series.is_active),
        series_end_date: (series.series_end_date as string | null) ?? null,
        occurrences: (occurrences || []).map((o: any) => ({
          id: o.id as string,
          start_date: o.start_date as string,
          status: o.status as string,
          active_bookings: bookingCounts.get(o.id) || 0,
        })),
      };
    }
  }

  const { data: categories } = await admin
    .from('categories')
    .select('id, name_es, slug')
    .eq('is_active', true)
    .order('name_es');

  const { data: destinations } = await admin
    .from('destinations')
    .select('id, name_es, slug')
    .eq('is_active', true)
    .order('name_es');

  return (
    <div className="max-w-3xl">
      <a href="/es/panel/eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Mis eventos
      </a>
      <h1 className="font-serif text-3xl text-foreground mb-2">Editar evento</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        {retreat.status === 'published' && 'Los cambios se aplicarán inmediatamente.'}
        {retreat.status === 'draft' && 'Evento en borrador. Envíalo a revisión cuando esté listo.'}
        {retreat.status === 'pending_review' && 'Evento pendiente de revisión por el equipo de Retiru.'}
        {retreat.status === 'rejected' && 'Evento rechazado. Corrige los problemas y vuelve a enviarlo.'}
      </p>

      <EditarEventoForm
        eventsHubPath="/es/panel/eventos"
        retreat={retreat}
        series={seriesInfo}
        categories={(categories || []).map((c: any) => ({ id: c.id, name: c.name_es, slug: c.slug }))}
        destinations={(destinations || []).map((d: any) => ({ id: d.id, name: d.name_es, slug: d.slug }))}
      />
    </div>
  );
}
