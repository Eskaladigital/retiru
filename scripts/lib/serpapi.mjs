// scripts/lib/serpapi.mjs
//
// Cliente ligero de SerpApi (https://serpapi.com) para alimentar el generador
// de contenido SEO por secciones (§8.8 docs/SEO-LANDINGS.md).
//
// Captura de cada query:
//   - people_also_ask  → alimenta FAQ (7-10 preguntas reales).
//   - related_searches → keywords long-tail para el prompt.
//   - local_results    → valida nombres de centros en Google Maps.
//   - answer_box / featured_snippet → intent dominante.
//
// CACHE: las respuestas se guardan en `.cache/serp/<sha1>.json` con TTL 30 días.
// Si una landing se regenera dentro del TTL, no gasta créditos de SerpApi.

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', '.cache', 'serp');
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

function cacheKey(params) {
  const s = JSON.stringify(params, Object.keys(params).sort());
  return createHash('sha1').update(s).digest('hex');
}

function readCache(key) {
  const p = join(CACHE_DIR, `${key}.json`);
  if (!existsSync(p)) return null;
  try {
    const st = statSync(p);
    if (Date.now() - st.mtimeMs > TTL_MS) return null;
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  const p = join(CACHE_DIR, `${key}.json`);
  try {
    writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn(`[serpapi] no se pudo escribir cache (${p}):`, e.message);
  }
}

/**
 * Consulta Google vía SerpApi.
 *
 * @param {object} opts
 * @param {string} opts.query     Query literal (p.ej. "centros de ayurveda Álava")
 * @param {string} [opts.location] Ubicación (p.ej. "Spain", "Madrid, Spain")
 * @param {string} [opts.hl]       Idioma (default 'es')
 * @param {string} [opts.gl]       País (default 'es')
 * @param {string} [opts.googleDomain] Dominio (default 'google.es')
 * @param {boolean} [opts.force]  Si true, ignora caché.
 * @returns {Promise<{
 *   paa: Array<{question:string, snippet?:string}>,
 *   related: string[],
 *   local_pack: Array<{name:string, rating?:number, reviews?:number, type?:string}>,
 *   featured_snippet: string|null,
 *   answer_box: string|null,
 *   query: string,
 *   fetched_at: string,
 *   from_cache: boolean
 * }>}
 */
export async function serpSearch({
  query,
  location = 'Spain',
  hl = 'es',
  gl = 'es',
  googleDomain = 'google.es',
  force = false,
} = {}) {
  if (!query) throw new Error('serpSearch: query es obligatoria');
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY no definida en .env.local');

  const params = { engine: 'google', q: query, location, hl, gl, google_domain: googleDomain };
  const key = cacheKey(params);

  if (!force) {
    const cached = readCache(key);
    if (cached) return { ...cached, from_cache: true };
  }

  const url = new URL('https://serpapi.com/search.json');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('no_cache', 'false');

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SerpApi ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();

  const paa = (json.related_questions || []).map((q) => ({
    question: q.question || '',
    snippet: q.snippet || q.answer || null,
  })).filter((q) => q.question);

  const related = (json.related_searches || []).map((r) => r.query).filter(Boolean);

  const local_pack = (json.local_results?.places || []).slice(0, 10).map((p) => ({
    name: p.title || p.name || '',
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
    type: p.type || p.category || null,
    address: p.address || null,
  })).filter((p) => p.name);

  const featured_snippet = json.answer_box?.snippet
    || json.answer_box?.answer
    || json.featured_snippet?.snippet
    || null;

  const answer_box = json.answer_box?.answer || null;

  const normalized = {
    paa,
    related,
    local_pack,
    featured_snippet,
    answer_box,
    query,
    params: { hl, gl, location, googleDomain },
    fetched_at: new Date().toISOString(),
  };

  writeCache(key, normalized);
  return { ...normalized, from_cache: false };
}

/**
 * Variante simplificada para queries locales: añade automáticamente la ubicación.
 * Ej. serpLocalCenters({ type: 'ayurveda', province: 'Álava' })
 *     → query="centros de ayurveda en Álava", location="Álava, Spain"
 */
export async function serpLocalCenters({ type, province, city = null, style = null, locale = 'es' }) {
  const typeLabel = locale === 'es'
    ? { yoga: 'yoga', meditation: 'meditación', ayurveda: 'ayurveda' }[type] || type
    : type;

  const place = city ? `${city}, ${province}` : province;
  const query = locale === 'es'
    ? (style
        ? `centros de ${typeLabel} ${style} en ${place}`
        : `centros de ${typeLabel} en ${place}`)
    : (style
        ? `${type} ${style} centers in ${place}`
        : `${type} centers in ${place}`);

  const location = locale === 'es' ? `${province}, Spain` : `${province}, Spain`;
  return serpSearch({ query, location, hl: locale, gl: 'es', googleDomain: 'google.es' });
}
