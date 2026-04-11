#!/usr/bin/env node
/**
 * Genera portadas con IA (GPT + GPT Image 1.5) para retiros sin filas en retreat_images.
 * Usa .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Uso:
 *   node scripts/backfill-retreat-covers-ai.mjs           # todos los que falten
 *   node scripts/backfill-retreat-covers-ai.mjs --dry-run
 *   node scripts/backfill-retreat-covers-ai.mjs --limit 4
 *   node scripts/backfill-retreat-covers-ai.mjs --replace-ai-covers  # borra URLs .../retreats/ai-* y regenera quedes sin foto
 */
import { readFileSync, existsSync } from 'fs';
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
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
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

const MAX_DESCRIPTION_CHARS = 2800;
const MAX_SCHEDULE_CHARS = 1200;
const OPENAI_IMAGE_MODEL = 'gpt-image-1.5';
const OPENAI_IMAGE_SIZE = '1536x1024';
const OPENAI_IMAGE_QUALITY = 'high';

/** SYNC: src/lib/openai/event-cover-image.ts (formatEventCoverUserBrief + PROMPT_BUILDER_SYSTEM + buildFinalDallePrompt) */

function trimLines(arr) {
  return (arr || []).map((s) => String(s).trim()).filter(Boolean);
}

function formatScheduleForBrief(days) {
  if (!days || !Array.isArray(days) || days.length === 0) return '';
  const lines = [];
  for (const d of days.slice(0, 5)) {
    const dayLabel = d.day != null ? `Día ${d.day}` : 'Día';
    const dayTitle = String(d.title_es || d.title || '').trim();
    lines.push(dayTitle ? `${dayLabel}: ${dayTitle}` : dayLabel);
    const items = d.items || [];
    for (const it of items.slice(0, 6)) {
      const act = String(it.title_es || it.activity || '').trim();
      const t = String(it.time || '').trim();
      if (act) lines.push(t ? `  ${t} — ${act}` : `  ${act}`);
    }
  }
  const t = lines.join('\n').trim();
  return t.length > MAX_SCHEDULE_CHARS ? `${t.slice(0, MAX_SCHEDULE_CHARS)}…` : t;
}

function inferSeasonHintFromStartDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return undefined;
  const m = parseInt(iso.slice(5, 7), 10);
  if (Number.isNaN(m)) return undefined;
  if (m >= 3 && m <= 5) return 'Estación inferida (fecha inicio, hemisferio norte): primavera.';
  if (m >= 6 && m <= 8) return 'Estación inferida (fecha inicio, hemisferio norte): verano.';
  if (m >= 9 && m <= 11) return 'Estación inferida (fecha inicio, hemisferio norte): otoño.';
  return 'Estación inferida (fecha inicio, hemisferio norte): invierno.';
}

function nightsBetween(start, end) {
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}/.test(start) || !/^\d{4}-\d{2}-\d{2}/.test(end)) return undefined;
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return undefined;
  const days = Math.round((b - a) / 86400000) + 1;
  return Math.max(1, days) - 1;
}

