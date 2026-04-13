import { redirect, notFound } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { EditarEventoForm } from '@/app/(public)/es/(dashboard)/mis-eventos/[id]/EditarEventoForm';

type Props = { params: Promise<{ id: string }> };

export default async function PanelEditarEventoPageEn({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/en/login?redirect=/en/panel/eventos/${id}`);

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
      start_date, end_date, total_price, max_attendees, min_attendees,
      destination_id, address, confirmation_type, languages, status,
      rejection_reason, reviewed_at, updated_at, schedule,
      retreat_categories(category_id),
      retreat_images(url, is_cover, sort_order)
    `)
    .eq('id', id)
    .eq('organizer_id', orgProfile.id)
    .single();

  if (!retreat) notFound();

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
      <a href="/en/panel/eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        My retreats
      </a>
      <h1 className="font-serif text-3xl text-foreground mb-2">Edit event</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        {retreat.status === 'published' && 'Changes apply immediately.'}
        {retreat.status === 'draft' && 'Draft event. Submit for review when ready.'}
        {retreat.status === 'pending_review' && 'Event pending review by the Retiru team.'}
        {retreat.status === 'rejected' && 'Event rejected. Fix the issues and resubmit.'}
      </p>

      <EditarEventoForm
        eventsHubPath="/en/panel/eventos"
        retreat={retreat}
        categories={(categories || []).map((c: any) => ({ id: c.id, name: c.name_es, slug: c.slug }))}
        destinations={(destinations || []).map((d: any) => ({ id: d.id, name: d.name_es, slug: d.slug }))}
      />
    </div>
  );
}
