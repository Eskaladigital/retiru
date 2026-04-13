// /administrator/retiros/[id]/editar — Editar retiro (admin)
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { EditarEventoForm } from '@/app/(public)/es/(dashboard)/mis-eventos/[id]/EditarEventoForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditarRetiroPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/administrator/retiros');

  const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!adminRole) redirect('/es');

  const admin = createAdminSupabase();

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
      <Link
        href="/administrator/retiros"
        className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6"
      >
        ← Volver a retiros
      </Link>
      <h1 className="font-serif text-3xl text-foreground mb-2">Editar retiro (admin)</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        {retreat.title_es} · Estado: {retreat.status}
      </p>

      <EditarEventoForm
        retreat={retreat}
        categories={(categories || []).map((c: any) => ({ id: c.id, name: c.name_es, slug: c.slug }))}
        destinations={(destinations || []).map((d: any) => ({ id: d.id, name: d.name_es, slug: d.slug }))}
        apiPath={`/api/admin/retreats/${retreat.id}`}
        isAdmin={true}
      />
    </div>
  );
}
