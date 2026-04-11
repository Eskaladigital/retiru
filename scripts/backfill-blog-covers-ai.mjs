#!/usr/bin/env node
/**
 * Mismo agente que retiros (dossier → GPT-4o ×2 → gpt-image-1.5) aplicado al blog.
 * Actualiza portadas (cover_image_url) y, opcionalmente, <img> de stock dentro del HTML.
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Uso:
 *   npm run blog:backfill-covers-ai
 *   npm run blog:backfill-covers-ai -- --dry-run
 *   npm run blog:backfill-covers-ai -- --force              # todas las portadas (aunque no sean stock)
 *   npm run blog:backfill-covers-ai -- --limit=5
 *   npm run blog:backfill-covers-ai -- --concurrency=2    # artículos en paralelo (default 2)
 *   npm run blog:backfill-covers-ai -- --id=<uuid>        # un solo artículo
 *   npm run blog:backfill-covers-ai -- --inline            # también sustituye <img> con URLs de bancos gratuitos
 *   npm run blog:backfill-covers-ai -- --regenerate-blog-ai  # también portadas ya en blog/ai-cover-* (p. ej. tras mejorar prompts)
 *
 * Mantener prompts alineados con `agente generador de imágenes.txt` y `src/lib/openai/event-cover-image.ts`.
 */
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

const MAX_BODY_CHARS = 2800;
const MAX_EXCERPT_CHARS = 800;
const OPENAI_IMAGE_MODEL = 'gpt-image-1.5';
const OPENAI_IMAGE_SIZE = '1536x1024';
const OPENAI_IMAGE_QUALITY = 'high';

/** URLs típicas de bancos gratuitos / placeholders (portada e inline). */
const STOCK_URL_MARKERS = [
  'unsplash.com',
  'images.unsplash',
  'pexels.com',
  'pexels.io',
  'pixabay.com',
  'cdn.pixabay',
  'gratisography.com',
  'picsum.photos',
  'placeholder.com',
  'placehold.co',
  'loremflickr.com',
];

function isStockishUrl(u) {
  if (!u || typeof u !== 'string') return false;
  const s = u.toLowerCase();
  return STOCK_URL_MARKERS.some((m) => s.includes(m));
}

function stripHtml(html, maxLen) {
  if (!html) return '';
  let t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function inferSeasonFromDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return undefined;
  const m = parseInt(iso.slice(5, 7), 10);
  if (Number.isNaN(m)) return undefined;
  if (m >= 3 && m <= 5) return 'Primavera (hemisferio norte).';
  if (m >= 6 && m <= 8) return 'Verano (hemisferio norte).';
  if (m >= 9 && m <= 11) return 'Otoño (hemisferio norte).';
  return 'Invierno (hemisferio norte).';
}

function formatBlogCoverDossier(row) {
  const cat = row.blog_categories?.name_es || 'General';
  const body = stripHtml(row.content_es || row.content_en || '', MAX_BODY_CHARS);
  const exc = stripHtml(row.excerpt_es || row.excerpt_en || '', MAX_EXCERPT_CHARS);
  const season = inferSeasonFromDate(row.published_at);
  const parts = [
    '=== DOSSIER DEL ARTÍCULO DE BLOG (úsalo entero; prioriza coherencia temática y editorial) ===',
    'Tu salida final será SOLO el párrafo-prompt para el modelo de imagen, no resúmenes de este dossier.',
    '',
    `Título (ES): ${String(row.title_es || '').trim()}`,
    `Extracto / resumen (ES): ${exc}`,
    `Categoría editorial: ${cat}`,
  ];
  if (String(row.title_en || '').trim()) parts.push(`Título (EN): ${String(row.title_en).trim()}`);
  if (String(row.excerpt_en || '').trim()) {
    parts.push(`Extracto (EN): ${stripHtml(row.excerpt_en, 500)}`);
  }
  parts.push('', '--- Cuerpo del artículo (texto plano, extracto) ---', body);
  if (season) parts.push('', `--- Contexto temporal (publicación) ---\nFecha publicación: ${row.published_at || 'desconocida'}\nEstación aproximada: ${season}`);
  parts.push(
    '',
    '--- Variedad visual (obligatorio) ---',
    'Evita el cliché de banco de imágenes: grupo sentado de espaldas a la cámara mirando montaña, mar o horizonte; filas en deck de madera; siluetas alineadas “meditando al infinito”.',
    'Prioriza cuando encaje con el tema: detalle (manos, esterilla, textil), interior con luz natural, materiales y arquitectura del lugar, bodegón editorial si el artículo es alimentación/salud digestiva, primer plano de elementos del retiro sin forzar paisaje con grupo, encuadre en diagonal o desde altura, espacio casi vacío con atmósfera, o una figura en movimiento suave (no estatua mirando lejos).',
    '',
    '--- Objetivo de la imagen ---',
    'Portada horizontal: una escena fotorrealista, específica al artículo, que no se confunda con otras tarjetas del listado.',
  );
  return parts.join('\n');
}

