#!/usr/bin/env node
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { count: total } = await sb.from('centers').select('*', { count: 'exact', head: true });
const { count: sinDesc } = await sb.from('centers').select('*', { count: 'exact', head: true }).or('description_es.is.null,description_es.eq.');
const { count: sinEmail } = await sb.from('centers').select('*', { count: 'exact', head: true }).or('email.is.null,email.eq.');
const { count: conEmail } = await sb.from('centers').select('*', { count: 'exact', head: true }).not('email', 'is', null).not('email', 'eq', '');

// Centros con descripción pero corta (< 80 chars = "sin descripción" en admin)
const { data: all } = await sb.from('centers').select('id, description_es');
let descCorta = 0;
let descOk = 0;
for (const c of all || []) {
  const d = (c.description_es || '').trim();
  if (d.length === 0) continue; // ya contados en sinDesc
  if (d.length < 80) descCorta++;
  else descOk++;
}

console.log('═══ ESTADÍSTICAS DE CENTROS ═══');
console.log(`Total centros:          ${total}`);
console.log('');
console.log('── Descripción ──');
console.log(`Sin descripción (vacía): ${sinDesc}`);
console.log(`Descripción corta (<80): ${descCorta}`);
console.log(`Con buena descripción:   ${descOk}`);
console.log('');
console.log('── Email ──');
console.log(`Sin email:               ${sinEmail}`);
console.log(`Con email:               ${conEmail}`);