function formatEventCoverUserBrief(input) {
  const desc = String(input.description_es || '').slice(0, MAX_DESCRIPTION_CHARS);
  const descEn = String(input.description_en || '').trim().slice(0, 1200);
  const parts = [];

  parts.push(
    '=== DOSSIER DEL EVENTO (úsalo entero; prioriza coherencia geográfica y temática) ===',
    'Tu salida final será SOLO el párrafo-prompt para el modelo de imagen, no resúmenes de este dossier.',
  );

  parts.push(`Título (ES): ${String(input.title_es).trim()}`);
  parts.push(`Resumen (ES): ${String(input.summary_es).trim()}`);
  parts.push(`Descripción (ES):\n${desc}`);

  if (String(input.title_en || '').trim()) parts.push(`Título (EN): ${String(input.title_en).trim()}`);
  if (String(input.summary_en || '').trim()) parts.push(`Resumen (EN): ${String(input.summary_en).trim()}`);
  if (descEn) parts.push(`Descripción (EN, extracto):\n${descEn}`);

  const geo = [];
  if (String(input.destination_label || '').trim()) geo.push(`Destino Retiru: ${String(input.destination_label).trim()}`);
  if (String(input.address || '').trim()) geo.push(`Dirección / zona: ${String(input.address).trim()}`);
  if (input.start_date) geo.push(`Fecha inicio: ${input.start_date}`);
  if (input.end_date) geo.push(`Fecha fin: ${input.end_date}`);
  const nights = nightsBetween(input.start_date, input.end_date);
  if (nights != null) geo.push(`Duración aproximada: ${nights === 0 ? 'mismo día / jornada' : `${nights} noche(s) de experiencia`}`);
  const season = inferSeasonHintFromStartDate(input.start_date);
  if (season) geo.push(season);
  if (geo.length) parts.push(`--- Geografía, calendario y clima ambiente ---\n${geo.join('\n')}`);

  const cats = trimLines(input.category_labels).slice(0, 10);
  if (cats.length) parts.push(`--- Categorías (temática) ---\n${cats.join(', ')}`);

  const inc = trimLines(input.includes_es);
  if (inc.length) parts.push(`--- Incluye (objetos, alojamiento, comidas, materiales que puedan verse) ---\n${inc.join('; ')}`);

  const exc = trimLines(input.excludes_es);
  if (exc.length) parts.push(`--- No incluye (no mostrar como protagonista) ---\n${exc.join('; ')}`);

  const sch = formatScheduleForBrief(input.schedule);
  if (sch) parts.push(`--- Programa (extracto: arquetipos de escena) ---\n${sch}`);

  const lang = trimLines(input.languages);
  if (lang.length) parts.push(`Idiomas del evento: ${lang.join(', ')}`);

  parts.push(
    '',
    '--- Variedad visual (obligatorio) ---',
    'Cada portada debe sentirse única. Elige al AZAR uno de estos tipos de escena según el retiro:',
    '  A) Personas haciendo la actividad (yoga, meditación, caminata, taller…): de frente, de lado, en movimiento, manos en detalle, en interior o exterior.',
    '  B) Entorno / paisaje / arquitectura SIN personas: sala preparada con luz, patio, terraza, jardín, costa, montaña.',
    '  C) Bodegón editorial: alimentos del retiro, materiales del taller, cuencos, textiles, aceites.',
    '  D) Detalle / primer plano: manos sobre arcilla, pies en arena, esterilla, texturas del lugar.',
    '  E) Persona sola en acción: estiramiento, lectura, paseo, preparación. Rostro visible o no, pero natural.',
    '  F) Vista aérea / cenital: mesa preparada, círculo de cojines, jardín desde arriba.',
    'Lo importante es que NO haya un patrón reconocible si se ven varias portadas juntas.',
  );

  return parts.join('\n\n');
}