const PROMPT_BUILDER_BLOG = `Eres un agente senior: director de arte + editor visual + especialista en prompts para generación de imágenes fotorrealistas. Recibes un DOSSIER COMPLETO de un artículo de blog (bienestar, yoga, ayurveda, retiros). Tu ÚNICA salida es UN párrafo en español que el modelo de imagen usará tal cual: debe ser la mejor posible.

ANTES de escribir (mentalmente, no lo imprimas): (1) Elige el escenario visual más específico y honesto con el dossier — no un “wellness genérico”. (2) Conecta TEMÁTICA del artículo (práctica, lugar, ritual, alimentación, naturaleza…) con detalles concretos del texto. (3) Elige UNA luz creíble de día (mañana luminosa, media mañana, tarde clara o golden hour todavía alta). (4) Añade 2–4 sustantivos CONCRETOS de textura o material (madera cruda, sal, arcilla, lino, cerámica, hierbas, piedra caliza…) alineados con el tema, no adjetivos vacíos. (5) Si hay conflicto, prima título + extracto + cuerpo sobre suposiciones. (6) Piensa como si un fotógrafo profesional hiciera una foto real para portada editorial de revista, no “arte generativo”. (7) VARÍA el tipo de plano respecto al típico “retiro”: no caigas por defecto en grupo mirando paisaje.

REGLAS DURAS:
- No inventes lugares nombrados que no aparezcan en el dossier.
- Luz/horario: PROHIBIDO noche, anochecer oscuro, hora azul, escenas subexpuestas. Luz natural entre 09:00 y 20:30, luminosa y clara, usable como portada web.
- Variedad: el dossier incluye opciones A-F de tipo de escena. Elige la que mejor encaje con ESTE artículo concreto; si el tema es de personas (yoga, meditación, retiro), las personas PUEDEN y DEBEN aparecer a menudo, pero varía la composición: de frente, de lado, en acción, en interior, una sola persona, pequeño grupo activo, primer plano de manos. Lo que NO debe repetirse es siempre el mismo encuadre (p. ej. siempre espaldas mirando horizonte).
- Personas cuando aparezcan: naturales, en actividad real, no posadas. Rostros pueden verse si es creíble. Nunca celebridades.
- Prohibido: texto legible, logotipos, carteles, móviles como foco, marcas, datos de contacto.
- Evita “look IA”: cielos neón, piel de plástico, simetría de postal, oversaturación, HDR agresivo, niebla mágica, render o ilustración.

FORMATO DE SALIDA (obligatorio):
- Exactamente UN párrafo en español, sin saltos de línea, sin viñetas, sin comillas, sin markdown.
- Entre ~400 y 1100 caracteres.
- Debe empezar con: Fotografía hiperrealista y cinematográfica de
- Debe terminar integrando: composición editorial premium, encuadre horizontal amplio, texturas realistas, sin texto ni logos ni ilustración, realismo fotográfico absoluto, portada web de alta conversión.

No escribas nada antes ni después del párrafo.`;

