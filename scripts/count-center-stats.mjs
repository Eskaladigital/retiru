#!/usr/bin/env node
/**
 * RETIRU · Estadísticas de centros
 * Uso: node scripts/count-center-stats.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local no encontrado');
  process.exit(1);
}
const content = readFileSync(envPath, 'utf8');
content.split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { count: total } = await supabase.from('centers').select('*', { count: 'exact', head: true });
const { count: sinEmail } = await supabase.from('centers').select('*', { count: 'exact', head: true }).or('email.is.null,email.eq.');
const { count: conEmail } = await supabase.from('centers').select('*', { count: 'exact', head: true }).not('email', 'is', null).not('email', 'eq', '');

console.log('Total centros:', total);
console.log('Sin email:', sinEmail);
console.log('Con email:', conEmail);
