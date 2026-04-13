// POST /api/organizer/verification/[step] — Subir documento de verificación
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const VALID_STEPS = ['identity_doc', 'economic_activity', 'insurance', 'tax_info', 'bank_info'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ step: string }> },
) {
  try {
    const { step } = await params;
    if (!VALID_STEPS.includes(step)) {
      return NextResponse.json({ error: 'Paso no válido' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id, contract_accepted_at')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) {
      return NextResponse.json({ error: 'No tienes perfil de organizador' }, { status: 403 });
    }

    if (!orgProfile.contract_accepted_at) {
      return NextResponse.json({ error: 'Debes aceptar el contrato primero' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El archivo no puede superar 10MB' }, { status: 400 });
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Usa PDF, JPG, PNG o WebP' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const filePath = `${user.id}/${step}_${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await admin.storage
      .from('organizer-docs')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json({ error: `Error subiendo archivo: ${uploadErr.message}` }, { status: 500 });
    }

    const now = new Date().toISOString();

    // For tax_info and bank_info, also save form data
    if (step === 'tax_info') {
      const taxId = formData.get('tax_id') as string | null;
      const taxName = formData.get('tax_name') as string | null;
      const taxAddress = formData.get('tax_address') as string | null;
      if (taxId || taxName || taxAddress) {
        await admin.from('organizer_profiles').update({
          tax_id: taxId || undefined,
          tax_name: taxName || undefined,
          tax_address: taxAddress || undefined,
        }).eq('id', orgProfile.id);
      }
    }

    if (step === 'bank_info') {
      const iban = formData.get('iban') as string | null;
      if (iban) {
        await admin.from('organizer_profiles').update({
          iban,
        }).eq('id', orgProfile.id);
      }
    }

    const { error: stepErr } = await admin
      .from('organizer_verification_steps')
      .update({
        file_url: filePath,
        status: 'submitted',
        submitted_at: now,
        notes: null,
      })
      .eq('organizer_id', orgProfile.id)
      .eq('step', step);

    if (stepErr) {
      return NextResponse.json({ error: `Error actualizando paso: ${stepErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, file_url: filePath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
