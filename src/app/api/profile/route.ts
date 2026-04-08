// /api/profile — Perfil del usuario autenticado (actualización)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const MAX_NAME = 200;
const MAX_PHONE = 50;
const MAX_BIO = 4000;

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const phone =
      body.phone === null || body.phone === undefined || body.phone === ''
        ? null
        : String(body.phone).trim().slice(0, MAX_PHONE);
    const bio =
      body.bio === null || body.bio === undefined || body.bio === ''
        ? null
        : String(body.bio).trim().slice(0, MAX_BIO);

    if (!full_name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (full_name.length > MAX_NAME) {
      return NextResponse.json({ error: 'Nombre demasiado largo' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, email, full_name, phone, bio, avatar_url, preferred_locale')
      .single();

    if (error) {
      console.error('[api/profile] update:', error);
      return NextResponse.json({ error: 'No se pudo guardar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (e) {
    console.error('[api/profile]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
