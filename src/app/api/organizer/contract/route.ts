// POST /api/organizer/contract — Aceptar contrato de organizador
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { assignRole } from '@/lib/roles';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.accept) {
      return NextResponse.json({ error: 'Debes aceptar el contrato' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from('organizer_profiles')
      .select('id, contract_accepted_at')
      .eq('user_id', user.id)
      .single();

    if (existing?.contract_accepted_at) {
      return NextResponse.json({ message: 'Contrato ya aceptado', organizer_id: existing.id });
    }

    if (existing) {
      await admin
        .from('organizer_profiles')
        .update({ contract_accepted_at: now })
        .eq('id', existing.id);

      await assignRole(admin, user.id, 'organizer');
      return NextResponse.json({ message: 'Contrato aceptado', organizer_id: existing.id });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const businessName = profile?.full_name || user.email?.split('@')[0] || 'Organizador';
    const orgSlug = slugify(businessName) + '-' + Date.now().toString(36);

    const { data: newOrg, error: orgErr } = await admin
      .from('organizer_profiles')
      .insert({
        user_id: user.id,
        business_name: businessName,
        slug: orgSlug,
        status: 'pending',
        contract_accepted_at: now,
        languages: ['es'],
      })
      .select('id')
      .single();

    if (orgErr) {
      return NextResponse.json({ error: `Error creando perfil: ${orgErr.message}` }, { status: 500 });
    }

    await assignRole(admin, user.id, 'organizer');

    return NextResponse.json({ message: 'Contrato aceptado', organizer_id: newOrg!.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
