// POST /api/storage/retreat-images — Subida de imágenes de retiros al bucket retreat-images
// Usa service role en servidor para no depender de las políticas RLS del cliente (mismo problema que blog/).

import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Inicia sesión para subir imágenes.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el archivo (campo «file»).' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen supera 10 MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `retreats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const admin = createAdminSupabase();
    const { error } = await admin.storage.from('retreat-images').upload(path, buf, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      console.error('[storage/retreat-images]', error);
      return NextResponse.json(
        { error: error.message || 'No se pudo guardar la imagen en el bucket.' },
        { status: 502 },
      );
    }

    const { data: urlData } = admin.storage.from('retreat-images').getPublicUrl(path);
    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (e) {
    console.error('[storage/retreat-images]', e);
    return NextResponse.json({ error: 'Error interno al subir la imagen.' }, { status: 500 });
  }
}
