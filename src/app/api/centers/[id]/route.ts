// PATCH /api/centers/[id] — Actualizar centro (solo propietario o admin)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const CENTER_TYPES_ALLOWED = new Set(['yoga', 'meditation', 'ayurveda']);
const MAX_CENTER_IMAGE_BYTES = 4 * 1024 * 1024;

type ImageUploadPayload = {
  filename?: string;
  contentType?: string;
  dataUrl?: string;
};

function normalizePublicImageUrl(value: unknown): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

function normalizeImageList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string' && /^https?:\/\//i.test(x.trim())).map((x) => x.trim())
    : [];
}

function normalizeServices(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean).slice(0, 12)
    : [];
}

function textLengthWithoutHtml(value: unknown): number {
  const s = typeof value === 'string' ? value : '';
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length;
}

function imageExtension(contentType: string, filename?: string): string {
  const byType = contentType.split('/')[1]?.split(';')[0]?.toLowerCase();
  if (byType) return byType === 'jpeg' ? 'jpg' : byType;
  return filename?.split('.').pop()?.toLowerCase() || 'jpg';
}

async function uploadCenterImage(
  admin: ReturnType<typeof createAdminSupabase>,
  centerId: string,
  payload: ImageUploadPayload,
  label: 'cover' | 'gallery',
): Promise<string> {
  const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Formato de imagen no válido.');
  }

  const contentType = payload.contentType || match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_CENTER_IMAGE_BYTES) {
    throw new Error('La imagen supera 4 MB. Reduce el tamaño o elige otra foto.');
  }

  const ext = imageExtension(contentType, payload.filename);
  const path = `${centerId}/${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.storage.from('centers').upload(path, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;

  const { data } = admin.storage.from('centers').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('No se obtuvo URL pública tras subir la imagen.');
  return data.publicUrl;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = createAdminSupabase();

    // Verify ownership or admin role
    const { data: center } = await admin
      .from('centers')
      .select('id, claimed_by, cover_url, images, description_es, services_es')
      .eq('id', id)
      .single();

    if (!center) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });
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
      return NextResponse.json({ error: 'No tienes permiso para editar este centro' }, { status: 403 });
    }

    const body = await request.json();

    // Editable fields for center owner/admin
    const ALLOWED_FIELDS = [
      'name', 'description_es', 'description_en', 'type',
      'cover_url', 'images', 'logo_url',
      'website', 'email', 'phone', 'instagram', 'facebook',
      'address', 'city', 'province', 'postal_code',
      'services_es', 'services_en',
      'schedule_summary_es', 'schedule_summary_en',
      'price_range_es', 'price_range_en',
      'google_place_id', 'google_types', 'google_maps_url', 'google_status',
      'region', 'country', 'web_valid_ia', 'quality_ia', 'search_terms', 'price_level',
    ];

    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (updateData.type !== undefined) {
      const t = typeof updateData.type === 'string' ? updateData.type : '';
      if (!CENTER_TYPES_ALLOWED.has(t)) {
        return NextResponse.json({ error: 'Tipo de centro no válido' }, { status: 400 });
      }
    }

    const coverUpload = body.cover_upload as ImageUploadPayload | undefined;
    if (coverUpload?.dataUrl) {
      updateData.cover_url = await uploadCenterImage(admin, id, coverUpload, 'cover');
    }

    const imageUploads = Array.isArray(body.images_uploads)
      ? (body.images_uploads as ImageUploadPayload[])
      : [];
    if (imageUploads.length > 0) {
      const currentImages = updateData.images !== undefined
        ? normalizeImageList(updateData.images)
        : normalizeImageList(center.images);
      const uploadedImages = [];
      for (const img of imageUploads.slice(0, 4)) {
        if (img?.dataUrl) uploadedImages.push(await uploadCenterImage(admin, id, img, 'gallery'));
      }
      updateData.images = [...currentImages, ...uploadedImages].slice(0, 8);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const finalCoverUrl = updateData.cover_url !== undefined
      ? normalizePublicImageUrl(updateData.cover_url)
      : normalizePublicImageUrl(center.cover_url);
    const finalImages = updateData.images !== undefined
      ? normalizeImageList(updateData.images)
      : normalizeImageList(center.images);
    if (!finalCoverUrl && finalImages.length === 0) {
      return NextResponse.json(
        { error: 'El perfil del centro debe tener al menos una foto de portada o galería.' },
        { status: 400 },
      );
    }

    const finalDescription = updateData.description_es !== undefined ? updateData.description_es : center.description_es;
    if (textLengthWithoutHtml(finalDescription) < 80) {
      return NextResponse.json(
        { error: 'La descripción del centro es obligatoria y debe tener al menos 80 caracteres.' },
        { status: 400 },
      );
    }

    const finalServices = updateData.services_es !== undefined
      ? normalizeServices(updateData.services_es)
      : normalizeServices(center.services_es);
    if (finalServices.length === 0) {
      return NextResponse.json(
        { error: 'Añade al menos una actividad o servicio que ofrece el centro.' },
        { status: 400 },
      );
    }
    updateData.services_es = finalServices;

    updateData.updated_at = new Date().toISOString();

    const { error: updateErr } = await admin
      .from('centers')
      .update(updateData)
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