const PROMPT_BUILDER_SYSTEM = `Eres un agente senior: director de arte + location scout + especialista en prompts para generación de imágenes fotorrealistas. Recibes un DOSSIER COMPLETO de un retiro (geografía, fechas, categorías, textos, programa, incluidos). Tu ÚNICA salida es UN párrafo en español que el modelo de imagen usará tal cual: debe ser la mejor posible.

ANTES de escribir (mentalmente, no lo imprimas): (1) Elige el escenario visual más específico y honesto con el dossier — no un “paraíso genérico”. (2) Conecta TEMÁTICA: yoga/meditación/cerámica/ayurveda/círculo/mar/desierto/montaña según categorías + descripción + programa + incluidos. (3) Elige UNA luz creíble de día (mañana luminosa, media mañana, tarde clara o golden hour todavía alta) coherente con estación y región si el dossier lo permite. (4) Añade 2–4 sustantivos CONCRETOS de textura o material (adobe, lino, arcilla, corcho, sal, musgo, dunas, olivos…) alineados con el lugar y la actividad, no adjetivos vacíos. (5) Si hay conflicto entre campos, prima descripción + título + destino sobre suposiciones. (6) Piensa como si un fotógrafo profesional estuviera físicamente allí con una cámara full frame de alta gama haciendo una foto real para una portada editorial, no como si estuviera “creando arte”. (7) VARÍA el encuadre: no uses por defecto el tópico “grupo mirando horizonte”.

REGLAS DURAS:
- Geografía: respeta destino/dirección/fechas/estación inferida; no inventes monumentos ni ciudades nombradas si no salen en el dossier.
- Luz/horario: PROHIBIDO noche, anochecer oscuro, hora azul, sol ya puesto, amanecer antes de salir el sol o escenas subexpuestas. La foto debe sentirse tomada con luz natural real entre las 09:00 y las 20:30 de horario de verano del sur de España: luminosa, clara y usable como portada.
- Público: si el texto indica solo mujeres u otro colectivo, respétalo; si no, grupo mixto o sin género explícito, sin estereotipos.
- Variedad: el dossier incluye opciones A-F de tipo de escena. Elige la que mejor encaje con ESTE retiro; las personas PUEDEN y DEBEN aparecer a menudo si el retiro es de práctica (yoga, meditación, taller), pero varía la composición: de frente, de lado, en acción, en interior, una sola persona, pequeño grupo activo, primer plano de manos. Lo que NO debe repetirse es siempre el mismo encuadre.
- Personas cuando aparezcan: naturales, en actividad real, no posadas. Rostros pueden verse si es creíble. Nunca celebridades.
- Prohibido en la escena: texto legible, logotipos, carteles, móviles como foco, marcas, datos de contacto.
- Evita “look IA”: cielos neón, piel de plástico, simetría de postal barata, oversaturación, HDR agresivo, tonos morados irreales, niebla mágica, render/pintura/ilustración, perfección plástica, piel suavizada, brillo artificial, composición imposible o escenografía de fantasía, sombras excesivamente cerradas o escenas tenebrosas.

FORMATO DE SALIDA (obligatorio):
- Exactamente UN párrafo en español, sin saltos de línea, sin viñetas, sin comillas, sin markdown.
- Entre ~400 y 1100 caracteres: denso y cinematográfico, pero fotográfico (no guion de película).
- Debe empezar con: Fotografía hiperrealista y cinematográfica de
- Debe terminar integrando (en la misma frase final o penúltima) la idea de: composición editorial premium, fotografía de viaje y bienestar de lujo, profundidad de campo natural, texturas realistas, encuadre horizontal amplio, sin texto ni logos ni ilustración, realismo fotográfico absoluto, portada web de alta conversión.
- La redacción debe sonar a encargo fotográfico real: cámara profesional, luz existente, color natural, detalles imperfectos creíbles y atmósfera auténtica.

No escribas nada antes ni después del párrafo.`;

const PROMPT_REALISM_REFINER_SYSTEM = `Eres un editor fotográfico obsesionado con el hiperrealismo. Recibirás:
1) un DOSSIER del evento
2) un primer prompt ya redactado

Tu tarea es REESCRIBIR ese prompt para que parezca todavía más una fotografía real tomada por un fotógrafo profesional en localización real.

Prioridades:
- La imagen debe parecer una FOTO REAL, no arte generativo.
- Si el borrador suena demasiado bonito, demasiado escenificado, demasiado “wellness instagram”, demasiado simétrico o demasiado turístico, rebájalo.
- Da prioridad a entorno real, luz existente, materiales concretos, imperfecciones creíbles, composición editorial contenida.
- Si las personas no son imprescindibles para comunicar el retiro, reduce su protagonismo o déjalas lejanas/secundarias. Si aparecen, nada de poses artificiales ni expresiones de anuncio.
- Si el borrador cae siempre en la misma fórmula, rompe el patrón: introduce personas si no las hay, o quítalas si siempre salen, o cambia encuadre. Personas SON bienvenidas cuando encajen, en poses y encuadres variados.
- Corrige cualquier tendencia a oscuridad excesiva: nada de noche, nada de sol escondido, nada de cielos dramáticos oscuros; debe sentirse una franja luminosa y comercialmente útil de día.
- Evita cualquier sensación de fantasía, exceso de color, teatralidad, glow, piel plástica, postal irreal o escena de catálogo falso.

Reglas:
- Mantén coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un párrafo en español, sin comillas, sin markdown, sin viñetas, sin saltos de línea.
- Debe empezar por “Fotografía hiperrealista y cinematográfica de”.
- Debe sonar a encargo fotográfico premium real, no a instrucción artística abstracta.
- No añadas explicaciones sobre lo que has cambiado. Devuelve solo el prompt final.`;

