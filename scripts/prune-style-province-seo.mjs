#!/usr/bin/env node
/**
 * Purga filas de style_province_seo que no corresponden a URLs publicables (200).
 * Criterio: mismo umbral que la app — ≥5 centros activos con ese estilo en esa provincia
 * (src/app/.../estilo/[estilo]/[provincia]/page.tsx, MIN_CENTERS_STYLE_PROVINCE = 5).
 *
 * Uso:
 *   node scripts/prune-style-province-seo.mjs              # dry-run (default)
 *   node scripts/prune-style-province-seo.mjs --execute    # borra en Supabase
 *   node scripts/prune-style-province-seo.mjs --verify-http # tras --execute, comprueba 200
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
const execute = args.includes('--execute');
const verifyHttp = args.includes('--verify-http');
const MIN_CENTERS = 5;

const TYPE_URL = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };
const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com').replace(/\/$/, '');

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalizeProvince(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

/** Pares válidos según center_styles + centers (igual que getStyleProvincePairs). */
async function computeValidPairs() {
  const { data: styles, error: sErr } = await admin
    .from('styles')
    .select('id, slug, center_type')
    .eq('is_active', true);
  if (sErr) throw new Error(sErr.message);

  const { data: links, error: lErr } = await admin.from('center_styles').select('center_id, style_id');
  if (lErr) throw new Error(lErr.message);

  const linkedCenterIds = new Set((links || []).map((l) => l.center_id));
  if (linkedCenterIds.size === 0) return new Map();

  const { data: centers, error: cErr } = await admin
    .from('centers')
    .select('id, province, status')
    .eq('status', 'active');
  if (cErr) throw new Error(cErr.message);

  const centerProvince = new Map();
  for (const c of centers || []) {
    if (!linkedCenterIds.has(c.id) || !c.province) continue;
    centerProvince.set(c.id, c.province);
  }

  const styleById = new Map((styles || []).map((s) => [s.id, s]));
  const pairs = new Map();

  for (const l of links || []) {
    const style = styleById.get(l.style_id);
    if (!style) continue;
    const province = centerProvince.get(l.center_id);
    if (!province) continue;
    const provinceSlug = normalizeProvince(province);
    const key = `${style.center_type}|${style.slug}|${provinceSlug}`;
    const entry = pairs.get(key) || {
      center_type: style.center_type,
      style_slug: style.slug,
      province_slug: provinceSlug,
      province_name: province,
      count: 0,
    };
    entry.count += 1;
    pairs.set(key, entry);
  }

  const valid = new Map();
  for (const [key, entry] of pairs) {
    if (entry.count >= MIN_CENTERS) valid.set(key, entry);
  }
  return valid;
}

async function fetchStatus(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Retiru-Prune-Verify/1.0' },
      });
      return res.status;
    } catch {
      if (attempt === retries) return 0;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return 0;
}

const validPairs = await computeValidPairs();
const { data: rows, error: rErr } = await admin
  .from('style_province_seo')
  .select('id, center_type, style_slug, province_slug, province_name, suppress_reason');
if (rErr) throw new Error(rErr.message);

const toKeep = [];
const toDelete = [];

for (const row of rows || []) {
  const key = `${row.center_type}|${row.style_slug}|${row.province_slug}`;
  if (validPairs.has(key)) {
    toKeep.push(row);
  } else {
    toDelete.push(row);
  }
}

console.log('\n═══ prune style_province_seo ═══');
console.log(`Umbral: ≥${MIN_CENTERS} centros activos por estilo×provincia`);
console.log(`Filas actuales: ${rows?.length ?? 0}`);
console.log(`Pares válidos (URLs 200): ${validPairs.size}`);
console.log(`Conservar: ${toKeep.length}`);
console.log(`Borrar: ${toDelete.length}`);
console.log(`Modo: ${execute ? 'EXECUTE' : 'DRY-RUN'}\n`);

if (toDelete.length > 0) {
  console.log('── Muestra de filas a borrar (max 15) ──');
  for (const r of toDelete.slice(0, 15)) {
    const seg = TYPE_URL[r.center_type] || r.center_type;
    console.log(
      `  ${r.center_type}|${r.style_slug}|${r.province_slug} → ${BASE}/es/centros/${seg}/estilo/${r.style_slug}/${r.province_slug}`,
    );
  }
  if (toDelete.length > 15) console.log(`  ... +${toDelete.length - 15} más\n`);
}

if (toKeep.length > 0) {
  console.log('── Filas que se conservan ──');
  for (const r of toKeep) {
    const v = validPairs.get(`${r.center_type}|${r.style_slug}|${r.province_slug}`);
    const seg = TYPE_URL[r.center_type] || r.center_type;
    console.log(
      `  ✓ ${r.style_slug}/${r.province_slug} (${v?.count ?? '?'} centros) → ${BASE}/es/centros/${seg}/estilo/${r.style_slug}/${r.province_slug}`,
    );
  }
  console.log('');
}

// Filas válidas en BD que faltan (informativo; no insertamos)
const existingKeys = new Set((rows || []).map((r) => `${r.center_type}|${r.style_slug}|${r.province_slug}`));
const missing = [...validPairs.keys()].filter((k) => !existingKeys.has(k));
if (missing.length) {
  console.log(`ℹ️  ${missing.length} par(es) publicable(s) sin fila SEO (no se insertan aquí):`);
  for (const k of missing.slice(0, 10)) console.log(`     ${k}`);
  if (missing.length > 10) console.log(`     ... +${missing.length - 10}`);
  console.log('');
}

if (!execute) {
  console.log('Para aplicar: node scripts/prune-style-province-seo.mjs --execute [--verify-http]\n');
  process.exit(0);
}

if (toDelete.length === 0) {
  console.log('✅ Nada que borrar.\n');
} else {
  const ids = toDelete.map((r) => r.id);
  const CHUNK = 50;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { error: delErr, count } = await admin.from('style_province_seo').delete({ count: 'exact' }).in('id', chunk);
    if (delErr) throw new Error(`DELETE: ${delErr.message}`);
    deleted += count ?? chunk.length;
  }
  console.log(`✅ Borradas ${deleted} filas de style_province_seo.\n`);
}

if (verifyHttp || execute) {
  const { data: remaining } = await admin.from('style_province_seo').select('center_type, style_slug, province_slug');
  console.log(`── Verificación HTTP (${remaining?.length ?? 0} URLs) ──`);
  let ok = 0;
  let bad = 0;
  for (const r of remaining || []) {
    const seg = TYPE_URL[r.center_type] || r.center_type;
    const url = `${BASE}/es/centros/${seg}/estilo/${r.style_slug}/${r.province_slug}`;
    const status = await fetchStatus(url);
    if (status >= 200 && status < 400) {
      ok++;
    } else {
      bad++;
      console.log(`  ❌ ${status} ${url}`);
    }
  }
  console.log(`  ${ok} OK · ${bad} no-200\n`);
  if (bad > 0) process.exit(1);
}

console.log('✅ Limpieza completada.\n');
