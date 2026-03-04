#!/usr/bin/env node
/**
 * RETIRU · Inferir tipo de centro con IA (OpenAI)
 *
 * La IA recibe: tipo actual, servicios (Google), descripción (que ella misma escribió),
 * nombre, search_terms, google_types. Con todo eso determina la categoría correcta.
 *
 * Objetivo: afinar la clasificación. Ej: un gimnasio de alto rendimiento que ofrece
 * pilates NO es "pilates" como principal; un centro especializado en pilates SÍ.
 *
 * Uso: node scripts/infer-center-types-with-ai.mjs [--limit N] [--dry-run] [--update]
 *   --limit N   Procesar solo los primeros N centros (para pruebas)
 *   --dry-run   Generar CSV de propuestas sin modificar BD
 *   --update    Aplicar cambios a la BD (requiere migración 009)
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const VALID_TYPES = ['yoga', 'pilates', 'meditation', 'ayurveda', 'spa', 'wellness', 'yoga_meditation', 'wellness_spa', 'multidisciplinary'];

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

const SYSTEM_PROMPT = `Eres un clasificador experto para Retiru, directorio de centros de yoga, pilates, ayurveda, meditación y wellness en España.

Tu tarea: determinar la CATEGORÍA PRINCIPAL de cada centro. Es decir, qué hace el centro COMO ESPECIALIDAD, no qué ofrece como complemento.

REGLAS CRÍTICAS:
1. **Centro de Pilates** = El pilates es el FOCO principal. Clases de pilates, reformer, mat pilates como actividad estrella.
2. **Gimnasio / Alto rendimiento** que ofrece pilates como una clase más = NO es pilates. Es "multidisciplinary" o "wellness".
3. **Centro de Yoga** = El yoga es el FOCO principal. Escuelas de yoga, clases de hatha/vinyasa/kundalini como actividad estrella.
4. **Gimnasio** que tiene yoga como una clase más = NO es yoga. Es "multidisciplinary" o "wellness".
5. **Ayurveda** = Tratamientos ayurvédicos, masajes abhyanga, shirodhara, consultas dosha como FOCO principal.
6. **Spa** = Circuito termal, baños árabes, tratamientos de bienestar como FOCO principal.
7. **Meditación** = Prácticas de meditación, mindfulness, retiros de silencio como FOCO principal.
8. **Wellness** = Centro de bienestar genérico sin especialidad clara (fisio, osteopatía, masajes, algo de yoga/pilates).
9. **yoga_meditation** = Centro que combina yoga Y meditación como pilares igual de importantes.
10. **wellness_spa** = Centro que combina wellness y spa como pilares.
11. **multidisciplinary** = Gimnasio, centro deportivo, centro de fitness que ofrece varias disciplinas sin especialidad en yoga/pilates/ayurveda.

La DESCRIPCIÓN es clave: fue escrita por IA basándose en la web del centro y reseñas. Si la descripción dice "gimnasio de alto rendimiento", "crossfit", "entrenamiento funcional" como foco, NO es pilates aunque ofrezca pilates.

Responde ÚNICAMENTE con una de estas palabras (en minúsculas, sin puntos ni explicación):
yoga | pilates | meditation | ayurveda | spa | wellness | yoga_meditation | wellness_spa | multidisciplinary`;

async function inferTypeWithAI(center, openaiKey) {
  const context = [
    `## Nombre: ${center.name}`,
    `## Ciudad/Provincia: ${center.city || ''}, ${center.province || ''}`,
    `## Tipo actual en BD: ${center.type || '(vacío)'}`,
    `## Servicios (Google): ${Array.isArray(center.services_es) ? center.services_es.join(', ') : center.services_es || '(ninguno)'}`,
    `## Tipos Google: ${center.google_types || '(ninguno)'}`,
    `## Búsqueda con la que se encontró: ${center.search_terms || '(ninguno)'}`,
    '',
    '## Descripción del centro (escrita por IA a partir de web y reseñas):',
    (center.description_es || '(sin descripción)').slice(0, 2500),
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Determina la categoría principal de este centro:\n\n${context}` },
      ],
      max_tokens: 50,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }

  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content || '').trim().toLowerCase();

  // Extraer la primera palabra que coincida con un tipo válido
  for (const t of VALID_TYPES) {
    if (raw === t || raw.startsWith(t + ' ') || raw.startsWith(t + '\n') || raw.startsWith(t + '.')) return t;
  }
  // Fallback: buscar cualquier tipo en la respuesta
  for (const t of VALID_TYPES) {
    if (raw.includes(t)) return t;
  }
  return 'multidisciplinary';
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

  console.log('\n═══ INFERIR TIPOS DE CENTRO CON IA ═══');
  console.log('La IA analiza: tipo actual, servicios (Google), descripción, nombre, search_terms');
  console.log('Objetivo: afinar categoría (ej: gimnasio con pilates → multidisciplinary)\n');

  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, slug, type, services_es, description_es, search_terms, google_types, city, province')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('❌ Error cargando centros:', error.message);
    process.exit(1);
  }

  let toProcess = centers || [];
  if (LIMIT > 0) toProcess = toProcess.slice(0, LIMIT);

  console.log(`Centros a procesar: ${toProcess.length}${LIMIT ? ` (limitado a ${LIMIT})` : ''}`);
  if (DRY_RUN) console.log('DRY RUN — se generará CSV de propuestas, no se modificará la BD');
  else if (UPDATE) console.log('UPDATE — se aplicarán cambios a la BD');
  else console.log('Por defecto: solo reporte. Usa --update para aplicar.\n');

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
        type_actual: c.type,
        type_propuesto: proposed,
        changed: changed,
      });

      if (!DRY_RUN && UPDATE && changed) {
        const { error: upErr } = await supabase
          .from('centers')
          .update({ type: proposed, updated_at: new Date().toISOString() })
          .eq('id', c.id);
        if (upErr) throw upErr;
      }

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const badge = changed ? '→ ' + proposed : '=';
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

  // CSV de reporte
  const csvLines = [
    'Nombre,Slug,Tipo_actual,Tipo_propuesto,Cambia',
    ...results.map((r) =>
      [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.slug,
        r.type_actual || '',
        r.type_propuesto || r.error || '',
        r.changed ? 'Sí' : 'No',
      ].join(',')
    ),
  ];
  const reportPath = join(root, 'centros-tipos-ia-propuesta.csv');
  writeFileSync(reportPath, '\ufeff' + csvLines.join('\n'), 'utf8');
  console.log(`\n📄 Reporte guardado en: centros-tipos-ia-propuesta.csv`);

  if (!UPDATE && changedCount > 0) {
    console.log('\n   Revisa el CSV y ejecuta con --update para aplicar los cambios.');
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
