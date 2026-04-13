import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { VerificacionClient } from '@/app/(public)/es/(dashboard)/mis-eventos/verificacion/VerificacionClient';

export default async function PanelVerificacionPageEn() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/en/login?redirect=/en/panel/verificacion');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id, status, contract_accepted_at, tax_id, tax_name, tax_address, iban')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile || !orgProfile.contract_accepted_at) {
    redirect('/en/panel/eventos');
  }

  const { data: steps } = await admin
    .from('organizer_verification_steps')
    .select('id, step, status, file_url, submitted_at, reviewed_at, notes, created_at')
    .eq('organizer_id', orgProfile.id)
    .order('created_at');

  return (
    <div className="max-w-2xl">
      <a href="/en/panel/eventos" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        My retreats
      </a>

      <VerificacionClient
        organizerStatus={orgProfile.status}
        steps={steps || []}
        helpHref="/en/help"
        taxData={{
          tax_id: orgProfile.tax_id,
          tax_name: orgProfile.tax_name,
          tax_address: orgProfile.tax_address,
          iban: orgProfile.iban,
        }}
      />
    </div>
  );
}
