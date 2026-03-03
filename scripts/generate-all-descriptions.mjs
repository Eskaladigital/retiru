#!/usr/bin/env node
/**
 * Genera descripciones con IA para TODOS los centros sin descripción.
 * Usa SerpAPI (Google + Maps + Reviews) + OpenAI GPT-4o-mini.
 * Sin timeout — corre localmente.
 *
 * Uso:  node scripts/generate-all-descriptions.mjs [--limit N] [--dry-run]
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
const SERP_KEY = process.env.SERPAPI_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const DRY_RUN = args.includes('--dry-run');
const MIN_DESC = 400;

const SYSTEM_PROMPT = `Eres un redactor profesional para Retiru, plataforma de retiros y centros de bienestar en España.
Tu tarea: escribir una descripción COMPLETA y ENRIQUECIDA del centro de 800 a 1200 palabras, en español.

Estructura sugerida:
1. **Introducción** (párrafo): Presentar el centro, ubicación, filosofía o especialidad.
2. **Servicios y oferta**: Detallar clases, disciplinas, tratamientos, horarios si se mencionan. Destacar qué hace único al centro.
3. **Reseñas y reputación**: Si hay reseñas en el contexto, intégralas de forma natural (ej: "Los usuarios destacan...", "Según las valoraciones..."). Menciona puntuación y cantidad de reseñas si aparecen.
4. **Ambiente e instalaciones**: Si hay información, describe el espacio, el equipo, la atmósfera.
5. **Cierre**: Invitación a visitar o contacto, tono cercano.

Reglas:
- Tono: profesional, cercano, premium. Sin exagerar.
- NO inventes datos (direcciones exactas, precios, nombres de profesores) que no estén en el contexto.
- Usa el contexto proporcionado. Si hay poca información, elabora una descripción sólida basada en nombre, ciudad, tipo y servicios.
- Longitud: entre 800 y 1200 palabras. Párrafos bien estructurados.`;

async function fetchContext(center) {
  const query = `${center.name} ${center.city} ${center.province} España`;
  const parts = [];

  try {
    const googleRes = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SERP_KEY}&hl=es&num=10`
    );
    const googleData = googleRes.ok ? await googleRes.json() : null;
    if (googleData?.organic_results) {
      const snippets = googleData.organic_results.slice(0, 10).map(r => r.snippet).filter(Boolean);
      if (snippets.length) parts.push('## Contexto web (Google):\n' + snippets.join('\n\n'));
    }
  } catch {}

  let dataId = null;
  try {
    const mapsRes = await fetch(
      `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(`${center.name} ${center.city}`)}&api_key=${SERP_KEY}&hl=es&type=search`
    );
    const mapsData = mapsRes.ok ? await mapsRes.json() : null;
    if (mapsData?.local_results?.[0]) {
      const p = mapsData.local_results[0];
      let info = `Rating: ${p.rating ?? 'N/A'}, ${p.reviews ?? 0} reseñas. Tipo: ${p.type ?? center.type ?? 'centro de bienestar'}.`;
      if (p.address) info += ` Dirección: ${p.address}.`;
      parts.push('## Google Maps:\n' + info);
      dataId = p.data_id || null;
    }
  } catch {}

  if (dataId) {
    try {
      const revRes = await fetch(
        `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${encodeURIComponent(dataId)}&api_key=${SERP_KEY}&hl=es`
      );
      const revData = revRes.ok ? await revRes.json() : null;
      if (revData?.reviews?.length) {
        const texts = revData.reviews.slice(0, 8).map(r => r.snippet || r.extract || '').filter(Boolean);
        if (texts.length) parts.push('## Reseñas de usuarios (Google):\n' + texts.map(t => `- "${t}"`).join('\n'));
      }
    } catch {}
  }

  const services = center.services_es?.length ? center.services_es.join(', ') : center.type || 'yoga, meditación, wellness';
  parts.push('## Servicios / oferta del centro (BD):\n' + services);

  return parts.join('\n\n') || `Centro: ${center.name}, ${center.city}, ${center.province}. Tipo: ${center.type || 'wellness'}.`;
}

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
      temperature: 0.65,
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
  .select('id, name, slug, city, province, type, services_es, description_es');

let toProcess = (centers || []).filter(c => {
  const desc = (c.description_es || '').trim();
  return desc.length < MIN_DESC;
});

if (LIMIT > 0) toProcess = toProcess.slice(0, LIMIT);

console.log(`\n═══ GENERAR DESCRIPCIONES CON IA ═══`);
console.log(`Centros sin descripción: ${toProcess.length}${LIMIT ? ` (limitado a ${LIMIT})` : ''}`);
if (DRY_RUN) console.log('🔸 DRY RUN — no se guardarán cambios\n');
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
      console.log('  ⏳ Rate limit — esperando 30s...');
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n═══ RESULTADO ═══`);
console.log(`✓ ${ok} generados | ✗ ${errors} errores | ⏱ ${totalTime} min`);
