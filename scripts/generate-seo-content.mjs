#!/usr/bin/env node
/**
 * Genera contenido SEO único para categorías y destinos con OpenAI
 * y lo guarda en Supabase (proyecto enlazado en .env.local).
 *
 * Uso:
 *   node scripts/generate-seo-content.mjs                  # todas
 *   node scripts/generate-seo-content.mjs --categories     # solo categorías
 *   node scripts/generate-seo-content.mjs --destinations   # solo destinos
 *   node scripts/generate-seo-content.mjs --force          # sobrescribir existentes
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('Falta .env.local'); process.exit(1); }
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
if (!OPENAI_KEY) { console.error('Falta OPENAI_API_KEY en .env.local'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const args = process.argv.slice(2);
const doCategories = args.length === 0 || args.includes('--categories');
const doDestinations = args.length === 0 || args.includes('--destinations');
const force = args.includes('--force');

async function callOpenAI(prompt, maxTokens = 2000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un redactor SEO experto en bienestar, yoga, meditación y retiros en España. Generas contenido único, natural y optimizado para Google. Responde SOLO con el JSON pedido, sin markdown ni backticks.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) throw new Error('OpenAI sin respuesta: ' + JSON.stringify(data));
  const raw = data.choices[0].message.content.trim().replace(/^```json?\s*/, '').replace(/```$/, '');
  return JSON.parse(raw);
}

// ─── Categorías ────────────────────────────────────────────────────────────

async function generateCategoryContent() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, slug, name_es, name_en, intro_es')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;

  for (const cat of categories) {
    if (!force && cat.intro_es) {
      console.log(`  ⏭  ${cat.slug} — ya tiene contenido (usa --force para sobrescribir)`);
      continue;
    }

    console.log(`  ✍  Generando contenido para categoría: ${cat.slug}...`);

    const result = await callOpenAI(`
Genera contenido SEO para la categoría de retiros "${cat.name_es}" (${cat.name_en}) en la plataforma Retiru (retiru.com), marketplace de retiros y centros de bienestar en España.

Devuelve un JSON con estas claves:
{
  "intro_es": "2-3 párrafos (300-400 palabras) describiendo qué es un retiro de ${cat.name_es}, beneficios, qué esperar, para quién es ideal. Tono cálido y profesional. Incluir keywords naturales: 'retiro de ${cat.name_es.toLowerCase()}', 'retiros de ${cat.name_es.toLowerCase()} en España'. NO incluir teléfonos ni emails.",
  "intro_en": "Misma idea en inglés, adaptada culturalmente. Keywords: '${cat.name_en.toLowerCase()} retreat', '${cat.name_en.toLowerCase()} retreats in Spain'.",
  "meta_title_es": "Título SEO ES (max 60 chars) con keyword principal, incluir '| Retiru'",
  "meta_title_en": "Título SEO EN (max 60 chars)",
  "meta_description_es": "Meta description ES (max 155 chars) con CTA",
  "meta_description_en": "Meta description EN (max 155 chars) con CTA",
  "faq": [
    { "question": "pregunta en español", "answer": "respuesta concisa (2-3 frases)" },
    { "question": "...", "answer": "..." }
  ]
}

Genera 4-5 FAQs relevantes y diferentes. Las FAQ deben ser en español. NO mencionar datos de contacto directos.
    `);

    const { error: uErr } = await supabase
      .from('categories')
      .update({
        intro_es: result.intro_es,
        intro_en: result.intro_en,
        meta_title_es: result.meta_title_es,
        meta_title_en: result.meta_title_en,
        meta_description_es: result.meta_description_es,
        meta_description_en: result.meta_description_en,
        faq: result.faq || [],
      })
      .eq('id', cat.id);

    if (uErr) console.error(`  ❌ Error actualizando ${cat.slug}:`, uErr.message);
    else console.log(`  ✅ ${cat.slug} actualizado`);

    await new Promise(r => setTimeout(r, 1500));
  }
}

// ─── Destinos ──────────────────────────────────────────────────────────────

async function generateDestinationContent() {
  const { data: destinations, error } = await supabase
    .from('destinations')
    .select('id, slug, name_es, name_en, region, country, intro_es')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;

  for (const dest of destinations) {
    if (!force && dest.intro_es) {
      console.log(`  ⏭  ${dest.slug} — ya tiene contenido (usa --force para sobrescribir)`);
      continue;
    }

    console.log(`  ✍  Generando contenido para destino: ${dest.slug}...`);

    const regionInfo = dest.region ? ` (región: ${dest.region})` : '';

    const result = await callOpenAI(`
Genera contenido SEO único para el destino "${dest.name_es}" (${dest.name_en})${regionInfo} en la plataforma Retiru (retiru.com), marketplace de retiros y centros de bienestar.

El contenido debe ser ÚNICO para este destino. Habla del paisaje, la naturaleza, las actividades, la gastronomía local, por qué es ideal para retiros de bienestar. Si conoces parques, espacios naturales o zonas emblemáticas del lugar, menciónalos.

Devuelve un JSON:
{
  "intro_es": "2-3 párrafos (300-400 palabras) sobre por qué ${dest.name_es} es un destino ideal para retiros. Contenido local y diferenciador. Keywords: 'retiros en ${dest.name_es}', 'yoga ${dest.name_es}'. NO teléfonos ni emails.",
  "intro_en": "Misma idea en inglés. Keywords: 'retreats in ${dest.name_en}'.",
  "meta_title_es": "Título SEO ES (max 60 chars) con '| Retiru'",
  "meta_title_en": "Título SEO EN (max 60 chars)",
  "meta_description_es": "Meta description ES (max 155 chars) con CTA",
  "meta_description_en": "Meta description EN (max 155 chars) con CTA",
  "faq": [
    { "question": "pregunta en español sobre retiros en ${dest.name_es}", "answer": "respuesta concisa" },
    { "question": "...", "answer": "..." }
  ]
}

Genera 4-5 FAQs locales. Ejemplo: mejor época para visitar, cómo llegar, qué tipo de retiros hay, etc. FAQ en español.
    `);

    const { error: uErr } = await supabase
      .from('destinations')
      .update({
        intro_es: result.intro_es,
        intro_en: result.intro_en,
        meta_title_es: result.meta_title_es,
        meta_title_en: result.meta_title_en,
        meta_description_es: result.meta_description_es,
        meta_description_en: result.meta_description_en,
        faq: result.faq || [],
      })
      .eq('id', dest.id);

    if (uErr) console.error(`  ❌ Error actualizando ${dest.slug}:`, uErr.message);
    else console.log(`  ✅ ${dest.slug} actualizado`);

    await new Promise(r => setTimeout(r, 1500));
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Generador de contenido SEO para Retiru\n');

  if (doCategories) {
    console.log('📂 Categorías:');
    await generateCategoryContent();
    console.log('');
  }

  if (doDestinations) {
    console.log('📍 Destinos:');
    await generateDestinationContent();
    console.log('');
  }

  console.log('✨ Completado\n');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