const IMAGE_REALISM_TAIL =
  ' Tomada como fotografía real con cámara full frame profesional y óptica de reportaje de alta calidad, luz existente físicamente creíble, color natural y balance de blancos realista, contraste moderado, grano mínimo natural, detalle auténtico en piel, telas, arena, piedra, vegetación o arquitectura según la escena; siempre de día, luminosa y clara, nunca nocturna ni sombría, con sensación de franja útil entre 09:00 y 20:30 de verano del sur de España; personas naturales y en actividad real cuando aparezcan; sin HDR agresivo, sin acabado plástico, sin render 3D, sin pintura digital, sin ilustración, sin tipografía ni logotipos.';

async function buildDallePromptFromEvent(apiKey, input) {
  const userContent = formatEventCoverUserBrief(input);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.32,
      max_tokens: 900,
      messages: [
        { role: 'system', content: PROMPT_BUILDER_SYSTEM },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI chat error (${res.status})`);
  }

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No se pudo generar el prompt de imagen.');

  const firstPass = raw
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const realismReviewUserContent = [
    '=== DOSSIER DEL EVENTO ===',
    userContent,
    '',
    '=== PRIMER BORRADOR DEL PROMPT ===',
    firstPass,
  ].join('\n');

  const refineRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.18,
      max_tokens: 900,
      messages: [
        { role: 'system', content: PROMPT_REALISM_REFINER_SYSTEM },
        { role: 'user', content: realismReviewUserContent },
      ],
    }),
  });

  const refineData = await refineRes.json().catch(() => ({}));
  if (!refineRes.ok) {
    throw new Error(refineData.error?.message || `OpenAI refine error (${refineRes.status})`);
  }

  const refined = refineData.choices?.[0]?.message?.content?.trim();
  if (!refined) return firstPass;

  return refined
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildFinalImagePrompt(sceneFromGpt) {
  const scene = sceneFromGpt.replace(/\s+/g, ' ').trim();
  if (scene.length < 200) throw new Error('El prompt de imagen es demasiado corto.');
  const room = 4000 - IMAGE_REALISM_TAIL.length - 2;
  const core = scene.length <= room ? scene : scene.slice(0, room - 1).trimEnd() + '…';
  return `${core}${IMAGE_REALISM_TAIL}`.replace(/\s+/g, ' ').trim().slice(0, 4000);
}

function retreatRowToBrief(r) {
  const dest = r.destinations;
  const destination_label = dest && typeof dest === 'object' && dest.name_es ? String(dest.name_es) : undefined;
  const rc = r.retreat_categories || [];
  const category_labels = rc
    .map((row) => (row.categories && row.categories.name_es ? String(row.categories.name_es) : ''))
    .filter(Boolean);
  return {
    title_es: r.title_es,
    summary_es: r.summary_es,
    description_es: String(r.description_es || '').trim() || r.summary_es,
    title_en: r.title_en || undefined,
    summary_en: r.summary_en || undefined,
    description_en: r.description_en || undefined,
    destination_label,
    address: r.address || undefined,
    start_date: r.start_date,
    end_date: r.end_date,
    category_labels: category_labels.length ? category_labels : undefined,
    includes_es: Array.isArray(r.includes_es) ? r.includes_es.filter(Boolean) : undefined,
    excludes_es: Array.isArray(r.excludes_es) ? r.excludes_es.filter(Boolean) : undefined,
    schedule: Array.isArray(r.schedule) ? r.schedule : null,
    languages: Array.isArray(r.languages) ? r.languages : undefined,
  };
}

async function generateDalle3CoverImage(apiKey, prompt) {
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
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI image error (${res.status})`);
  }

  const url = data.data?.[0]?.url;
  const b64 = data.data?.[0]?.b64_json;

  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error('No se pudo descargar la imagen generada.');
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get('content-type') || 'image/png';
    return { buffer: buf, contentType: ct.startsWith('image/') ? ct : 'image/png' };
  }

  if (b64) {
    return { buffer: Buffer.from(b64, 'base64'), contentType: 'image/png' };
  }

  throw new Error('Respuesta de imagen vacía de OpenAI.');
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const replaceAiCovers = args.includes('--replace-ai-covers');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
if (!openaiKey) {
  console.error('OPENAI_API_KEY es obligatoria');
  process.exit(1);
}

