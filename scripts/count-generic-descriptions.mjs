#!/usr/bin/env node
/**
 * RETIRU · Contar o vaciar centros con descripción genérica
 * Uso: node scripts/count-generic-descriptions.mjs [--vaciar]
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
const suffix = 'Descripción generada automáticamente. Puedes completarla desde el panel de administración.';
const vaciar = process.argv.includes('--vaciar');

// Obtener IDs de centros con descripción genérica
let allIds = [];
let offset = 0;
const pageSize = 100;
while (true) {
  const { data, error } = await supabase
    .from('centers')
    .select('id')
    .ilike('description_es', '%' + suffix)
    .range(offset, offset + pageSize - 1);
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  allIds = allIds.concat(data.map((r) => r.id));
  if (data.length < pageSize) break;
  offset += pageSize;
}

console.log('Centros con descripción genérica:', allIds.length);

if (vaciar && allIds.length > 0) {
  const BATCH = 50;
  let updated = 0;
  for (let i = 0; i < allIds.length; i += BATCH) {
    const batch = allIds.slice(i, i + BATCH);
    const { error } = await supabase
      .from('centers')
      .update({ description_es: '', description_ai_generated_at: null })
      .in('id', batch);
    if (error) {
      console.error('Error al actualizar batch:', error.message);
      process.exit(1);
    }
    updated += batch.length;
    console.log(`  Actualizados ${updated}/${allIds.length}...`);
  }
  console.log('✅ Descripciones genéricas vaciadas. El admin mostrará', allIds.length, 'sin descripción.');
} else if (!vaciar) {
  console.log('  Ejecuta con --vaciar para vaciarlas.');
}