const PROMPT_REFINER_BLOG = `Eres un editor fotográfico obsesionado con el hiperrealismo. Recibirás:
1) un DOSSIER del artículo de blog
2) un primer prompt ya redactado

Tu tarea es REESCRIBIR ese prompt para que parezca todavía más una fotografía real tomada por un fotógrafo profesional.

Prioridades: foto REAL, no arte generativo; rebaja exceso “wellness instagram” o turístico; materiales e imperfecciones creíbles; día luminoso, nada de escenas oscuras ni fantasía.

OBLIGATORIO — variedad y anti-repetición:
- Si el borrador cae SIEMPRE en la misma fórmula (ej. paisaje sin nadie, o siempre espaldas mirando lejos, o siempre bodegón), rompe el patrón: introduce personas si no las hay, o quítalas si siempre salen, o cambia encuadre (cenital, lateral, primer plano).
- Lo clave es que cada portada sea distinta a las demás del blog. Personas SON bienvenidas cuando encajen, pero en poses y encuadres variados: de frente, de perfil, caminando, estirándose, cocinando, leyendo, no solo "contemplando".
- La imagen no debe parecer la misma que otras portadas del listado: busca un ancla visual única para este artículo.

Reglas:
- Mantén coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un párrafo en español, sin comillas, sin markdown, sin viñetas, sin saltos de línea.
- Debe empezar por “Fotografía hiperrealista y cinematográfica de”.
- Devuelve solo el prompt final.`;

const IMAGE_REALISM_TAIL =
  ' Tomada como fotografía real con cámara full frame profesional y óptica de reportaje de alta calidad, luz existente físicamente creíble, color natural y balance de blancos realista, contraste moderado, grano mínimo natural, detalle auténtico en texturas; siempre de día, luminosa y clara, nunca nocturna ni sombría; personas naturales y en actividad real cuando aparezcan; sin HDR agresivo, sin acabado plástico, sin render 3D, sin pintura digital, sin ilustración, sin tipografía ni logotipos.';

async function chatParagraph(apiKey, system, user, temperature) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `OpenAI chat (${res.status})`);
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Respuesta vacía de OpenAI.');
  return raw
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildImagePromptFromBlogDossier(apiKey, dossier) {
  const firstPass = await chatParagraph(apiKey, PROMPT_BUILDER_BLOG, dossier, 0.4);
  const refineUser = ['=== DOSSIER DEL ARTÍCULO ===', dossier, '', '=== PRIMER BORRADOR DEL PROMPT ===', firstPass].join('\n');
  try {
    const refined = await chatParagraph(apiKey, PROMPT_REFINER_BLOG, refineUser, 0.18);
    return refined || firstPass;
  } catch {
    return firstPass;
  }
}

function buildFinalImagePrompt(sceneFromGpt) {
  const scene = sceneFromGpt.replace(/\s+/g, ' ').trim();
  if (scene.length < 200) throw new Error('El prompt de imagen es demasiado corto.');
  const room = 4000 - IMAGE_REALISM_TAIL.length - 2;
  const core = scene.length <= room ? scene : `${scene.slice(0, room - 1).trimEnd()}…`;
  return `${core}${IMAGE_REALISM_TAIL}`.replace(/\s+/g, ' ').trim().slice(0, 4000);
}

async function generateCoverPng(apiKey, prompt) {
  const trimmed = buildFinalImagePrompt(prompt);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: trimmed,
      n: 1,
      size: OPENAI_IMAGE_SIZE,
      quality: OPENAI_IMAGE_QUALITY,
      output_format: 'png',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `OpenAI image (${res.status})`);
  const url = data.data?.[0]?.url;
  const b64 = data.data?.[0]?.b64_json;
  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error('No se pudo descargar la imagen generada.');
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get('content-type') || 'image/png';
    return { buffer: buf, contentType: ct.startsWith('image/') ? ct : 'image/png' };
  }
  if (b64) return { buffer: Buffer.from(b64, 'base64'), contentType: 'image/png' };
  throw new Error('Respuesta de imagen vacía.');
}

