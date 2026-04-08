// /api/profile — Perfil del usuario autenticado (actualización)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const MAX_NAME = 200;
const MAX_PHONE = 50;
const MAX_BIO = 4000;

function isAllowedAvatarPublicUrl(url: string, userId: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !url) return false;
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return false;
  }
  const prefix = `/storage/v1/object/public/avatars/${userId}/`;
  return pathname.startsWith(prefix);
}

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

    const updatePayload: Record<string, unknown> = {
      full_name,
      phone,
      bio,
      updated_at: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(body, 'avatar_url')) {
      if (body.avatar_url === null) {
        updatePayload.avatar_url = null;
      } else if (typeof body.avatar_url === 'string') {
        const trimmed = body.avatar_url.trim();
        if (!isAllowedAvatarPublicUrl(trimmed, user.id)) {
          return NextResponse.json(
            { error: 'La foto debe subirse desde tu cuenta (bucket avatars).' },
            { status: 400 },
          );
        }
        updatePayload.avatar_url = trimmed;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
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
