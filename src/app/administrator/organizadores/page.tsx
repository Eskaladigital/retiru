// /administrator/organizadores — Gestión de organizadores (admin)
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import { OrganizadoresTableClient } from './OrganizadoresTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizadoresPage() {
  unstable_noStore();
  const supabase = createAdminSupabase();

  const { data: orgs, error } = await supabase
    .from('organizer_profiles')
    .select(`
      id, business_name, slug, status, total_retreats, total_bookings,
      verified_at, created_at,
      profiles!user_id(id, email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('Error fetching organizers:', error);
  }

  const list = (orgs || []).map((o: any) => ({
    id: o.id,
    user_id: o.profiles?.id ?? null,
    name: o.business_name,
    slug: o.slug,
    email: o.profiles?.email ?? null,
    full_name: o.profiles?.full_name ?? null,
    events: o.total_retreats ?? 0,
    status: o.status,
    joined: o.created_at,
    verified_at: o.verified_at,
    total_bookings: o.total_bookings ?? 0,
  }));

  const verified = list.filter((o: { status: string }) => o.status === 'verified').length;
  const pending = list.filter((o: { status: string }) => o.status === 'pending').length;
  const suspended = list.filter((o: { status: string }) => o.status === 'suspended').length;
  const rejected = list.filter((o: { status: string }) => o.status === 'rejected').length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Organizadores</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">
        {list.length} total · {verified} verificados · {pending} pendientes · {suspended} suspendidos · {rejected} rechazados
      </p>
      <OrganizadoresTableClient organizers={list} />
    </div>
  );
}