const admin = createClient(url, key);

async function main() {
  if (replaceAiCovers) {
    const { data: allImgs, error: listErr } = await admin.from('retreat_images').select('id, retreat_id, url');
    if (listErr) {
      console.error('Error leyendo retreat_images:', listErr.message);
      process.exit(1);
    }
    const aiImgs = (allImgs || []).filter((r) => typeof r.url === 'string' && r.url.includes('/retreats/ai-'));
    console.log(`Portadas con ruta retreats/ai-*: ${aiImgs.length}${dryRun ? ' (dry-run, no se borra)' : ''}`);
    if (!dryRun) {
      for (const row of aiImgs) {
        const { error: delErr } = await admin.from('retreat_images').delete().eq('id', row.id);
        if (delErr) console.error('  No se pudo borrar', row.id, delErr.message);
      }
    }
  }

  const { data: imgRows, error: imgErr } = await admin.from('retreat_images').select('retreat_id');
  if (imgErr) {
    console.error('Error leyendo retreat_images:', imgErr.message);
    process.exit(1);
  }

  const withImage = new Set((imgRows || []).map((r) => r.retreat_id));

  const { data: retreats, error: rErr } = await admin
    .from('retreats')
    .select(
      `id, slug, status,
      title_es, title_en, summary_es, summary_en, description_es, description_en,
      start_date, end_date, destination_id, address, includes_es, excludes_es, schedule, languages,
      destinations(name_es),
      retreat_categories(categories(name_es))`,
    )
    .order('created_at', { ascending: true });

  if (rErr) {
    console.error('Error leyendo retreats:', rErr.message);
    process.exit(1);
  }

  let missing = (retreats || []).filter((r) => !withImage.has(r.id));

  if (limit != null && !Number.isNaN(limit)) {
    missing = missing.slice(0, limit);
  }

  console.log(`Retiros sin imágenes: ${missing.length}${dryRun ? ' (dry-run)' : ''}`);

  for (const r of missing) {
    if (!r.title_es?.trim() || !r.summary_es?.trim()) {
      console.warn(`Saltando ${r.slug}: falta título o resumen`);
      continue;
    }

    console.log(`\n→ ${r.title_es} (${r.slug}) [${r.status}]`);

    if (dryRun) {
      console.log('  (dry-run, no se llama a OpenAI)');
      continue;
    }

    try {
      const dallePrompt = await buildDallePromptFromEvent(openaiKey, retreatRowToBrief(r));
      const { buffer, contentType } = await generateDalle3CoverImage(openaiKey, dallePrompt);

      const ext = contentType.includes('png') ? 'png' : 'jpg';
      const path = `retreats/ai-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await admin.storage.from('retreat-images').upload(path, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

      if (upErr) {
        console.error('  Storage:', upErr.message);
        continue;
      }

      const { data: urlData } = admin.storage.from('retreat-images').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: insErr } = await admin.from('retreat_images').insert({
        retreat_id: r.id,
        url: publicUrl,
        is_cover: true,
        sort_order: 0,
      });

      if (insErr) {
        console.error('  Insert retreat_images:', insErr.message);
        continue;
      }

      console.log('  OK:', publicUrl);
    } catch (e) {
      console.error('  Error:', e instanceof Error ? e.message : e);
    }
  }

  console.log('\nListo.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
