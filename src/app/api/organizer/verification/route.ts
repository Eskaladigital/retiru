// GET /api/organizer/verification — Estado de verificación del organizador
import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id, status, contract_accepted_at, tax_id, tax_name, tax_address, iban')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) {
      return NextResponse.json({ organizer: null, steps: [] });
    }

    const { data: steps } = await admin
      .from('organizer_verification_steps')
      .select('id, step, status, file_url, submitted_at, reviewed_at, notes, created_at')
      .eq('organizer_id', orgProfile.id)
      .order('created_at');

    return NextResponse.json({
      organizer: {
        id: orgProfile.id,
        status: orgProfile.status,
        contract_accepted_at: orgProfile.contract_accepted_at,
        tax_id: orgProfile.tax_id,
        tax_name: orgProfile.tax_name,
        tax_address: orgProfile.tax_address,
        iban: orgProfile.iban,
      },
      steps: steps || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
