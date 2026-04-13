// /administrator/organizadores/[id]/verificar — Verificar organizador (admin)
import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { AdminVerificacionClient } from './AdminVerificacionClient';

export const dynamic = 'force-dynamic';

export default async function AdminVerificarOrgPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login');

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!adminRole) redirect('/es');

  const admin = createAdminSupabase();

  const { data: org } = await admin
    .from('organizer_profiles')
    .select(`
      id, user_id, business_name, slug, status, contract_accepted_at,
      tax_id, tax_name, tax_address, iban,
      verified_at, rejection_reason, created_at,
      profiles!user_id(id, email, full_name)
    `)
    .eq('id', id)
    .single();

  if (!org) redirect('/administrator/organizadores');

  const { data: steps } = await admin
    .from('organizer_verification_steps')
    .select('id, step, status, file_url, submitted_at, reviewed_at, notes, created_at')
    .eq('organizer_id', id)
    .order('created_at');

  return (
    <AdminVerificacionClient
      organizer={org as any}
      steps={(steps || []) as any[]}
    />
  );
}
