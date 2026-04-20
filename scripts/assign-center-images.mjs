#!/usr/bin/env node
/**
 * RETIRU · Asignar imágenes de portada a centros (SerpAPI Images + OpenAI + Supabase Storage)
 * Busca en Google Images, la IA elige la mejor, sube al bucket centers y actualiza cover_url.
 *
 * Usa .env.local: SUPABASE_*, OPENAI_API_KEY, SERPAPI_API_KEY
 *
 * Uso: node scripts/assign-center-images.mjs [--limit N] [--force]
 *   --limit N   Procesar solo N centros (default: todos)
 *   --force     Sobrescribir cover_url aunque ya exista
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eq = trimmed.indexOf('=');
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      value = value.replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// ─── SerpAPI: búsqueda de imágenes ───────────────────────────────────────────
async function searchImages(query, serpKey) {
  try {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&gl=es&num=10`;
    const res = await fetch(url);
    const data = res.ok ? await res.json() : null;
    return data?.images_results?.slice(0, 10) || [];
  } catch (e) {
    console.warn('  ⚠ SerpAPI:', e.message);
    return [];
  }
}

// ─── OpenAI: elegir la mejor imagen ──────────────────────────────────────────
async function pickBestImage(centerName, city, images, openaiKey) {
  if (!images?.length) return 0;

  const list = images
    .map((img, i) => `[${i}] ${img.original || img.thumbnail} - ${img.title || 'Sin título'} (${img.source || '?'})`)
    .join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un selector de imágenes para Retiru (centros de yoga, wellness, pilates).
Elige la imagen que mejor represente un centro de bienestar: profesional, acogedor, relacionado con yoga/meditación/wellness.
Evita logos, capturas de pantalla, imágenes genéricas de comida. Prioriza fotos de espacios, personas practicando, naturaleza.
Responde SOLO con el número del índice (0-9), nada más.`,
        },
        {
          role: 'user',
          content: `Centro: ${centerName}, ${city}\n\nImágenes:\n${list}\n\nÍndice de la mejor (0-9):`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) return 0;
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '0';
  const idx = parseInt(raw.replace(/\D/g, ''), 10);
  return isNaN(idx) || idx < 0 || idx >= images.length ? 0 : idx;
}

// ─── Descargar imagen y subir a Supabase ─────────────────────────────────────
async function downloadAndUpload(imageUrl, centerId, supabase) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Retiru/1.0)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    let uploadBuffer = rawBuffer;
    let contentType = 'image/webp';
    let ext = 'webp';
    try {
      uploadBuffer = await sharp(rawBuffer).webp({ quality: 82, effort: 5 }).toBuffer();
    } catch (e) {
      console.warn('  ⚠ sharp falló, subiendo original:', e.message);
      const srcContentType = res.headers.get('content-type') || 'image/jpeg';
      contentType = srcContentType.split(';')[0].trim();
      ext = contentType.includes('png') ? 'png' : 'jpg';
    }
    const path = `${centerId}/cover.${ext}`;

    const { error } = await supabase.storage.from('centers').upload(path, uploadBuffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true,
    });

    if (error) {
      console.warn('  ⚠ Upload:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('centers').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn('  ⚠ Download:', e.message);
    return null;
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const serpKey = process.env.SERPAPI_API_KEY;

  if (!url || !serviceKey || !openaiKey || !serpKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY o SERPAPI_API_KEY');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
  const force = args.includes('--force');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  let { data: centers } = await supabase
    .from('centers')
    .select('id, name, city, province, cover_url')
    .eq('status', 'active')
    .order('name');

  if (!centers?.length) {
    console.log('No hay centros activos.');
    process.exit(0);
  }

  if (!force) {
    centers = centers.filter((c) => !c.cover_url || !c.cover_url.includes('supabase'));
  }

  const toProcess = limit ? centers.slice(0, limit) : centers;
  console.log(`\n🖼️  RETIRU · Asignar imágenes a centros\n   Total: ${toProcess.length} centros\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const c = toProcess[i];
    console.log(`   [${i + 1}/${toProcess.length}] ${c.name} (${c.city})...`);

    const cleanName = (c.name || '').replace(/[|]/g, ' ').replace(/\s+/g, ' ').slice(0, 40);
    let query = `${cleanName} ${c.city} yoga wellness`;
    let images = await searchImages(query, serpKey);

    if (!images.length) {
      query = `yoga wellness ${c.city}`;
      images = await searchImages(query, serpKey);
    }

    if (!images.length) {
      console.log('      ⚠ Sin resultados de imágenes');
      fail++;
      await sleep(800);
      continue;
    }

    const idx = await pickBestImage(c.name, c.city, images, openaiKey);
    const chosen = images[idx];
    const imageUrl = chosen?.original || chosen?.thumbnail;

    if (!imageUrl) {
      console.log('      ⚠ Sin URL de imagen');
      fail++;
      await sleep(500);
      continue;
    }

    const publicUrl = await downloadAndUpload(imageUrl, c.id, supabase);
    if (!publicUrl) {
      fail++;
      await sleep(500);
      continue;
    }

    const { error } = await supabase.from('centers').update({ cover_url: publicUrl }).eq('id', c.id);
    if (error) {
      console.log('      ❌ Error al actualizar:', error.message);
      fail++;
    } else {
      console.log('      ✅ Imagen asignada');
      ok++;
    }

    await sleep(1500);
  }

  console.log(`\n✅ Completado: ${ok} centros con imagen, ${fail} fallos\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