function formatInlineDossier(row, alt, contextSnippet) {
  return [
    '=== MINI-DOSSIER: imagen de apoyo dentro de un artículo de blog ===',
    'Genera UN prompt para una fotografía horizontal que sustituya una imagen de stock; debe encajar con el artículo.',
    '',
    `Título: ${String(row.title_es || '').trim()}`,
    `Categoría: ${row.blog_categories?.name_es || 'General'}`,
    `Texto alt / pie original: ${(alt || '').trim() || '(sin alt)'}`,
    `Contexto del párrafo (plano): ${contextSnippet}`,
  ].join('\n\n');
}

async function buildImagePromptForInline(apiKey, dossier) {
  return buildImagePromptFromBlogDossier(apiKey, dossier);
}

/** Extrae <img ...> con src de stock. */
function findStockImgTags(html) {
  if (!html || typeof html !== 'string') return [];
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const srcM = /\bsrc=["']([^"']+)["']/i.exec(tag);
    if (!srcM) continue;
    const src = srcM[1];
    if (!isStockishUrl(src)) continue;
    const altM = /\balt=["']([^"']*)["']/i.exec(tag);
    out.push({ tag, src, alt: altM ? altM[1] : '' });
  }
  return out;
}

function snippetAround(html, index, len = 220) {
  const plain = stripHtml(html.slice(Math.max(0, index - 400), index + 400), len + 200);
  return plain.slice(0, len);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const doInline = args.includes('--inline');
const regenerateBlogAi = args.includes('--regenerate-blog-ai');
const limitArg = args.find((a) => a.startsWith('--limit='));
const concArg = args.find((a) => a.startsWith('--concurrency='));
const idArg = args.find((a) => a.startsWith('--id='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const concurrency = Math.max(1, Math.min(6, concArg ? parseInt(concArg.split('=')[1], 10) || 2 : 2));
const singleId = idArg ? idArg.split('=')[1]?.trim() : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
if (!openaiKey) {
  console.error('OPENAI_API_KEY es obligatoria');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

function isOurBlogAiCoverUrl(u) {
  const s = String(u || '');
  return s.includes('/blog/ai-cover-') || s.includes('/blog/ai-inline-');
}

function shouldRefreshCover(row) {
  if (force) return true;
  const u = row.cover_image_url;
  if (!u || !String(u).trim()) return true;
  if (isStockishUrl(String(u))) return true;
  if (regenerateBlogAi && isOurBlogAiCoverUrl(u)) return true;
  return false;
}

function hasInlineStockImages(row) {
  return findStockImgTags(row.content_es || '').length > 0;
}

/** Incluir artículo en el lote: portada a regenerar, o --inline con <img> stock en el cuerpo. */
function shouldProcessRow(row, inlineFlag) {
  if (shouldRefreshCover(row)) return true;
  if (inlineFlag && hasInlineStockImages(row)) return true;
  return false;
}

async function uploadBlogImage(buffer, contentType, suffix) {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const path = `blog/ai-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error: upErr } = await admin.storage.from('retreat-images').upload(path, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);
  const { data: urlData } = admin.storage.from('retreat-images').getPublicUrl(path);
  if (!urlData?.publicUrl) throw new Error('Sin URL pública');
  return urlData.publicUrl;
}

async function processArticle(row) {
  const label = `${row.title_es || row.slug} (${row.id})`;
  const refreshCover = shouldRefreshCover(row);
  const inlineStock = doInline && hasInlineStockImages(row);

  if (!refreshCover && !inlineStock) {
    return { id: row.id, label, cover: 'skipped (portada ok y sin img stock; usa --force o --inline)' };
  }

  if (dryRun) {
    return { id: row.id, label, cover: 'dry-run', wouldRefreshCover: refreshCover, wouldInline: inlineStock };
  }

  const shortId = String(row.id).replace(/-/g, '').slice(0, 12);
  const update = {};
  let publicUrl = row.cover_image_url;

  if (refreshCover) {
    const dossier = formatBlogCoverDossier(row);
    const prompt = await buildImagePromptFromBlogDossier(openaiKey, dossier);
    const { buffer, contentType } = await generateCoverPng(openaiKey, prompt);
    publicUrl = await uploadBlogImage(buffer, contentType, `cover-${shortId}`);
    update.cover_image_url = publicUrl;
  }

  let content_es = row.content_es;
  let content_en = row.content_en;

  if (doInline && content_es) {
    const tags = findStockImgTags(content_es);
    if (tags.length > 0) {
      const seen = new Set();
      for (const { src, alt } of tags) {
        if (seen.has(src)) continue;
        seen.add(src);
        const idx = content_es.indexOf(src);
        const snippet = idx >= 0 ? snippetAround(content_es, idx) : stripHtml(row.excerpt_es, 200);
        const mini = formatInlineDossier(row, alt, snippet);
        const inlinePrompt = await buildImagePromptForInline(openaiKey, mini);
        const img = await generateCoverPng(openaiKey, inlinePrompt);
        const h = createHash('md5').update(src).digest('hex').slice(0, 10);
        const inlineUrl = await uploadBlogImage(img.buffer, img.contentType, `inline-${shortId}-${h}`);
        content_es = content_es.split(src).join(inlineUrl);
        if (content_en) content_en = content_en.split(src).join(inlineUrl);
      }
      update.content_es = content_es;
      update.content_en = content_en;
    }
  }

  if (Object.keys(update).length === 0) {
    return { id: row.id, label, cover: 'nothing to update' };
  }

  const { error: upErr } = await admin.from('blog_articles').update(update).eq('id', row.id);
  if (upErr) throw new Error(upErr.message);

  return { id: row.id, label, cover: publicUrl, inline: doInline };
}

async function runPool(items, limitWorkers, worker) {
  let next = 0;
  const results = [];
  async function workerFn() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (e) {
        results[i] = { error: e instanceof Error ? e.message : String(e), item: items[i] };
      }
    }
  }
  const n = Math.min(limitWorkers, items.length) || 1;
  await Promise.all(Array.from({ length: n }, workerFn));
  return results;
}

async function main() {
  let q = admin
    .from('blog_articles')
    .select(
      'id, slug, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en, cover_image_url, published_at, blog_categories(name_es)',
    )
    .order('published_at', { ascending: false });

  if (singleId) q = q.eq('id', singleId);

  const { data: rows, error } = await q;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let list = rows || [];
  if (!force) {
    list = list.filter((r) => shouldProcessRow(r, doInline));
  }
  if (limit != null && !Number.isNaN(limit)) list = list.slice(0, limit);

  console.log(
    `Artículos a procesar: ${list.length} (force=${force}, regenerate-blog-ai=${regenerateBlogAi}, inline=${doInline}, concurrency=${concurrency}, dry-run=${dryRun})`,
  );

  const results = await runPool(list, concurrency, async (row) => {
    try {
      const r = await processArticle(row);
      console.log(`OK  ${r.label}`);
      if (r.cover && !String(r.cover).includes('skipped') && !String(r.cover).includes('dry-run')) {
        console.log(`     → ${r.cover}`);
      }
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ERR ${row.title_es || row.slug}: ${msg}`);
      return { error: msg, id: row.id };
    }
  });

  const ok = results.filter((r) => r && !r.error).length;
  const fail = results.filter((r) => r && r.error).length;
  console.log(`\nResumen: ${ok} correctos, ${fail} errores, total ${list.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
