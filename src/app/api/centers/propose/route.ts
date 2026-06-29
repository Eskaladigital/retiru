// POST /api/centers/propose — Proponer un centro nuevo (Google Places), pendiente de validación admin
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendNewCenterProposalEmail } from '@/lib/email';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const MAX_PENDING_PROPOSALS = 8;

const CENTER_TYPES_ALLOWED = new Set(['yoga', 'meditation', 'ayurveda']);
const MAX_CENTER_IMAGE_BYTES = 4 * 1024 * 1024;
const CENTER_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ImageUploadPayload = {
  filename?: string;
  contentType?: string;
  dataUrl?: string;
};

function normalizeCenterType(t: unknown): 'yoga' | 'meditation' | 'ayurveda' {
  const s = typeof t === 'string' ? t : '';
  return CENTER_TYPES_ALLOWED.has(s) ? (s as 'yoga' | 'meditation' | 'ayurveda') : 'yoga';
}

function normalizePublicImageUrl(value: unknown): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

function normalizeServices(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean).slice(0, 12)
    : [];
}

function imageExtension(contentType: string, filename?: string): string {
  const byType = contentType.split('/')[1]?.split(';')[0]?.toLowerCase();
  if (byType) return byType === 'jpeg' ? 'jpg' : byType;
  return filename?.split('.').pop()?.toLowerCase() || 'jpg';
}

async function uploadCenterImage(
  admin: ReturnType<typeof createAdminSupabase>,
  slug: string,
  payload: ImageUploadPayload,
  label: 'cover' | 'gallery',
): Promise<string> {
  const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Formato de imagen no válido.');
  }

  const contentType = (payload.contentType || match[1]).toLowerCase();
  if (!CENTER_IMAGE_ALLOWED_TYPES.has(contentType) || !CENTER_IMAGE_ALLOWED_TYPES.has(match[1].toLowerCase())) {
    throw new Error('Formato no válido. Usa JPG, PNG o WebP.');
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_CENTER_IMAGE_BYTES) {
    throw new Error('La imagen supera 4 MB. Reduce el tamaño o elige otra foto.');
  }

  const ext = imageExtension(contentType, payload.filename);
  const path = `${slug}/${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, address, city, province, postal_code, latitude, longitude, website, phone, type,
      google_place_id, google_types, google_maps_url, google_status, avg_rating, review_count,
      country, price_level, description_es,
    } = body;
    const servicesEs = normalizeServices(body.services_es);
    const coverUpload = body.cover_upload as ImageUploadPayload | undefined;
    const imageUploads = Array.isArray(body.images_uploads)
      ? (body.images_uploads as ImageUploadPayload[])
      : [];

    if (!name || !city || !province) {
      return NextResponse.json({ error: 'name, city y province son obligatorios' }, { status: 400 });
    }
    const descriptionEs = typeof description_es === 'string' ? description_es.trim() : '';
    if (descriptionEs.length < 80) {
      return NextResponse.json(
        { error: 'La descripción del centro es obligatoria y debe tener al menos 80 caracteres.' },
        { status: 400 },
      );
    }
    if (servicesEs.length === 0) {
      return NextResponse.json(
        { error: 'Añade al menos una actividad o servicio que ofrece el centro.' },
        { status: 400 },
      );
    }

    const admin = createAdminSupabase();

    const { count: pendingCount, error: countErr } = await admin
      .from('centers')
      .select('id', { count: 'exact', head: true })
      .eq('submitted_by', user.id)
      .eq('status', 'pending_review');

    if (countErr) throw countErr;
    if ((pendingCount ?? 0) >= MAX_PENDING_PROPOSALS) {
      return NextResponse.json(
        { error: `Tienes demasiadas propuestas pendientes (máx. ${MAX_PENDING_PROPOSALS}). Espera a que las revisemos.` },
        { status: 429 },
      );
    }

    if (google_place_id) {
      const { data: existing } = await admin
        .from('centers')
        .select('id, name, slug, status')
        .eq('google_place_id', google_place_id)
        .maybeSingle();

      if (existing) {
        const isPublic = existing.status === 'active';
        return NextResponse.json(
          {
            error: isPublic
              ? `Este lugar ya está en Retiru: «${existing.name}». Búscalo en el directorio para reclamarlo.`
              : 'Este lugar ya consta en nuestro sistema (pendiente o inactivo).',
            existing: { slug: existing.slug, status: existing.status },
          },
          { status: 409 },
        );
      }
    }

    const { data: allSlugs } = await admin.from('centers').select('slug');
    const usedSlugs = new Set((allSlugs || []).map((r: { slug: string }) => r.slug));

    let base = slugify(name);
    if (base.length > 40) base = base.slice(0, 40);
    let slug = base;
    let n = 0;
    while (usedSlugs.has(slug)) {
      n++;
      slug = `${base}-${n}`;
    }

    const now = new Date().toISOString();
    const explicitCoverUrl = normalizePublicImageUrl(body.cover_url);
    const coverUrl = explicitCoverUrl || (coverUpload?.dataUrl ? await uploadCenterImage(admin, slug, coverUpload, 'cover') : null);
    if (!coverUrl) {
      return NextResponse.json(
        { error: 'La propuesta debe incluir una foto de portada subida manualmente o generada con IA.' },
        { status: 400 },
      );
    }

    const images = [];
    for (const img of imageUploads.slice(0, 4)) {
      if (img?.dataUrl) images.push(await uploadCenterImage(admin, slug, img, 'gallery'));
    }

    const { data: center, error } = await admin
      .from('centers')
      .insert({
        name,
        slug,
        description_es: descriptionEs,
        services_es: servicesEs,
        cover_url: coverUrl,
        images,
        address: address || '',
        city,
        province,
        postal_code: postal_code || null,
        latitude: latitude || null,
        longitude: longitude || null,
        website: website || null,
        phone: phone || null,
        type: normalizeCenterType(type),
        status: 'pending_review',
        plan: 'basic',
        google_place_id: google_place_id || null,
        google_types: google_types || null,
        google_maps_url: google_maps_url || null,
        google_status: google_status || null,
        country: country || 'España',
        price_level: price_level || null,
        avg_rating: avg_rating || 0,
        review_count: review_count || 0,
        submitted_by: user.id,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, slug, city, province')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await sendNewCenterProposalEmail({
        userName: profile?.full_name || 'Usuario',
        userEmail: user.email || '',
        centerName: center.name || name,
        city: center.city || city,
        province: center.province || province,
        centerId: center.id,
      });
    } catch (emailErr) {
      console.error('Failed to send center proposal email:', emailErr);
    }

    return NextResponse.json({
      center,
      message: 'Propuesta enviada. La revisaremos y te avisaremos cuando esté publicada.',
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
