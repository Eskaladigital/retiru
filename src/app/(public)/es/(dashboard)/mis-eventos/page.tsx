// /es/mis-eventos — Retiros/eventos del usuario
import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { MisEventosClient } from './MisEventosClient';

export default async function MisEventosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/mis-eventos');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let retreats: any[] = [];
  if (orgProfile) {
    const { data } = await admin
      .from('retreats')
      .select(`
        id, slug, title_es, status, start_date, end_date,
        max_attendees, confirmed_bookings, total_price,
        retreat_images(url, is_cover)
      `)
      .eq('organizer_id', orgProfile.id)
      .order('start_date', { ascending: false });
    retreats = data || [];
  }

  const list = retreats.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title_es: r.title_es,
    status: r.status,
    start_date: r.start_date,
    end_date: r.end_date,
    max_attendees: r.max_attendees,
    confirmed_bookings: r.confirmed_bookings || 0,
    total_price: r.total_price,
    cover: r.retreat_images?.find((i: any) => i.is_cover)?.url || r.retreat_images?.[0]?.url || null,
  }));

  return <MisEventosClient retreats={list} />;
}
