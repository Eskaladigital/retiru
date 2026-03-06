// /administrator/claims — Gestión de claims de centros (admin)
import { unstable_noStore } from 'next/cache';
import { createAdminSupabase } from '@/lib/supabase/server';
import { ClaimsTableClient } from './ClaimsTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminClaimsPage() {
  unstable_noStore(); // Evitar caché de Next.js — datos deben ser siempre frescos
  const supabase = createAdminSupabase();

  const { data: claims } = await supabase
    .from('center_claims')
    .select(`
      id, center_id, user_id, status, method, notes, admin_notes,
      reviewed_by, created_at, reviewed_at,
      centers!center_id(id, name, slug, email, website, phone, address, city),
      profiles!user_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(2000);

  const list = (claims || []) as any[];
  const pending = list.filter((c) => c.status === 'pending').length;
  const approved = list.filter((c) => c.status === 'approved').length;
  const rejected = list.filter((c) => c.status === 'rejected').length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Claims de centros</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">
            {list.length} total · <span className="text-amber-600">{pending} pendientes</span> · {approved} aprobados · {rejected} rechazados
          </p>
        </div>
      </div>

      <ClaimsTableClient claims={list} />
    </div>
  );
}
