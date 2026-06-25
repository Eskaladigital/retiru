#!/usr/bin/env node
/**
 * Comprueba que las landings SEO del directorio no devuelvan 404/500 en producción.
 * Uso: node scripts/check-seo-urls-status.mjs [--local] [--concurrency=8]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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

const args = process.argv.slice(2);
const useLocal = args.includes('--local');
const concurrency = Math.max(1, Math.min(12, parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '8', 10) || 8));

const BASE = useLocal
  ? 'http://localhost:3000'
  : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.retiru.com').replace(/\/$/, '');

const TYPE_URL = { yoga: 'yoga', meditation: 'meditacion', ayurveda: 'ayurveda' };

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/** @type {{ url: string; group: string }[]} */
const urls = [];

function add(group, path) {
  urls.push({ url: `${BASE}${path}`, group });
}

// Capa 1
for (const seg of ['yoga', 'meditacion', 'ayurveda']) {
  add('cap1-nacional', `/es/centros/${seg}`);
}

const { data: tp } = await admin
  .from('center_type_province_seo')
  .select('type, province_slug, city_slug')
  .order('type')
  .order('province_slug');

for (const r of tp || []) {
  const seg = TYPE_URL[r.type] || r.type;
  if (!r.city_slug) {
    add('cap3-provincia', `/es/centros/${seg}/${r.province_slug}`);
    add('cap3-provincia-en', `/en/centers/${r.type}/${r.province_slug}`);
  } else {
    add('cap5-ciudad', `/es/centros/${seg}/${r.province_slug}/${r.city_slug}`);
  }
}

const { data: styles } = await admin.from('styles').select('slug, center_type').eq('is_active', true);
for (const s of styles || []) {
  const seg = TYPE_URL[s.center_type] || s.center_type;
  add('cap2-estilo', `/es/centros/${seg}/estilo/${s.slug}`);
}

const { data: sp } = await admin.from('style_province_seo').select('center_type, style_slug, province_slug');
for (const r of sp || []) {
  const seg = TYPE_URL[r.center_type] || r.center_type;
  add('cap4-estilo-prov', `/es/centros/${seg}/estilo/${r.style_slug}/${r.province_slug}`);
}

// Dedupe
const seen = new Set();
const unique = urls.filter(({ url }) => {
  if (seen.has(url)) return false;
  seen.add(url);
  return true;
});

async function fetchStatus(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Retiru-SEO-URL-Checker/1.0', Accept: 'text/html' },
    });
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 0, ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, workers, fn) {
  let i = 0;
  const out = [];
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, worker));
  return out;
}

console.log(`\nComprobando ${unique.length} URLs en ${BASE} (conc=${concurrency})…\n`);

const results = await runPool(unique, concurrency, async (item) => {
  const r = await fetchStatus(item.url);
  return { ...item, ...r };
});

const bad = results.filter((r) => r.status === 404);
const errors = results.filter((r) => r.status >= 500 || r.status === 0);
const other = results.filter((r) => r.status !== 404 && r.status >= 400 && r.status < 500);
const ok = results.filter((r) => r.status >= 200 && r.status < 400);

console.log(`✅ OK (2xx/3xx): ${ok.length}`);
console.log(`❌ 404: ${bad.length}`);
console.log(`⚠️  Otros 4xx: ${other.length}`);
console.log(`💥 5xx / red: ${errors.length}`);

if (bad.length) {
  console.log('\n── 404 ──');
  const byGroup = new Map();
  for (const r of bad) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, []);
    byGroup.get(r.group).push(r.url);
  }
  for (const [g, list] of [...byGroup.entries()].sort()) {
    console.log(`\n${g} (${list.length}):`);
    list.forEach((u) => console.log(`  ${u}`));
  }
}

if (other.length) {
  console.log('\n── Otros 4xx ──');
  other.forEach((r) => console.log(`  ${r.status} ${r.url}`));
}

if (errors.length) {
  console.log('\n── 5xx / error de red ──');
  errors.forEach((r) => console.log(`  ${r.status || 'ERR'} ${r.url}${r.error ? ' — ' + r.error : ''}`));
}

process.exit(bad.length || errors.length ? 1 : 0);
