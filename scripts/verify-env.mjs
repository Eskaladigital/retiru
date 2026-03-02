#!/usr/bin/env node
/**
 * RETIRU · Verificación de variables de entorno y conexión Supabase
 * Carga .env.local y comprueba que las variables existan y Supabase responda.
 *
 * Uso: node scripts/verify-env.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Cargar .env.local
function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.warn('⚠ .env.local no encontrado. Usando variables del sistema.');
    return;
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

const REQUIRED = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'URL del proyecto Supabase' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Clave anónima (pública) Supabase' },
];

const OPTIONAL = [
  { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Service role (solo servidor)' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', desc: 'Stripe PK' },
  { key: 'STRIPE_SECRET_KEY', desc: 'Stripe SK' },
  { key: 'STRIPE_WEBHOOK_SECRET', desc: 'Stripe webhook secret' },
  { key: 'RESEND_API_KEY', desc: 'Resend para emails' },
  { key: 'NEXT_PUBLIC_APP_URL', desc: 'URL de la app' },
];

const PLACEHOLDERS = ['your_supabase_url', 'your_supabase_anon_key', 'your_service_role_key'];

function isPlaceholder(val) {
  return PLACEHOLDERS.some((p) => val?.includes(p));
}

async function main() {
  console.log('\n🔍 RETIRU · Verificación de entorno\n');

  let hasErrors = false;

  for (const { key, desc } of REQUIRED) {
    const val = process.env[key];
    if (!val) {
      console.error(`❌ ${key}: FALTA (${desc})`);
      hasErrors = true;
    } else if (isPlaceholder(val)) {
      console.error(`❌ ${key}: Valor placeholder, reemplaza con datos reales`);
      hasErrors = true;
    } else {
      const masked = val.length > 20 ? val.slice(0, 8) + '...' + val.slice(-4) : '***';
      console.log(`✅ ${key}: ${masked}`);
    }
  }

  console.log('\nOpcionales:');
  for (const { key, desc } of OPTIONAL) {
    const val = process.env[key];
    if (val && !isPlaceholder(val)) {
      console.log(`  ✅ ${key}`);
    } else if (val && isPlaceholder(val)) {
      console.log(`  ⚠ ${key}: placeholder`);
    } else {
      console.log(`  ○ ${key}: no definido (${desc})`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Corrige las variables requeridas en .env.local y vuelve a ejecutar.');
    process.exit(1);
  }

  // Test conexión Supabase
  console.log('\n🔌 Probando conexión a Supabase...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('categories').select('id, name_es').limit(1);

    if (error) {
      console.error('❌ Error al conectar:', error.message);
      if (error.code === 'PGRST301') {
        console.log('   → ¿Ejecutaste la migración inicial? (supabase db push o SQL en dashboard)');
      }
      process.exit(1);
    }

    console.log('✅ Conexión OK. Tabla categories accesible.');
    if (data?.length) {
      console.log(`   Ejemplo: ${data[0].name_es}`);
    } else {
      console.log('   (tabla vacía - ejecuta el seed: supabase db seed)');
    }

    // Probar destinations
    const { data: dests, error: errDest } = await supabase.from('destinations').select('id, name_es').limit(1);
    if (!errDest) {
      console.log('✅ Tabla destinations OK');
    } else {
      console.log('⚠ destinations:', errDest.message);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }

  console.log('\n✅ Verificación completada.\n');
}

main();
