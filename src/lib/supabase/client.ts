// ============================================================================
// RETIRU · Supabase client — Browser (Client Components)
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const MAX_RETREAT_GALLERY_BYTES = 10 * 1024 * 1024;

/**
 * Sube una imagen de galería/portada al bucket `retreat-images` desde el navegador (RLS: carpeta `retreats/`).
 * Evita el límite ~4,5 MB del body en rutas API serverless (p. ej. Vercel) que afectaba a `POST /api/storage/retreat-images`.
 */
export async function uploadRetreatGalleryImageFromBrowser(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes.');
  }
  if (file.size > MAX_RETREAT_GALLERY_BYTES) {
    throw new Error('La imagen supera 10 MB. Reduce el tamaño o elige otra foto.');
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Inicia sesión para subir imágenes.');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `retreats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: upErr } = await supabase.storage.from('retreat-images').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  });
  if (upErr) {
    const msg = upErr.message || '';
    if (/row-level security|RLS|Unauthorized|not authorized/i.test(msg)) {
      throw new Error(
        'No se pudo subir la imagen. Comprueba las políticas del bucket «retreat-images» (carpeta retreats/) en Supabase.',
      );
    }
    if (/Bucket not found|not found|does not exist/i.test(msg) || msg.includes('404')) {
      throw new Error(
        'El bucket «retreat-images» no existe o no es accesible. Revisa Storage en Supabase.',
      );
    }
    throw new Error(msg.startsWith('Error') ? msg : `Error al subir la imagen: ${msg}`);
  }
  const { data: urlData } = supabase.storage.from('retreat-images').getPublicUrl(path);
  if (!urlData?.publicUrl) throw new Error('No se obtuvo URL pública tras la subida.');
  return urlData.publicUrl;
}

/** Quita data-URI base64 en HTML; suelen inflar el JSON y provocar 413 en hosting serverless. */
export function shrinkHeavyHtmlForRetreatPayload(html: string): string {
  if (!html) return html;
  return html.replace(/data:image\/[a-z0-9+.-]+;base64,[a-z0-9+/=\s]+/gi, '');
}
