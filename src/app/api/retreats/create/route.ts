// POST /api/retreats/create — Crear retiro (cualquier usuario autenticado)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

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
    const {
      title_es, title_en, summary_es, summary_en,
      description_es, description_en,
      includes_es, includes_en,
      excludes_es, excludes_en,
      start_date, end_date,
      total_price, max_attendees,
      destination_id, address,
      categories, confirmation_type, languages,
      images, schedule, cancellation_policy,
    } = body;

    if (!title_es || !summary_es || !description_es || !start_date || !end_date || !total_price || !max_attendees) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Asegurar que el usuario tiene organizer_profile
    let { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) {
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
          status: 'verified',
          verified_at: new Date().toISOString(),
          languages: ['es'],
        })
        .select('id')
        .single();

      if (orgErr) {
        return NextResponse.json({ error: `Error creando perfil organizador: ${orgErr.message}` }, { status: 500 });
      }
      orgProfile = newOrg;
    }

    const retreatSlug = slugify(title_es) + '-' + Date.now().toString(36);

    // Confianza progresiva: si el usuario ya tiene al menos 1 retiro publicado, el nuevo se publica directamente
    const { count: publishedCount } = await admin
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile!.id)
      .eq('status', 'published');

    const isVerifiedOrganizer = (publishedCount ?? 0) > 0;

    const insertData: Record<string, unknown> = {
      organizer_id: orgProfile!.id,
      title_es,
      title_en: title_en || null,
      slug: retreatSlug,
      summary_es,
      summary_en: summary_en || null,
      description_es,
      description_en: description_en || null,
      includes_es: includes_es || [],
      includes_en: includes_en || [],
      excludes_es: excludes_es || [],
      excludes_en: excludes_en || [],
      start_date,
      end_date,
      total_price: parseFloat(total_price),
      max_attendees: parseInt(max_attendees, 10),
      destination_id: destination_id || null,
      address: address || null,
      confirmation_type: confirmation_type || 'automatic',
      languages: languages || ['es'],
      status: 'draft',
    };

    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      insertData.schedule = schedule;
    }

    if (cancellation_policy && typeof cancellation_policy === 'object') {
      insertData.cancellation_policy = cancellation_policy;
    }

    const { data: retreat, error: retErr } = await admin
      .from('retreats')
      .insert(insertData)
      .select('id, slug')
      .single();

    if (retErr) {
      return NextResponse.json({ error: `Error creando retiro: ${retErr.message}` }, { status: 500 });
    }

    // Asociar categorías si se proporcionaron
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const catRows = categories.map((catId: string) => ({
        retreat_id: retreat!.id,
        category_id: catId,
      }));
      await admin.from('retreat_categories').insert(catRows);
    }

    // Guardar imágenes si se proporcionaron
    if (images && Array.isArray(images) && images.length > 0) {
      const imgRows = images.map((img: { url: string; is_cover: boolean }, i: number) => ({
        retreat_id: retreat!.id,
        url: img.url,
        is_cover: img.is_cover || false,
        sort_order: i,
      }));
      await admin.from('retreat_images').insert(imgRows);
    }

    return NextResponse.json({
      retreat,
      isVerifiedOrganizer,
      message: 'Retiro creado como borrador.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
