// POST /api/admin/centers — Crear centro nuevo desde el admin (Google Places)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const CENTER_TYPES_ALLOWED = new Set(['yoga', 'meditation', 'ayurveda']);

function normalizeCenterType(t: unknown): 'yoga' | 'meditation' | 'ayurveda' {
  const s = typeof t === 'string' ? t : '';
  return CENTER_TYPES_ALLOWED.has(s) ? (s as 'yoga' | 'meditation' | 'ayurveda') : 'yoga';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
  }

  const body = await request.json();
  const { name, address, city, province, postal_code, latitude, longitude, website, phone, type,
    google_place_id, google_types, google_maps_url, google_status, avg_rating, review_count,
    country, price_level } = body;

  if (!name || !city || !province) {
    return NextResponse.json({ error: 'name, city y province son obligatorios' }, { status: 400 });
  }

  const admin = createAdminSupabase();

  if (google_place_id) {
    const { data: existing } = await admin
      .from('centers')
      .select('id, name, slug')
      .eq('google_place_id', google_place_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Este lugar ya existe como "${existing.name}" (/${existing.slug})`, existing },
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

  const { data: center, error } = await admin.from('centers').insert({
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
    status: 'active',
    plan: 'basic',
    google_place_id: google_place_id || null,
    google_types: google_types || null,
    google_maps_url: google_maps_url || null,
    google_status: google_status || null,
    country: country || 'España',
    price_level: price_level || null,
    avg_rating: avg_rating || 0,
    review_count: review_count || 0,
    created_at: now,
    updated_at: now,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ center }, { status: 201 });
}
