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

function normalizeCenterType(t: unknown): 'yoga' | 'meditation' | 'ayurveda' {
  const s = typeof t === 'string' ? t : '';
  return CENTER_TYPES_ALLOWED.has(s) ? (s as 'yoga' | 'meditation' | 'ayurveda') : 'yoga';
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
      country, price_level,
    } = body;

    if (!name || !city || !province) {
      return NextResponse.json({ error: 'name, city y province son obligatorios' }, { status: 400 });
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

    const { data: center, error } = await admin
      .from('centers')
      .insert({
        name,
        slug,
        description_es: '',
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
