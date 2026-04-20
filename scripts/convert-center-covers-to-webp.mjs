#!/usr/bin/env node
/**
 * Convierte a WebP todas las portadas de centros (centers.cover_url) y el array
 * centers.images que estén en Supabase Storage (bucket `centers`) como PNG/JPEG/JPG.
 *
 * Mejora FCP / LCP / PageSpeed y SEO sirviendo imágenes ~70% más ligeras.
 *
 * Requisitos .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npm run centers:covers-to-webp -- --dry-run
 *   npm run centers:covers-to-webp                     # convierte y borra original
 *   npm run centers:covers-to-webp -- --keep-original  # no borra el original
 *   npm run centers:covers-to-webp -- --limit=5
 *   npm run centers:covers-to-webp -- --id=<uuid>
 *   npm run centers:covers-to-webp -- --quality=85     # por defecto 82
 *   npm run centers:covers-to-webp -- --cover-only     # ignora el array images
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('Falta .env.local');
  process.exit(1);
}
readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        let val = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        process.env[t.slice(0, eq).trim()] = val;
      }
    }
  });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const keepOriginal = args.includes('--keep-original');
const coverOnly = args.includes('--cover-only');
const limitArg = args.find((a) => a.startsWith('--limit='));
const idArg = args.find((a) => a.startsWith('--id='));
const qArg = args.find((a) => a.startsWith('--quality='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const singleId = idArg ? idArg.split('=')[1]?.trim() : null;
const quality = qArg ? parseInt(qArg.split('=')[1], 10) : 82;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
const admin = createClient(supabaseUrl, serviceKey);

const BUCKET = 'centers';
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

function parseStoragePath(url) {
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf(PUBLIC_PREFIX);
  if (idx < 0) return null;
  const pathAndQs = url.slice(idx + PUBLIC_PREFIX.length);
  const q = pathAndQs.indexOf('?');
  return q >= 0 ? pathAndQs.slice(0, q) : pathAndQs;
}

function isConvertibleExt(path) {
  return /\.(png|jpe?g)$/i.test(path);
}

function webpPathFrom(path) {
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
}

function fmtBytes(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n > 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

async function downloadFromStorage(path) {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error) throw new Error(`download(${path}): ${error.message}`);
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

async function uploadWebp(path, buf) {
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(`upload(${path}): ${error.message}`);
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  if (!pub?.publicUrl) throw new Error('Sin URL pública');
  return pub.publicUrl;
}

async function removeFromStorage(path) {
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) console.warn(`  aviso: no se pudo borrar ${path}: ${error.message}`);
}

async function convertOne(url, stats) {
  const oldPath = parseStoragePath(url);
  if (!oldPath || !isConvertibleExt(oldPath)) {
    return { status: 'skip', newUrl: url };
  }
  const newPath = webpPathFrom(oldPath);
  const originalBuf = await downloadFromStorage(oldPath);
  const webpBuf = await sharp(originalBuf).webp({ quality, effort: 5 }).toBuffer();
  stats.bytesBefore += originalBuf.length;
  stats.bytesAfter += webpBuf.length;

  if (dryRun) {
    return {
      status: 'dry',
      newUrl: url,
      saving: `${fmtBytes(originalBuf.length)} → ${fmtBytes(webpBuf.length)}`,
    };
  }
  const newUrl = await uploadWebp(newPath, webpBuf);
  if (!keepOriginal && newPath !== oldPath) {
    await removeFromStorage(oldPath);
  }
  return {
    status: 'converted',
    newUrl,
    saving: `${fmtBytes(originalBuf.length)} → ${fmtBytes(webpBuf.length)} (${Math.round((1 - webpBuf.length / originalBuf.length) * 100)}%)`,
  };
}

async function processCenter(row, stats) {
  const patch = {};
  const logs = [];

  if (row.cover_url) {
    try {
      const r = await convertOne(row.cover_url, stats);
      if (r.status === 'converted') {
        patch.cover_url = r.newUrl;
        logs.push(`cover: ${r.saving}`);
      } else if (r.status === 'dry') {
        logs.push(`cover (dry): ${r.saving}`);
      }
    } catch (e) {
      logs.push(`cover ERR: ${e instanceof Error ? e.message : String(e)}`);
      stats.errors++;
    }
  }

  if (!coverOnly && Array.isArray(row.images) && row.images.length > 0) {
    const newImages = [];
    let anyChanged = false;
    for (const img of row.images) {
      try {
        const r = await convertOne(img, stats);
        newImages.push(r.newUrl);
        if (r.status === 'converted') anyChanged = true;
      } catch (e) {
        logs.push(`images[] ERR: ${e instanceof Error ? e.message : String(e)}`);
        newImages.push(img);
        stats.errors++;
      }
    }
    if (anyChanged) patch.images = newImages;
  }

  if (!dryRun && Object.keys(patch).length > 0) {
    const { error } = await admin.from('centers').update(patch).eq('id', row.id);
    if (error) throw new Error(`DB update: ${error.message}`);
    stats.converted++;
  }

  return `${row.slug || row.id}: ${logs.join(' | ') || 'nada'}`;
}

async function main() {
  let q = admin.from('centers').select('id, slug, name, cover_url, images');
  if (singleId) q = q.eq('id', singleId);
  const { data, error } = await q;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let rows = (data || []).filter((r) => {
    const cov = parseStoragePath(r.cover_url);
    const hasConvertibleCover = cov && isConvertibleExt(cov);
    const hasConvertibleImage = !coverOnly && Array.isArray(r.images) && r.images.some((img) => {
      const p = parseStoragePath(img);
      return p && isConvertibleExt(p);
    });
    return hasConvertibleCover || hasConvertibleImage;
  });
  if (limit != null && !Number.isNaN(limit)) rows = rows.slice(0, limit);

  console.log(`Centros con imágenes a convertir: ${rows.length} (quality=${quality}, dry-run=${dryRun}, keep-original=${keepOriginal}, cover-only=${coverOnly})\n`);

  const stats = { converted: 0, skipped: 0, errors: 0, bytesBefore: 0, bytesAfter: 0 };
  for (const row of rows) {
    try {
      const summary = await processCenter(row, stats);
      console.log(`OK  ${summary}`);
    } catch (e) {
      stats.errors++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ERR ${row.slug || row.id}: ${msg}`);
    }
  }

  const saved = stats.bytesBefore - stats.bytesAfter;
  const pct = stats.bytesBefore ? Math.round((saved / stats.bytesBefore) * 100) : 0;
  console.log(`\nResumen: ${stats.converted} centros actualizados, ${stats.errors} errores.`);
  console.log(`Peso total: ${fmtBytes(stats.bytesBefore)} → ${fmtBytes(stats.bytesAfter)} (ahorro ${pct}% = ${fmtBytes(saved)})`);
  if (dryRun) console.log('\nModo dry-run: no se ha modificado nada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
