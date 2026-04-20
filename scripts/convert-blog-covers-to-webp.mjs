#!/usr/bin/env node
/**
 * Convierte a WebP todas las portadas del blog (blog_articles.cover_image_url)
 * que estén en Supabase Storage (bucket `retreat-images`) como PNG/JPEG/JPG.
 *
 * Mejora FCP / LCP / PageSpeed y SEO sirviendo imágenes ~70% más ligeras.
 *
 * Requisitos .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npm run blog:covers-to-webp -- --dry-run
 *   npm run blog:covers-to-webp                     # convierte y borra PNG antiguo
 *   npm run blog:covers-to-webp -- --keep-original  # no borra el original
 *   npm run blog:covers-to-webp -- --limit=5
 *   npm run blog:covers-to-webp -- --id=<uuid>
 *   npm run blog:covers-to-webp -- --quality=85     # por defecto 82
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

const BUCKET = 'retreat-images';
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

async function processArticle(row, stats) {
  const oldUrl = row.cover_image_url;
  const oldPath = parseStoragePath(oldUrl);
  if (!oldPath) {
    stats.skipped++;
    return { id: row.id, label: row.slug, status: 'skip: no storage path' };
  }
  if (!isConvertibleExt(oldPath)) {
    stats.skipped++;
    return { id: row.id, label: row.slug, status: `skip: ext no convertible (${oldPath})` };
  }

  const newPath = webpPathFrom(oldPath);
  const originalBuf = await downloadFromStorage(oldPath);
  const webpBuf = await sharp(originalBuf).webp({ quality, effort: 5 }).toBuffer();

  stats.bytesBefore += originalBuf.length;
  stats.bytesAfter += webpBuf.length;

  if (dryRun) {
    stats.wouldConvert++;
    return {
      id: row.id,
      label: row.slug,
      status: `dry-run: ${fmtBytes(originalBuf.length)} → ${fmtBytes(webpBuf.length)} (${Math.round((1 - webpBuf.length / originalBuf.length) * 100)}%)`,
    };
  }

  const newUrl = await uploadWebp(newPath, webpBuf);
  const { error: upErr } = await admin
    .from('blog_articles')
    .update({ cover_image_url: newUrl })
    .eq('id', row.id);
  if (upErr) throw new Error(`DB update: ${upErr.message}`);

  if (!keepOriginal && newPath !== oldPath) {
    await removeFromStorage(oldPath);
  }
  stats.converted++;
  return {
    id: row.id,
    label: row.slug,
    status: `${fmtBytes(originalBuf.length)} → ${fmtBytes(webpBuf.length)} (${Math.round((1 - webpBuf.length / originalBuf.length) * 100)}% ahorro)`,
  };
}

async function main() {
  let q = admin
    .from('blog_articles')
    .select('id, slug, title_es, cover_image_url')
    .not('cover_image_url', 'is', null);
  if (singleId) q = q.eq('id', singleId);
  const { data, error } = await q;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  let rows = (data || []).filter((r) => {
    const p = parseStoragePath(r.cover_image_url);
    return p && isConvertibleExt(p);
  });
  if (limit != null && !Number.isNaN(limit)) rows = rows.slice(0, limit);

  console.log(`Portadas a convertir a WebP: ${rows.length} (quality=${quality}, dry-run=${dryRun}, keep-original=${keepOriginal})\n`);

  const stats = { converted: 0, skipped: 0, errors: 0, wouldConvert: 0, bytesBefore: 0, bytesAfter: 0 };
  for (const row of rows) {
    try {
      const r = await processArticle(row, stats);
      console.log(`OK  ${r.label}: ${r.status}`);
    } catch (e) {
      stats.errors++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ERR ${row.slug}: ${msg}`);
    }
  }

  const saved = stats.bytesBefore - stats.bytesAfter;
  const pct = stats.bytesBefore ? Math.round((saved / stats.bytesBefore) * 100) : 0;
  console.log(
    `\nResumen: ${dryRun ? stats.wouldConvert : stats.converted} convertidas, ${stats.skipped} saltadas, ${stats.errors} errores.`,
  );
  console.log(`Peso total: ${fmtBytes(stats.bytesBefore)} → ${fmtBytes(stats.bytesAfter)} (ahorro ${pct}% = ${fmtBytes(saved)})`);
  if (dryRun) console.log('\nModo dry-run: no se ha modificado nada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
