#!/usr/bin/env node
// Prueba manual del cliente SerpApi. Uso:
//   node scripts/serp-probe.mjs "centros de ayurveda en Álava"
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
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
}

const { serpSearch } = await import('./lib/serpapi.mjs');

const query = process.argv.slice(2).join(' ') || 'centros de ayurveda en Álava';
console.log(`\n🔍 Query: "${query}"\n`);

const r = await serpSearch({ query });
console.log(`From cache: ${r.from_cache}\n`);
console.log(`PAA (${r.paa.length}):`);
r.paa.forEach((q, i) => console.log(`  ${i + 1}. ${q.question}`));
console.log(`\nRelated searches (${r.related.length}):`);
r.related.slice(0, 12).forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
console.log(`\nLocal pack (${r.local_pack.length}):`);
r.local_pack.slice(0, 5).forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.rating ?? '—'}⭐ · ${p.reviews ?? 0} reseñas)`));
console.log(`\nFeatured snippet: ${r.featured_snippet ? r.featured_snippet.slice(0, 160) + '...' : '—'}`);
console.log(`Answer box: ${r.answer_box ?? '—'}`);
