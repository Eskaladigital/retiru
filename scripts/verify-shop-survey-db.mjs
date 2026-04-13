#!/usr/bin/env node
/**
 * Verifica en Supabase (proyecto de .env.local) la encuesta de interés de la tienda:
 * tabla `shop_product_interests`, RPC `get_shop_interest_stats`, y que dos sesiones anónimas
 * distintas puedan votar la misma categoría (requiere migración 032 si falla).
 *
 * Uso: node scripts/verify-shop-survey-db.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ No se encontró .env.local');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
if (!service) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY (necesaria para limpiar filas de prueba)');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(url, service, { auth: { persistSession: false } });
const anonClient = createClient(url, anon, { auth: { persistSession: false } });

const TEST_CAT = 'esterillas-yoga';
const S1 = 'retiru-survey-verify-s1';
const S2 = 'retiru-survey-verify-s2';

async function cleanup() {
  await admin.from('shop_product_interests').delete().in('session_id', [S1, S2]);
}

async function main() {
  console.log('\n🔍 Verificación BD · encuesta tienda (shop_product_interests)\n');

  const { error: tErr } = await admin.from('shop_product_interests').select('id').limit(1);
  if (tErr) {
    console.error('❌ Tabla shop_product_interests:', tErr.message);
    console.error('   → Ejecuta en Supabase las migraciones 030 (y 032 para unicidad anónima).');
    process.exit(1);
  }
  console.log('✅ Tabla shop_product_interests accesible (service role).');

  const { data: stats, error: rpcErr } = await admin.rpc('get_shop_interest_stats');
  if (rpcErr) {
    console.error('❌ RPC get_shop_interest_stats:', rpcErr.message);
    process.exit(1);
  }
  console.log(`✅ RPC get_shop_interest_stats OK (${Array.isArray(stats) ? stats.length : 0} filas agregadas).`);

  await cleanup();

  const row1 = {
    user_id: null,
    session_id: S1,
    product_category: TEST_CAT,
    interest_level: 3,
    comments: null,
  };
  const row2 = {
    user_id: null,
    session_id: S2,
    product_category: TEST_CAT,
    interest_level: 4,
    comments: null,
  };

  const { error: ins1 } = await anonClient.from('shop_product_interests').insert(row1);
  if (ins1) {
    console.error('❌ Insert anónimo (sesión 1):', ins1.message);
    await cleanup();
    process.exit(1);
  }
  console.log('✅ Insert anónimo sesión 1 OK (RLS insert).');

  const { error: ins2 } = await anonClient.from('shop_product_interests').insert(row2);
  if (ins2) {
    console.error('❌ Insert anónimo (sesión 2, misma categoría):', ins2.message);
    console.error('   → Aplica supabase/migrations/032_shop_product_interests_unique_fix.sql en el SQL Editor.');
    await cleanup();
    process.exit(1);
  }
  console.log('✅ Dos sesiones anónimas pueden votar la misma categoría (unicidad correcta).');

  await cleanup();
  console.log('✅ Filas de prueba eliminadas.\n');
  console.log('✅ Verificación completada.\n');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
