#!/usr/bin/env node
/**
 * RETIRU · Inferir estilos/subtipos para centros (Fase 3 #10).
 *
 * Lee `centers.description_es` / `description_en` / `services_es` / `name` y
 * pregunta a GPT-4o-mini qué estilos del catálogo `styles` (filtrado por
 * `styles.center_type = centers.type`) se mencionan o se implican con alta
 * confianza. Inserta en `center_styles` las nuevas asignaciones (evita duplicar).
 *
 * Requisitos .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Uso:
 *   npm run centers:infer-styles -- --dry-run
 *   npm run centers:infer-styles
 *   npm run centers:infer-styles -- --id=<uuid>
 *   npm run centers:infer-styles -- --limit=10
 *   npm run centers:infer-styles -- --force   # re-evalúa aunque ya tenga estilos
 *   npm run centers:infer-styles -- --min-confidence=0.7  # descarta sugerencias bajas (0-1)
 *   npm run centers:infer-styles -- --concurrency=3
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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const idArg = args.find((a) => a.startsWith('--id='));
const limitArg = args.find((a) => a.startsWith('--limit='));
const concArg = args.find((a) => a.startsWith('--concurrency='));
const confArg = args.find((a) => a.startsWith('--min-confidence='));
const singleId = idArg ? idArg.split('=')[1]?.trim() : null;
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const concurrency = concArg ? Math.max(1, Math.min(8, parseInt(concArg.split('=')[1], 10) || 2)) : 2;
const MIN_CONF = confArg ? Math.max(0, Math.min(1, parseFloat(confArg.split('=')[1]) || 0.6)) : 0.6;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
if (!supabaseUrl || !serviceKey || !openaiKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y OPENAI_API_KEY son obligatorias');
  process.exit(1);
}
const admin = createClient(supabaseUrl, serviceKey);

const SYSTEM_PROMPT = `Eres un clasificador experto en yoga, meditación y ayurveda.
Recibes información de un centro y una lista cerrada de estilos/subtipos con su descripción.
Devuelve SOLO los estilos del catálogo que el centro practica o ofrece de forma clara.
No inventes estilos que no estén en la lista.
Evita adjudicar estilos por mera mención pasajera: exige evidencia razonable en el texto.
Responde en JSON con la forma {"styles":[{"slug":"kundalini","confidence":0.9,"evidence":"cita literal corta"}, ...]}.
- confidence: número entre 0 y 1.
- evidence: frase o palabra literal del texto que respalda la elección (máx. 120 caracteres).
Si no hay ninguna coincidencia razonable, devuelve {"styles":[]}.`;

async function openaiJson(messages, { model = 'gpt-4o-mini', temperature = 0.1 } = {}) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '{}';
  return JSON.parse(raw);
}

async function fetchStyles() {
  const { data, error } = await admin
    .from('styles')
    .select('id, slug, name_es, name_en, center_type, description_es')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchExistingAssignments() {
  const { data, error } = await admin
    .from('center_styles')
    .select('center_id, style_id');
  if (error) throw error;
  const byCenter = new Map();
  for (const r of data || []) {
    const set = byCenter.get(r.center_id) || new Set();
    set.add(r.style_id);
    byCenter.set(r.center_id, set);
  }
  return byCenter;
}

function buildCatalogSection(styles, centerType) {
  const lines = styles
    .filter((s) => s.center_type === centerType)
    .map((s) => `- slug: ${s.slug} · nombre: ${s.name_es} / ${s.name_en} · ${s.description_es || ''}`);
  return lines.join('\n');
}

function buildUserPrompt(center, catalogSection) {
  const services = Array.isArray(center.services_es) ? center.services_es.join(', ') : '';
  const desc = [center.description_es, center.description_en].filter(Boolean).join('\n---\n').slice(0, 3000);
  return `Centro: ${center.name}
Tipo: ${center.type}
Provincia: ${center.province || '?'}
Servicios: ${services || '-'}

Descripción:
${desc || '(sin descripción)'}

Catálogo de estilos posibles para el tipo "${center.type}":
${catalogSection}

Devuelve el JSON en el formato indicado.`;
}

async function processCenter(center, styles, existing, stats) {
  const catalog = buildCatalogSection(styles, center.type);
  if (!catalog) {
    stats.skipped++;
    return `${center.slug}: sin catálogo para tipo ${center.type}`;
  }
  if (!force && existing.get(center.id)?.size > 0) {
    stats.skippedExisting++;
    return `${center.slug}: ya tiene ${existing.get(center.id)?.size} estilos (usa --force)`;
  }
  if (!center.description_es && !center.description_en && !(Array.isArray(center.services_es) && center.services_es.length)) {
    stats.skipped++;
    return `${center.slug}: sin descripción/servicios, se salta`;
  }

  const userPrompt = buildUserPrompt(center, catalog);
  const parsed = await openaiJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  const suggestions = Array.isArray(parsed.styles) ? parsed.styles : [];
  const styleSlugs = new Set(styles.filter((s) => s.center_type === center.type).map((s) => s.slug));
  const approved = [];
  for (const sug of suggestions) {
    if (!sug?.slug || !styleSlugs.has(sug.slug)) continue;
    const conf = Math.max(0, Math.min(1, Number(sug.confidence) || 0));
    if (conf < MIN_CONF) continue;
    approved.push({ slug: sug.slug, confidence: conf, evidence: String(sug.evidence || '').slice(0, 140) });
  }

  if (approved.length === 0) {
    stats.noMatch++;
    return `${center.slug}: sin estilos encontrados con confidence≥${MIN_CONF}`;
  }

  const already = existing.get(center.id) || new Set();
  const styleIdBySlug = new Map(styles.map((s) => [s.slug, s.id]));
  const toInsert = [];
  for (const a of approved) {
    const styleId = styleIdBySlug.get(a.slug);
    if (!styleId || already.has(styleId)) continue;
    toInsert.push({
      center_id: center.id,
      style_id: styleId,
      source: 'ai',
      confidence: a.confidence,
    });
  }

  if (toInsert.length === 0) {
    stats.noChange++;
    return `${center.slug}: sin cambios (${approved.length} estilos ya presentes)`;
  }

  if (dryRun) {
    stats.wouldInsert += toInsert.length;
    return `${center.slug}: dry-run → insertaría ${toInsert.map((x) => approved.find((a) => styleIdBySlug.get(a.slug) === x.style_id)?.slug).join(', ')}`;
  }

  const { error } = await admin.from('center_styles').insert(toInsert);
  if (error) throw new Error(`insert: ${error.message}`);
  stats.inserted += toInsert.length;
  stats.processed++;
  return `${center.slug}: +${toInsert.length} estilos → ${approved.map((a) => `${a.slug}(${a.confidence.toFixed(2)})`).join(', ')}`;
}

async function runWithConcurrency(items, worker, c) {
  const queue = items.slice();
  const workers = Array.from({ length: c }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      try {
        const line = await worker(next);
        console.log(`OK  ${line}`);
      } catch (e) {
        console.error(`ERR ${next.slug}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  });
  await Promise.all(workers);
}

async function main() {
  const styles = await fetchStyles();
  if (styles.length === 0) {
    console.error('Catálogo `styles` vacío. Aplica la migración 044 y recarga.');
    process.exit(1);
  }
  const existing = await fetchExistingAssignments();

  let q = admin
    .from('centers')
    .select('id, slug, name, type, province, description_es, description_en, services_es')
    .eq('status', 'active');
  if (singleId) q = q.eq('id', singleId);
  const { data: centers, error } = await q;
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let rows = (centers || []).filter((c) => c.type && ['yoga', 'meditation', 'ayurveda'].includes(c.type));
  if (!force) rows = rows.filter((c) => !(existing.get(c.id)?.size > 0));
  if (limit != null && !Number.isNaN(limit)) rows = rows.slice(0, limit);

  console.log(`Centros a analizar: ${rows.length} (concurrency=${concurrency}, dry-run=${dryRun}, force=${force}, min-confidence=${MIN_CONF})\n`);

  const stats = {
    processed: 0,
    inserted: 0,
    wouldInsert: 0,
    skipped: 0,
    skippedExisting: 0,
    noMatch: 0,
    noChange: 0,
  };

  await runWithConcurrency(rows, (c) => processCenter(c, styles, existing, stats), concurrency);

  console.log(`\nResumen:`);
  console.log(`  ${dryRun ? 'a insertar (dry-run)' : 'insertadas'}: ${dryRun ? stats.wouldInsert : stats.inserted}`);
  console.log(`  centros procesados: ${stats.processed}`);
  console.log(`  sin match: ${stats.noMatch}`);
  console.log(`  sin cambio (ya asignados): ${stats.noChange}`);
  console.log(`  saltados por datos: ${stats.skipped}`);
  console.log(`  saltados por tener estilos: ${stats.skippedExisting}`);
  if (dryRun) console.log('\nModo dry-run: no se ha modificado nada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
