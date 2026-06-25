import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const WEBP_QUALITY = 82;

export async function uploadCoverAsWebp(
  admin: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
): Promise<string> {
  let uploadBuffer: Buffer;
  try {
    uploadBuffer = await sharp(buffer).webp({ quality: WEBP_QUALITY, effort: 5 }).toBuffer();
  } catch {
    uploadBuffer = buffer;
  }

  const contentType = uploadBuffer === buffer && !path.endsWith('.webp')
    ? 'image/png'
    : 'image/webp';
  const finalPath = path.endsWith('.webp') ? path : path.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  const { error: upErr } = await admin.storage.from(bucket).upload(finalPath, uploadBuffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (upErr) {
    const msg = upErr.message || '';
    const isBucketMissing =
      /Bucket not found|not found|does not exist/i.test(msg) || msg.includes('404');
    throw new Error(
      isBucketMissing
        ? `El bucket «${bucket}» no existe en Supabase.`
        : msg || 'No se pudo guardar la imagen.',
    );
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(finalPath);
  if (!urlData?.publicUrl) throw new Error('No se obtuvo URL pública de la imagen.');
  return urlData.publicUrl;
}

export async function uploadCoverRaw(
  admin: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { error: upErr } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (upErr) {
    const msg = upErr.message || '';
    const isBucketMissing =
      /Bucket not found|not found|does not exist/i.test(msg) || msg.includes('404');
    throw new Error(
      isBucketMissing
        ? `El bucket «${bucket}» no existe en Supabase.`
        : msg || 'No se pudo guardar la imagen.',
    );
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
  if (!urlData?.publicUrl) throw new Error('No se obtuvo URL pública de la imagen.');
  return urlData.publicUrl;
}
