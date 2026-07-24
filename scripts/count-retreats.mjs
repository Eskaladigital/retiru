#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('No .env.local'); process.exit(1); }
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Si la consulta falla (red con proxy TLS, credenciales, etc.) hay que verlo,
// no mostrar "No hay retiros" como si la BD estuviera vacía.
function fail(context, error) {
  console.error(`❌  Error consultando Supabase (${context}):`);
  console.error('   ', error.message || error);
  if (String(error.message || '').includes('fetch failed')) {
    console.error('    Pista: si tu red intercepta TLS (proxy/antivirus), prueba con');
    console.error('    NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/count-retreats.mjs');
  }
  process.exit(1);
}

const totalRes = await supabase.from('retreats').select('*', { count: 'exact', head: true });
if (totalRes.error) fail('total', totalRes.error);
const publishedRes = await supabase.from('retreats').select('*', { count: 'exact', head: true }).eq('status', 'published');
if (publishedRes.error) fail('publicados', publishedRes.error);
const draftRes = await supabase.from('retreats').select('*', { count: 'exact', head: true }).eq('status', 'draft');
if (draftRes.error) fail('borradores', draftRes.error);

const sampleRes = await supabase.from('retreats').select('id, title_es, slug, status, published_at, start_date').limit(10);
if (sampleRes.error) fail('muestra', sampleRes.error);

console.log('Total retiros:', totalRes.count);
console.log('Publicados:', publishedRes.count);
console.log('Borrador:', draftRes.count);
console.log('\nMuestra:');
if (sampleRes.data?.length) sampleRes.data.forEach(r => console.log(`  [${r.status}] ${r.title_es} (${r.slug}) - inicio: ${r.start_date}`));
else console.log('  No hay retiros en la BD.');
