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

const { count: total } = await supabase.from('retreats').select('*', { count: 'exact', head: true });
const { count: published } = await supabase.from('retreats').select('*', { count: 'exact', head: true }).eq('status', 'published');
const { count: draft } = await supabase.from('retreats').select('*', { count: 'exact', head: true }).eq('status', 'draft');

const { data: sample } = await supabase.from('retreats').select('id, title_es, slug, status, published_at, start_date').limit(10);

console.log('Total retiros:', total);
console.log('Publicados:', published);
console.log('Borrador:', draft);
console.log('\nMuestra:');
if (sample) sample.forEach(r => console.log(`  [${r.status}] ${r.title_es} (${r.slug}) - inicio: ${r.start_date}`));
else console.log('  No hay retiros en la BD.');
