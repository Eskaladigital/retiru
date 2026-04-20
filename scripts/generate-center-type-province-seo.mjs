#!/usr/bin/env node
/**
 * Genera (o regenera) contenido SEO editorial para las landings:
 *   · PROVINCIAL: /es/centros/[tipo]/[provincia]      (+ espejo /en/centers/...)
 *   · CIUDAD:     /es/centros/[tipo]/[provincia]/[ciudad] (+ espejo)
 *
 * Para cada par/terna con al menos N centros activos:
 *  1. Construye un dossier (tipo, provincia, ciudad?, nº centros, muestras).
 *  2. Pide a GPT-4o un JSON estructurado con:
 *       intro_es, intro_en  (HTML breve, 2-3 párrafos, 220-320 palabras)
 *       meta_title_es, meta_title_en  (50-60 chars, sin años)
 *       meta_description_es, meta_description_en  (150-160 chars, sin años)
 *       faq_es, faq_en  (5 preguntas cada uno, locales y específicas)
 *  3. Hace upsert en la tabla center_type_province_seo
 *     (clave: (type, province_slug, city_slug) — city_slug puede ser NULL).
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Uso:
 *   npm run seo:type-province                      # provincial (default)
 *   npm run seo:type-province -- --city            # solo landings ciudad (≥2 centros)
 *   npm run seo:type-province -- --all             # provincial + ciudad
 *   npm run seo:type-province:dry                  # dry-run
 *   npm run seo:type-province -- --force           # regenera todas las filas afectadas
 *   npm run seo:type-province -- --limit=5
 *   npm run seo:type-province -- --type=yoga
 *   npm run seo:type-province -- --province=madrid
 *   npm run seo:type-province -- --city-min=3      # umbral ≥3 centros (default 2)
 *   npm run seo:type-province -- --concurrency=3   # peticiones en paralelo (default 2)
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
const force = args.includes('--force');
const cityMode = args.includes('--city');
const allMode = args.includes('--all');
const limitArg = args.find((a) => a.startsWith('--limit='));
const typeArg = args.find((a) => a.startsWith('--type='));
const provinceArg = args.find((a) => a.startsWith('--province='));
const concArg = args.find((a) => a.startsWith('--concurrency='));
const cityMinArg = args.find((a) => a.startsWith('--city-min='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const typeFilter = typeArg ? typeArg.split('=')[1]?.trim() : null;
const provinceFilter = provinceArg ? provinceArg.split('=')[1]?.trim() : null;
const concurrency = Math.max(1, Math.min(6, concArg ? parseInt(concArg.split('=')[1], 10) || 2 : 2));
const cityMin = Math.max(1, cityMinArg ? parseInt(cityMinArg.split('=')[1], 10) || 2 : 2);

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

const TYPE_LABEL_ES = { yoga: 'yoga', meditation: 'meditación', ayurveda: 'ayurveda' };
const TYPE_LABEL_EN = { yoga: 'yoga', meditation: 'meditation', ayurveda: 'ayurveda' };

function normalizeProvinceSlug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function normalizeCitySlug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchCenterPairs() {
  const { data, error } = await admin
    .from('centers')
    .select('id, name, city, province, type, description_es')
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  const byPair = new Map();
  for (const row of data || []) {
    if (!row.type || !row.province) continue;
    const provinceSlug = normalizeProvinceSlug(row.province);
    const key = `${row.type}|${provinceSlug}`;
    if (!byPair.has(key)) {
      byPair.set(key, {
        scope: 'province',
        type: row.type,
        provinceSlug,
        provinceName: row.province,
        citySlug: null,
        cityName: null,
        centers: [],
      });
    }
    byPair.get(key).centers.push({
      name: row.name,
      city: row.city || null,
      description_snippet: stripHtml(row.description_es || '', 160),
    });
  }
  return Array.from(byPair.values());
}

async function fetchCenterTriples(minCount) {
  const { data, error } = await admin
    .from('centers')
    .select('id, name, city, province, type, description_es')
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  const byTriple = new Map();
  for (const row of data || []) {
    if (!row.type || !row.province || !row.city) continue;
    const provinceSlug = normalizeProvinceSlug(row.province);
    const citySlug = normalizeCitySlug(row.city);
    if (!citySlug) continue;
    const key = `${row.type}|${provinceSlug}|${citySlug}`;
    if (!byTriple.has(key)) {
      byTriple.set(key, {
        scope: 'city',
        type: row.type,
        provinceSlug,
        provinceName: row.province,
        citySlug,
        cityName: row.city,
        centers: [],
      });
    }
    byTriple.get(key).centers.push({
      name: row.name,
      city: row.city,
      description_snippet: stripHtml(row.description_es || '', 160),
    });
  }
  return Array.from(byTriple.values()).filter((t) => t.centers.length >= minCount);
}

function stripHtml(html, maxLen) {
  if (!html) return '';
  let t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function buildDossier(pair) {
  const cityCounts = new Map();
  for (const c of pair.centers) {
    const city = c.city || '(sin ciudad)';
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }
  const cities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => `${city} (${count})`)
    .join(', ');
  const sampleCenters = pair.centers.slice(0, 8).map((c) => `- ${c.name}${c.city ? ` · ${c.city}` : ''}`).join('\n');

  const header = [
    `Tipo de centro: ${pair.type} (${TYPE_LABEL_ES[pair.type] || pair.type} / ${TYPE_LABEL_EN[pair.type] || pair.type})`,
  ];
  if (pair.scope === 'city') {
    header.push(
      `Ciudad/barrio objetivo: ${pair.cityName} (slug URL: ${pair.citySlug})`,
      `Provincia: ${pair.provinceName} (slug URL: ${pair.provinceSlug})`,
      `Número de centros de este tipo en ESTA ciudad/barrio: ${pair.centers.length}`,
      'Nota: la landing es específica de esta ciudad/barrio dentro de la provincia. No hables de "toda la provincia"; enfoca el texto a este punto geográfico concreto (si es un barrio de una ciudad grande, p. ej. Eixample en Barcelona o Arganzuela en Madrid, menciona su carácter de distrito urbano).',
    );
  } else {
    header.push(
      `Provincia: ${pair.provinceName} (slug URL: ${pair.provinceSlug})`,
      `Número de centros activos de este tipo en la provincia: ${pair.centers.length}`,
      `Ciudades donde hay centros (con nº): ${cities}`,
    );
  }
  return [...header, '', 'Muestra de centros (máx. 8):', sampleCenters].join('\n');
}

const SYSTEM_PROMPT = `Eres un redactor SEO senior del directorio Retiru (bienestar, yoga, meditación, ayurveda en España) y experto en contenido local. Recibes un DOSSIER con datos reales de los centros de una combinación concreta (tipo + provincia, o tipo + provincia + ciudad/barrio) y debes generar contenido editorial único, específico para esa combinación, evitando cualquier texto genérico que sirva igual para otras provincias o ciudades.

Reglas duras:
- Escribe en un tono cercano, informado y honesto. Ni marketing agresivo ni clichés "wellness instagram".
- No inventes datos numéricos ni nombres que no estén en el dossier.
- NO incluyas años específicos (p. ej. 2022, 2023, 2024, 2025, 2026) en meta_title ni meta_description. Tampoco en el intro. Nada de "Verificados 2023", "Agenda 2024", etc. El contenido debe ser evergreen; si necesitas gancho usa expresiones como "directorio actualizado", "centros verificados", "agenda online", "opiniones reales", "guía local".
- Si el dossier indica una ciudad o barrio objetivo, el contenido debe centrarse en ESE punto geográfico (no hables de "toda la provincia"). Si la ciudad es en realidad un barrio/distrito de una ciudad grande (Eixample, Arganzuela, Gràcia, etc.), reconócelo y menciona su carácter urbano y el barrio vecino más cercano cuando aporte valor.
- Si el dossier NO indica ciudad, el contenido abarca toda la provincia y debe mencionar las principales ciudades presentes.
- El intro debe mencionar matices específicos del punto geográfico (geografía, carácter urbano/rural, escena local, accesibilidad, tipo de practicante habitual allí) y el encaje con esa disciplina concreta; si hay 1 solo centro, reconócelo y enfoca el intro a qué encontrará el usuario al visitar esa única opción.
- Las FAQ deben ser realmente locales (responder cosas como "cuánto cuesta", "dónde aparcar", "si hay opciones para principiantes", "cuáles son los estilos o enfoques más comunes aquí", "si se pueden hacer retiros cortos además de clases") en vez de preguntas genéricas.
- meta_title_es: máx. 60 caracteres. Si es ciudad/barrio, incluir "Centros de {disciplina} en {Ciudad}" (opcional: "{Ciudad} ({Provincia})"). Si es provincial, "Centros de {disciplina} en {Provincia}". Sin años. Puedes añadir gancho tipo "verificados", "agenda online", el nº de centros si es >=2 (ej. "5 opciones"), o "directorio Retiru".
- meta_title_en: máx. 60 caracteres, "{Discipline} Centers in {City}" o "{Discipline} Centers in {Province}" + gancho sin años.
- meta_description_es: 150-160 caracteres, sin clickbait, con CTA suave, sin años. Mencionar explícitamente la ciudad (si aplica) y el tipo.
- meta_description_en: 150-160 caracteres, sin años.
- intro_es / intro_en: 220-320 palabras cada uno, en HTML (solo <p>, <strong>, <em>; sin <h1> ni <h2>).
- faq_es / faq_en: exactamente 5 preguntas cada uno, respuestas 40-80 palabras, útiles, con datos plausibles del entorno local (si no sabes algo con certeza, responde honestamente "depende de" o "la mejor opción es consultar en el centro" en vez de inventar).

Formato de salida: SOLO un JSON válido con estas claves (sin markdown, sin texto extra):
{
  "intro_es": "...",
  "intro_en": "...",
  "meta_title_es": "...",
  "meta_title_en": "...",
  "meta_description_es": "...",
  "meta_description_en": "...",
  "faq_es": [{"question": "...", "answer": "..."}, ...],
  "faq_en": [{"question": "...", "answer": "..."}, ...]
}`;

async function generateSeoForPair(pair) {
  const dossier = buildDossier(pair);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.55,
      max_tokens: 2600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `=== DOSSIER ===\n${dossier}\n\nDevuelve el JSON.` },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `OpenAI chat (${res.status})`);
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Respuesta vacía de OpenAI');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`JSON inválido: ${raw.slice(0, 200)}`);
  }
  const required = ['intro_es', 'intro_en', 'meta_title_es', 'meta_title_en', 'meta_description_es', 'meta_description_en', 'faq_es', 'faq_en'];
  for (const k of required) {
    if (!(k in parsed)) throw new Error(`Falta clave ${k}`);
  }
  if (!Array.isArray(parsed.faq_es) || !Array.isArray(parsed.faq_en)) throw new Error('faq_* debe ser array');
  const normalizeFaq = (arr) =>
    arr
      .filter((q) => q && typeof q.question === 'string' && typeof q.answer === 'string')
      .map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }));
  return {
    intro_es: parsed.intro_es.trim(),
    intro_en: parsed.intro_en.trim(),
    meta_title_es: parsed.meta_title_es.trim().slice(0, 70),
    meta_title_en: parsed.meta_title_en.trim().slice(0, 70),
    meta_description_es: parsed.meta_description_es.trim().slice(0, 200),
    meta_description_en: parsed.meta_description_en.trim().slice(0, 200),
    faq_es: normalizeFaq(parsed.faq_es),
    faq_en: normalizeFaq(parsed.faq_en),
  };
}

async function getExistingSet() {
  const { data, error } = await admin
    .from('center_type_province_seo')
    .select('type, province_slug, city_slug');
  if (error) throw new Error(error.message);
  return new Set((data || []).map((r) => `${r.type}|${r.province_slug}|${r.city_slug || ''}`));
}

function pairKey(pair) {
  return `${pair.type}|${pair.provinceSlug}|${pair.citySlug || ''}`;
}

async function upsertSeo(pair, seo) {
  const q = admin
    .from('center_type_province_seo')
    .select('id')
    .eq('type', pair.type)
    .eq('province_slug', pair.provinceSlug);
  const filtered = pair.citySlug ? q.eq('city_slug', pair.citySlug) : q.is('city_slug', null);
  const { data: existingRow } = await filtered.maybeSingle();

  const payload = {
    type: pair.type,
    province_slug: pair.provinceSlug,
    province_name: pair.provinceName,
    city_slug: pair.citySlug,
    city_name: pair.cityName,
    ...seo,
    updated_at: new Date().toISOString(),
  };

  if (existingRow?.id) {
    const { error } = await admin.from('center_type_province_seo').update(payload).eq('id', existingRow.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('center_type_province_seo').insert(payload);
    if (error) throw new Error(error.message);
  }
}

async function runPool(items, workers, fn) {
  let next = 0;
  const results = [];
  async function workerFn() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = { error: e instanceof Error ? e.message : String(e), item: items[i] };
      }
    }
  }
  const n = Math.min(workers, items.length) || 1;
  await Promise.all(Array.from({ length: n }, workerFn));
  return results;
}

async function main() {
  const provincePairs = cityMode ? [] : await fetchCenterPairs();
  const cityTriples = cityMode || allMode ? await fetchCenterTriples(cityMin) : [];
  const all = [...provincePairs, ...cityTriples];
  const existing = await getExistingSet();

  let filtered = all;
  if (typeFilter) filtered = filtered.filter((p) => p.type === typeFilter);
  if (provinceFilter) filtered = filtered.filter((p) => p.provinceSlug === provinceFilter);
  if (!force) filtered = filtered.filter((p) => !existing.has(pairKey(p)));
  if (limit != null && !Number.isNaN(limit)) filtered = filtered.slice(0, limit);

  const scopeDesc = cityMode ? 'ciudades' : allMode ? 'provincias + ciudades' : 'provincias';
  console.log(
    `Ítems a procesar: ${filtered.length} (total=${all.length} [${scopeDesc}, city-min=${cityMin}], ya existentes=${existing.size}, force=${force}, dry-run=${dryRun}, concurrency=${concurrency})`,
  );

  if (filtered.length === 0) {
    console.log('Nada que hacer.');
    return;
  }

  const stats = { ok: 0, fail: 0 };

  await runPool(filtered, concurrency, async (pair) => {
    const label = pair.scope === 'city' ? `${pair.type}/${pair.provinceSlug}/${pair.citySlug}` : `${pair.type}/${pair.provinceSlug}`;
    try {
      if (dryRun) {
        console.log(`DRY ${label} — ${pair.centers.length} centros`);
        stats.ok++;
        return;
      }
      const seo = await generateSeoForPair(pair);
      await upsertSeo(pair, seo);
      console.log(`OK  ${label} — "${seo.meta_title_es}"`);
      stats.ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ERR ${label}: ${msg}`);
      stats.fail++;
    }
  });

  console.log(`\nResumen: ${stats.ok} correctos, ${stats.fail} errores.`);
  if (dryRun) console.log('Modo dry-run: no se ha escrito en BD.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
