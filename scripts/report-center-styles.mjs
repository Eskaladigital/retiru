#!/usr/bin/env node
/**
 * Informe rápido del estado de center_styles:
 * - Distribución por estilo (total y por centro)
 * - Centros sin estilo asignado
 * - Pares (estilo, provincia) con count >= umbral
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
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
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const MIN_PROV = parseInt(process.argv.find((a) => a.startsWith('--min-prov='))?.split('=')[1] || '5', 10);
const MIN_NAT = parseInt(process.argv.find((a) => a.startsWith('--min-nat='))?.split('=')[1] || '3', 10);

const { data: styles } = await admin.from('styles').select('id, slug, name_es, center_type').eq('is_active', true);
const styleById = new Map(styles.map((s) => [s.id, s]));

const { data: cs } = await admin.from('center_styles').select('center_id, style_id');
const byStyle = new Map();
const byCenter = new Map();
for (const r of cs || []) {
  byStyle.set(r.style_id, (byStyle.get(r.style_id) || 0) + 1);
  byCenter.set(r.center_id, (byCenter.get(r.center_id) || 0) + 1);
}

const { data: allCenters } = await admin
  .from('centers')
  .select('id, slug, type, province')
  .eq('status', 'active')
  .in('type', ['yoga', 'meditation', 'ayurveda']);

const withStyles = allCenters.filter((c) => (byCenter.get(c.id) || 0) > 0);
const withoutStyles = allCenters.filter((c) => (byCenter.get(c.id) || 0) === 0);

console.log('=== Distribución por estilo ===');
const rows = [...byStyle.entries()]
  .map(([id, n]) => ({ s: styleById.get(id), n }))
  .filter((r) => r.s)
  .sort((a, b) => b.n - a.n);
for (const { s, n } of rows) {
  console.log(`  ${String(n).padStart(4)} · ${s.center_type.padEnd(9)} · ${s.slug.padEnd(22)} · ${s.name_es}`);
}

const unused = styles.filter((s) => !byStyle.has(s.id));
if (unused.length) {
  console.log(`\nEstilos del catálogo SIN asignaciones (${unused.length}):`);
  for (const u of unused) console.log(`  · ${u.center_type} · ${u.slug}`);
}

console.log(`\n=== Cobertura ===`);
console.log(`  Centros activos (yoga/medit/ayurveda): ${allCenters.length}`);
console.log(`  Con al menos un estilo: ${withStyles.length} (${Math.round((withStyles.length / allCenters.length) * 100)}%)`);
console.log(`  Sin ningún estilo: ${withoutStyles.length}`);

const pairCounts = new Map();
for (const r of cs) {
  const s = styleById.get(r.style_id);
  const c = allCenters.find((cc) => cc.id === r.center_id);
  if (!s || !c || !c.province) continue;
  const key = `${s.slug}||${c.province}`;
  pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
}
const provPairs = [...pairCounts.entries()].map(([k, n]) => { const [slug, prov] = k.split('||'); return { slug, prov, n }; });
const eligibleProv = provPairs.filter((p) => p.n >= MIN_PROV);
console.log(`\n=== Páginas provinciales potenciales (>= ${MIN_PROV} centros) ===`);
console.log(`  Total: ${eligibleProv.length}`);
const topProv = [...eligibleProv].sort((a, b) => b.n - a.n).slice(0, 15);
for (const p of topProv) console.log(`  ${String(p.n).padStart(3)} · ${p.slug.padEnd(22)} · ${p.prov}`);

const natCounts = new Map();
for (const p of provPairs) natCounts.set(p.slug, (natCounts.get(p.slug) || 0) + p.n);
const eligibleNat = [...natCounts.entries()].filter(([, n]) => n >= MIN_NAT);
console.log(`\n=== Páginas nacionales potenciales (>= ${MIN_NAT} centros) ===`);
console.log(`  Total: ${eligibleNat.length}`);
for (const [slug, n] of eligibleNat.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)} · ${slug}`);
}
