#!/usr/bin/env node
/**
 * Verifica en Supabase (proyecto de .env.local) que el esquema esperado por la app
 * esté presente: columnas, tablas clave, enum verification_step (vía filtro),
 * bucket organizer-docs, user_roles, y opcionalmente tienda (030/032).
 *
 * Uso: npm run db:verify-schema
 *      node scripts/verify-schema-db.mjs
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
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(url, service, { auth: { persistSession: false } });

let failures = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

function fail(msg, detail) {
  failures += 1;
  console.log(`  ❌ ${msg}`);
  if (detail) console.log(`     ${detail}`);
}

async function check(name, fn) {
  console.log(`\n▸ ${name}`);
  try {
    await fn();
  } catch (e) {
    fail('Excepción', e?.message || String(e));
  }
}

await check('organizer_profiles · columna contract_accepted_at', async () => {
  const { error } = await admin.from('organizer_profiles').select('id, contract_accepted_at').limit(1);
  if (error) {
    if (/column|does not exist|schema cache/i.test(error.message)) {
      fail('Select contract_accepted_at', error.message);
    } else {
      fail('Select organizer_profiles', error.message);
    }
  } else {
    ok('organizer_profiles incluye contract_accepted_at');
  }
});

await check('organizer_verification_steps · columna file_url y step enum', async () => {
  const { error } = await admin.from('organizer_verification_steps').select('id, file_url, step').limit(1);
  if (error) {
    fail('Select pasos', error.message);
    return;
  }
  ok('organizer_verification_steps incluye file_url');

  const { error: e2 } = await admin
    .from('organizer_verification_steps')
    .select('id')
    .eq('step', 'economic_activity')
    .limit(1);
  if (e2) {
    fail('Filtro step = economic_activity (¿ejecutaste 031a antes de 031b?)', e2.message);
  } else {
    ok("enum incluye 'economic_activity'");
  }

  const { error: e3 } = await admin.from('organizer_verification_steps').select('id').eq('step', 'insurance').limit(1);
  if (e3) {
    fail("Filtro step = 'insurance'", e3.message);
  } else {
    ok("enum incluye 'insurance'");
  }
});

await check('user_roles (multi-rol)', async () => {
  const { error } = await admin.from('user_roles').select('user_id, role').limit(1);
  if (error) fail('Tabla user_roles', error.message);
  else ok('user_roles accesible');
});

await check('Storage · bucket organizer-docs', async () => {
  const { data, error } = await admin.storage.from('organizer-docs').list('', { limit: 1 });
  if (error) {
    fail('Bucket organizer-docs', error.message);
  } else {
    ok(`bucket organizer-docs OK (${Array.isArray(data) ? data.length : 0} objetos listados en raíz)`);
  }
});

await check('Coherencia · pasos de verificación por organizador', async () => {
  const failsBefore = failures;
  const { data: orgs, error } = await admin.from('organizer_profiles').select('id, status').limit(500);
  if (error) {
    fail('Listar organizadores', error.message);
    return;
  }
  if (!orgs?.length) {
    ok('Sin organizer_profiles (nada que comprobar)');
    return;
  }

  const { data: steps, error: sErr } = await admin
    .from('organizer_verification_steps')
    .select('organizer_id, step')
    .in(
      'organizer_id',
      orgs.map((o) => o.id),
    );

  if (sErr) {
    fail('Listar pasos', sErr.message);
    return;
  }

  const expected = new Set(['identity_doc', 'economic_activity', 'insurance', 'tax_info', 'bank_info']);
  const byOrg = new Map();
  for (const row of steps || []) {
    if (!byOrg.has(row.organizer_id)) byOrg.set(row.organizer_id, new Set());
    byOrg.get(row.organizer_id).add(row.step);
  }

  let warnLegacy = 0;
  for (const o of orgs) {
    const set = byOrg.get(o.id);
    if (!set || set.size === 0) {
      fail(`Organizador ${o.id} sin filas en organizer_verification_steps`);
      continue;
    }
    if (set.has('personal_data')) {
      warnLegacy += 1;
    }
    for (const step of expected) {
      if (!set.has(step)) {
        fail(`Organizador ${o.id} falta paso "${step}"`);
      }
    }
  }

  if (warnLegacy > 0) {
    console.log(`  ⚠ ${warnLegacy} organizador(es) aún tienen paso legacy 'personal_data' (puedes borrarlo a mano si molesta).`);
  }
  if (failures === failsBefore) {
    ok(`Todos los organizadores muestreados tienen los 5 pasos esperados (${orgs.length} filas).`);
  }
});

await check('Opcional · shop_product_interests (migración 030)', async () => {
  const { error } = await admin.from('shop_product_interests').select('id').limit(1);
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      console.log('  ⏭ Tabla no existe (no aplicaste 030); omitido.');
    } else {
      fail('shop_product_interests', error.message);
    }
  } else {
    ok('shop_product_interests accesible');
  }
});

console.log('\n' + '─'.repeat(56));
if (failures > 0) {
  console.log(`\n❌ Verificación terminada con ${failures} error(es).\n`);
  process.exit(1);
}
console.log('\n✅ Verificación de esquema completada sin errores críticos.\n');
process.exit(0);
