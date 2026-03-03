#!/usr/bin/env node
/**
 * Genera descripciones con IA para TODOS los centros sin descripción.
 * Fuentes de datos (por orden de prioridad):
 *   1. Base de datos Retiru (fuente de verdad absoluta)
 *   2. Scraping de la web oficial del centro
 *   3. Google Places API (reseñas reales)
 *
 * Uso:  node scripts/generate-all-descriptions.mjs [--limit N] [--dry-run] [--force]
 *   --force  Regenera TODAS las descripciones (incluidas las existentes)
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
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const MIN_DESC = 400;

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
  } catch {
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
  } catch {
    return null;
  }
}

// ─── Construir contexto completo ────────────────────────────────────────────

async function fetchContext(center) {
  const parts = [];

  // 1. DATOS OFICIALES DE LA BD
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

  // 2. SCRAPING WEB OFICIAL
  if (center.website) {
    const webContent = await scrapeWebsite(center.website);
    if (webContent) {
      parts.push('## CONTENIDO WEB OFICIAL DEL CENTRO (extraído directamente de su web):\n' + webContent);
    }
  }

  // 3. RESEÑAS REALES DE GOOGLE
  if (center.google_place_id) {
    const reviews = await fetchGoogleReviews(center.google_place_id);
    if (reviews) {
      parts.push('## RESEÑAS REALES DE GOOGLE (textos literales de usuarios):\n' + reviews);
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

// ── Main ──
const { data: centers } = await supabase
  .from('centers')
  .select('id, name, slug, city, province, type, services_es, description_es, avg_rating, review_count, website, phone, address, google_place_id');

let toProcess = (centers || []).filter((c) => {
  if (FORCE) return true;
  const desc = (c.description_es || '').trim();
  return desc.length < MIN_DESC;
});

if (LIMIT > 0) toProcess = toProcess.slice(0, LIMIT);

console.log(`\n═══ GENERAR DESCRIPCIONES CON IA ═══`);
console.log(`Fuentes: Web del centro + Google Places API + BD`);
console.log(`Centros a procesar: ${toProcess.length}${FORCE ? ' (FORCE: regenerar todas)' : ''}${LIMIT ? ` (limitado a ${LIMIT})` : ''}`);
if (DRY_RUN) console.log('DRY RUN — no se guardarán cambios\n');
else console.log('');

let ok = 0, errors = 0;
const startTime = Date.now();

for (let i = 0; i < toProcess.length; i++) {
  const c = toProcess[i];
  const t0 = Date.now();
  process.stdout.write(`[${i + 1}/${toProcess.length}] ${c.name} (${c.city})... `);

  try {
    const desc = await generateDescription(c);
    if (!desc) throw new Error('Sin contenido');

    const words = desc.split(/\s+/).length;

    if (!DRY_RUN) {
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('centers').update({
        description_es: desc,
        description_ai_generated_at: now,
        updated_at: now,
      }).eq('id', c.id);
      if (upErr) throw upErr;
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ ${words} palabras (${elapsed}s)`);
    ok++;
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✗ ${err.message} (${elapsed}s)`);
    errors++;

    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      console.log('  Rate limit — esperando 30s...');
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
}

const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n═══ RESULTADO ═══`);
console.log(`✓ ${ok} generados | ✗ ${errors} errores | ${totalTime} min`);
