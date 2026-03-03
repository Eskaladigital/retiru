#!/usr/bin/env node
/**
 * Genera descripción con IA para UN centro concreto.
 * Fuentes de datos (por orden de prioridad):
 *   1. Base de datos Retiru (fuente de verdad absoluta)
 *   2. Scraping de la web oficial del centro
 *   3. Google Places API (reseñas reales)
 *
 * Uso:
 *   node scripts/generate-one-description.mjs "Thalassa Pilates Studio"
 *   node scripts/generate-one-description.mjs --id <uuid>
 *   node scripts/generate-one-description.mjs --slug <slug>
 *   node scripts/generate-one-description.mjs "Thalassa" --force   (sobrescribe aunque ya tenga)
 *   node scripts/generate-one-description.mjs "Thalassa" --dry-run (muestra sin guardar)
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const cleanArgs = args.filter((a) => !a.startsWith('--'));

const idIdx = args.indexOf('--id');
const slugIdx = args.indexOf('--slug');
const searchId = idIdx !== -1 ? args[idIdx + 1] : null;
const searchSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;
const searchName = !searchId && !searchSlug ? cleanArgs[0] : null;

if (!searchId && !searchSlug && !searchName) {
  console.error('Uso: node scripts/generate-one-description.mjs "Nombre del centro"');
  console.error('     node scripts/generate-one-description.mjs --id <uuid>');
  console.error('     node scripts/generate-one-description.mjs --slug <slug>');
  process.exit(1);
}

const SYSTEM_PROMPT = `Eres un redactor profesional para Retiru, plataforma de retiros y centros de bienestar en España.
Tu tarea: escribir una descripción COMPLETA y ENRIQUECIDA del centro de 800 a 1200 palabras, en español.

Estructura sugerida:
1. **Introducción**: Presentar el centro, ubicación, filosofía o especialidad.
2. **Servicios y oferta**: Detallar clases, disciplinas, tratamientos. Destacar qué hace único al centro.
3. **Reseñas y reputación**: SOLO si hay reseñas reales en el contexto, intégralas literalmente.
4. **Ambiente e instalaciones**: SOLO si la web del centro o las reseñas mencionan datos concretos.
5. **Cierre**: Invitación a visitar o contacto, tono cercano.

REGLAS ABSOLUTAS E INQUEBRANTABLES:
- Basa tu descripción EXCLUSIVAMENTE en los datos proporcionados en el contexto.
- La sección "DATOS OFICIALES" es la fuente de verdad. Si dice "14 reseñas", escribe EXACTAMENTE "14 reseñas".
- La sección "CONTENIDO WEB OFICIAL" es la fuente principal de información. Si la web dice que los fundadores se llaman Isabel y Javier, úsalo. Si NO menciona nombres, NO inventes nombres.
- PROHIBIDO TERMINANTEMENTE inventar: nombres de personas, cifras, estadísticas, certificaciones, premios, horarios, precios o cualquier dato que NO esté en el contexto.
- Si un dato no aparece en el contexto, OMÍTELO. Es infinitamente mejor una descripción más corta que una descripción con datos inventados.
- Las reseñas de la sección "RESEÑAS REALES DE GOOGLE" son textos literales de usuarios. Puedes parafrasearlas pero NO inventes reseñas adicionales.
- Tono: profesional, cercano, premium. Sin exagerar ni usar superlativos vacíos.
- Longitud: entre 800 y 1200 palabras. Párrafos bien estructurados.`;

// ─── Scraping web del centro ────────────────────────────────────────────────

function stripHtml(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

async function scrapeWebsite(url) {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Retiru/1.0; +https://www.retiru.com)',
        'Accept': 'text/html',
        'Accept-Language': 'es,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    const text = stripHtml(html);
    return text.length > 50 ? text.slice(0, 4000) : null;
  } catch (e) {
    console.log(`    [web] ${e.message}`);
    return null;
  }
}

// ─── Google Places API: reseñas reales ──────────────────────────────────────

async function fetchGoogleReviews(placeId) {
  if (!GOOGLE_PLACES_KEY || !placeId) return null;
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&languageCode=es`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
          'X-Goog-FieldMask': 'reviews',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.reviews?.length) return null;
    return data.reviews
      .slice(0, 5)
      .map((r) => {
        const author = r.authorAttribution?.displayName || 'Usuario';
        const rating = r.rating || '';
        const text = r.text?.text || r.originalText?.text || '';
        if (!text) return null;
        return `- ${author} (${rating}/5): "${text.slice(0, 300)}"`;
      })
      .filter(Boolean)
      .join('\n');
  } catch (e) {
    console.log(`    [reviews] ${e.message}`);
    return null;
  }
}

// ─── Construir contexto completo ────────────────────────────────────────────

async function fetchContext(center) {
  const parts = [];

  // 1. DATOS OFICIALES DE LA BD (fuente de verdad absoluta)
  const official = [];
  official.push(`Nombre: ${center.name}`);
  official.push(`Ciudad: ${center.city}, ${center.province}`);
  if (center.address) official.push(`Dirección: ${center.address}`);
  if (center.phone) official.push(`Teléfono: ${center.phone}`);
  if (center.website) official.push(`Web: ${center.website}`);
  if (center.avg_rating) official.push(`Puntuación Google: ${center.avg_rating} sobre 5`);
  if (center.review_count != null) official.push(`Número EXACTO de reseñas en Google: ${center.review_count}`);
  if (center.type) official.push(`Tipo: ${center.type}`);
  const services = center.services_es?.length ? center.services_es.join(', ') : null;
  if (services) official.push(`Servicios: ${services}`);
  parts.push('## DATOS OFICIALES DE LA BASE DE DATOS (fuente de verdad, cifras EXACTAS):\n' + official.join('\n'));

  // 2. SCRAPING WEB OFICIAL (fuente principal de contenido)
  if (center.website) {
    console.log(`    [web] Scrapeando ${center.website}...`);
    const webContent = await scrapeWebsite(center.website);
    if (webContent) {
      parts.push('## CONTENIDO WEB OFICIAL DEL CENTRO (extraído directamente de su web):\n' + webContent);
    } else {
      console.log('    [web] No se pudo extraer contenido');
    }
  }

  // 3. RESEÑAS REALES DE GOOGLE (via Google Places API)
  if (center.google_place_id) {
    console.log(`    [reviews] Obteniendo reseñas de Google Places...`);
    const reviews = await fetchGoogleReviews(center.google_place_id);
    if (reviews) {
      parts.push('## RESEÑAS REALES DE GOOGLE (textos literales de usuarios):\n' + reviews);
    } else {
      console.log('    [reviews] Sin reseñas disponibles');
    }
  }

  return parts.join('\n\n');
}

// ─── Generar descripción con OpenAI ─────────────────────────────────────────

async function generateDescription(center) {
  const context = await fetchContext(center);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Genera la descripción enriquecida (800-1200 palabras) para este centro:\n\n${context}` },
      ],
      max_tokens: 2400,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

// ── Buscar el centro ──
let query = supabase.from('centers').select(
  'id, name, slug, city, province, type, services_es, description_es, avg_rating, review_count, website, phone, address, google_place_id'
);

if (searchId) {
  query = query.eq('id', searchId);
} else if (searchSlug) {
  query = query.eq('slug', searchSlug);
} else {
  query = query.ilike('name', `%${searchName}%`);
}

const { data: results, error } = await query;

if (error) {
  console.error('Error buscando centro:', error.message);
  process.exit(1);
}

if (!results?.length) {
  console.error(`No se encontró ningún centro con: ${searchId || searchSlug || searchName}`);
  process.exit(1);
}

if (results.length > 1) {
  console.log(`Se encontraron ${results.length} centros:`);
  results.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.city}) [${c.slug}]`));
  console.log('\nUsa --id o --slug para ser más específico.');
  process.exit(1);
}

const center = results[0];
const currentDesc = (center.description_es || '').trim();

console.log(`\n═══ GENERAR DESCRIPCIÓN ═══`);
console.log(`Centro:  ${center.name}`);
console.log(`Ciudad:  ${center.city}, ${center.province}`);
console.log(`Slug:    ${center.slug}`);
console.log(`Web:     ${center.website || '—'}`);
console.log(`PlaceID: ${center.google_place_id || '—'}`);
console.log(`Rating:  ${center.avg_rating || '—'} (${center.review_count || 0} reseñas)`);
console.log(`Desc actual: ${currentDesc.length} caracteres\n`);

if (currentDesc.length >= 400 && !FORCE) {
  console.log('⚠ Este centro ya tiene descripción (≥400 chars). Usa --force para sobrescribir.');
  process.exit(0);
}

console.log('Generando descripción con IA...\n');

const t0 = Date.now();
const desc = await generateDescription(center);

if (!desc) {
  console.error('No se generó contenido.');
  process.exit(1);
}

const words = desc.split(/\s+/).length;
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

if (DRY_RUN) {
  console.log('── PREVIEW (dry-run, no se guarda) ──\n');
  console.log(desc);
  console.log(`\n── ${words} palabras · ${elapsed}s ──`);
} else {
  const now = new Date().toISOString();
  const { error: upErr } = await supabase.from('centers').update({
    description_es: desc,
    description_ai_generated_at: now,
    updated_at: now,
  }).eq('id', center.id);

  if (upErr) {
    console.error('Error al guardar:', upErr.message);
    process.exit(1);
  }

  console.log(`✅ Descripción guardada: ${words} palabras (${elapsed}s)`);
}
