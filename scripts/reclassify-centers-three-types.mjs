#!/usr/bin/env node
/**
 * RETIRU · Reclasificar centros solo en yoga | meditation | ayurveda (OpenAI)
 *
 * Usa .env.local: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Orden recomendado en producción:
 *   1) Este script con --update (con enum antiguo aún en BD; yoga/meditation/ayurveda ya existen)
 *   2) Migración 014_center_type_three_disciplines.sql
 *   3) Desplegar código que solo conoce los tres tipos
 *
 * Uso:
 *   node scripts/reclassify-centers-three-types.mjs [--limit N] [--dry-run] [--update] [--active-only]
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const VALID_TYPES = ['yoga', 'meditation', 'ayurveda'];

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
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
}

const SYSTEM_PROMPT = `Eres un clasificador para Retiru (directorio de centros en España). Cada centro debe tener UNA sola categoría principal entre exactamente estas tres:

- **yoga**: El foco principal es enseñanza o práctica de yoga (asanas, escuelas de yoga, shala, hatha, vinyasa, kundalini, yin, etc.). Incluye centros donde el yoga es claramente el eje aunque también haya pilates u otras actividades secundarias.
- **meditation**: El foco principal es meditación, mindfulness, retiros de silencio, templos budistas, prácticas contemplativas, sound healing como eje (no como spa de lujo).
- **ayurveda**: El foco principal es medicina o terapias ayurvédicas (consultas dosha, panchakarma, tratamientos abhyanga/shirodhara como especialidad del centro).

REGLAS:
1. Si el centro es un gimnasio, crossfit o fitness genérico sin especialidad clara en yoga/meditación/ayurveda, elige la opción **más cercana** por la descripción: yoga si hay clases de yoga relevantes; meditation si el texto habla de mindfulness/retiros; si no encaja, **yoga** como comodín solo si hay cualquier señal de práctica corporal consciente; si es puro spa hotel sin enseñanza, **meditation** (bienestar contemplativo/relax profundo).
2. Pilates puro sin yoga como foco → **yoga** (práctica corporal consciente en el mismo eje que Retiru en esta fase).
3. Spa/termal sin enseñanza → **meditation** si el énfasis es relax/contemplación; si hay yoga en la descripción → **yoga**.
4. Responde **solo** una palabra en minúsculas: yoga | meditation | ayurveda (sin puntos ni explicación).`;

async function inferTypeWithAI(center, openaiKey) {
  const context = [
    `## Nombre: ${center.name}`,
    `## Ciudad/Provincia: ${center.city || ''}, ${center.province || ''}`,
    `## Tipo actual en BD: ${center.type || '(vacío)'}`,
    `## Servicios (Google): ${Array.isArray(center.services_es) ? center.services_es.join(', ') : center.services_es || '(ninguno)'}`,
    `## Tipos Google: ${center.google_types || '(ninguno)'}`,
    `## Búsqueda con la que se encontró: ${center.search_terms || '(ninguno)'}`,
    '',
    '## Descripción del centro:',
    (center.description_es || '(sin descripción)').slice(0, 2500),
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Clasifica este centro en una sola categoría:\n\n${context}` },
      ],
      max_tokens: 20,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }

  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content || '').trim().toLowerCase();

  for (const t of VALID_TYPES) {
    if (raw === t || raw.startsWith(t + ' ') || raw.startsWith(t + '\n') || raw.startsWith(t + '.')) return t;
  }
  for (const t of VALID_TYPES) {
    if (raw.includes(t)) return t;
  }
  return 'yoga';
}

async function main() {
  loadEnvLocal();

  const openaiKey = process.env.OPENAI_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiKey || !url || !serviceKey) {
    console.error('❌ Faltan OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
  const DRY_RUN = args.includes('--dry-run');
  const UPDATE = args.includes('--update') && !DRY_RUN;
  const ACTIVE_ONLY = args.includes('--active-only');

  console.log('\n═══ RECLASIFICAR CENTROS (yoga | meditation | ayurveda) ═══\n');
  if (ACTIVE_ONLY) console.log('Solo centros con status=active\n');

  let query = supabase
    .from('centers')
    .select('id, name, slug, type, services_es, description_es, search_terms, google_types, city, province, status')
    .order('name');

  if (ACTIVE_ONLY) query = query.eq('status', 'active');

  const { data: centers, error } = await query;

  if (error) {
    console.error('❌ Error cargando centros:', error.message);
    process.exit(1);
  }

  let toProcess = centers || [];
  if (LIMIT > 0) toProcess = toProcess.slice(0, LIMIT);

  console.log(`Centros a procesar: ${toProcess.length}${LIMIT ? ` (limit=${LIMIT})` : ''}`);
  if (DRY_RUN) console.log('DRY RUN — CSV solamente, sin BD');
  else if (UPDATE) console.log('UPDATE — se escribirá type en Supabase');
  else console.log('Solo reporte. Usa --update para aplicar.\n');

  const results = [];
  let ok = 0;
  let errCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const c = toProcess[i];
    const t0 = Date.now();
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${c.name}... `);

    try {
      const proposed = await inferTypeWithAI(c, openaiKey);
      const changed = c.type !== proposed;

      results.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        status: c.status,
        type_actual: c.type,
        type_propuesto: proposed,
        changed,
      });

      if (!DRY_RUN && UPDATE && changed) {
        const { error: upErr } = await supabase
          .from('centers')
          .update({ type: proposed, updated_at: new Date().toISOString() })
          .eq('id', c.id);
        if (upErr) throw upErr;
      }

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const badge = changed ? `→ ${proposed}` : '=';
      console.log(`${badge} (${elapsed}s)`);
      ok++;
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`✗ ${err.message} (${elapsed}s)`);
      errCount++;
      results.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type_actual: c.type,
        type_propuesto: null,
        changed: false,
        error: err.message,
      });

      if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
        console.log('  Rate limit — esperando 30s...');
        await new Promise((r) => setTimeout(r, 30000));
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const changedCount = results.filter((r) => r.changed).length;

  console.log('\n═══ RESULTADO ═══');
  console.log(`✓ ${ok} procesados | ✗ ${errCount} errores | ${changedCount} cambios propuestos | ${totalTime} min`);

  const csvLines = [
    'Nombre,Slug,Estado,Tipo_actual,Tipo_propuesto,Cambia',
    ...results.map((r) =>
      [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.slug,
        r.status ?? '',
        r.type_actual || '',
        r.type_propuesto || r.error || '',
        r.changed ? 'Sí' : 'No',
      ].join(','),
    ),
  ];
  const reportPath = join(root, 'centros-tres-tipos-ia.csv');
  writeFileSync(reportPath, '\ufeff' + csvLines.join('\n'), 'utf8');
  console.log(`\n📄 Reporte: centros-tres-tipos-ia.csv`);

  if (!UPDATE && changedCount > 0) {
    console.log('\n   Revisa el CSV y ejecuta: npm run centers:reclassify-three -- --update');
    console.log('   Luego aplica la migración 014_center_type_three_disciplines.sql en Supabase.\n');
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
