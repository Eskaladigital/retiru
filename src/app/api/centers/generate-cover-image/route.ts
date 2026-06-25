// POST /api/centers/generate-cover-image — Portada IA para centro (propietario o admin)
import { NextResponse } from 'next/server';
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase/server';
import { generateCenterCoverImage, type CenterCoverBriefInput } from '@/lib/openai/center-cover-image';
import { uploadCoverAsWebp } from '@/lib/openai/cover-image-upload';
import { getCenterTypeLabel } from '@/lib/utils';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'La generación de portadas con IA no está activa. Falta OPENAI_API_KEY en el servidor.' },
        { status: 503 },
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Inicia sesión para generar imágenes.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = str(body.name);
    const description_es = str(body.description_es).slice(0, 35000);

    if (!name.trim() || !description_es.trim()) {
      return NextResponse.json(
        { error: 'Hacen falta al menos el nombre y la descripción del centro para generar la portada.' },
        { status: 400 },
      );
    }

    const admin = createAdminSupabase();
    const center_id = str(body.center_id).trim() || undefined;

    if (center_id) {
      const { data: center } = await admin
        .from('centers')
        .select('id, claimed_by')
        .eq('id', center_id)
        .maybeSingle();

      if (!center) {
        return NextResponse.json({ error: 'Centro no encontrado.' }, { status: 404 });
      }

      const { data: adminRole } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const isOwner = center.claimed_by === user.id;
      const isAdmin = !!adminRole;
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'No tienes permiso para generar imágenes de este centro.' }, { status: 403 });
      }
    }

    const type = str(body.type).trim() || undefined;
    const type_label =
      str(body.type_label).trim() ||
      (type ? getCenterTypeLabel(type, 'es') : undefined);

    const brief: CenterCoverBriefInput = {
      name,
      description_es,
      type,
      type_label,
      city: str(body.city).trim() || undefined,
      province: str(body.province).trim() || undefined,
      address: str(body.address).trim() || undefined,
      region: str(body.region).trim() || undefined,
      country: str(body.country).trim() || undefined,
      services_es: strArr(body.services_es),
      schedule_summary_es: str(body.schedule_summary_es).trim() || undefined,
      description_en: str(body.description_en).trim().slice(0, 20000) || undefined,
    };

    const { buffer } = await generateCenterCoverImage(openaiKey, brief);

    const folder = center_id || 'generated';
    const path = `${folder}/ai-cover-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
    const publicUrl = await uploadCoverAsWebp(admin, 'centers', path, buffer);

    return NextResponse.json({ publicUrl });
  } catch (e) {
    console.error('[centers/generate-cover-image]', e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
