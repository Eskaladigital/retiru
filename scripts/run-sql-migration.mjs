#!/usr/bin/env node
/**
 * Ejecuta un archivo .sql contra Postgres usando DATABASE_URL.
 * Carga .env.local (misma lógica que verify-env.mjs).
 *
 * Añade en .env.local la URI de Supabase:
 * Dashboard → Project Settings → Database → Connection string → URI
 * (modo "Session" o "Transaction" del pooler; incluye la contraseña de DB).
 *
 * Uso: node scripts/run-sql-migration.mjs supabase/migrations/033_fix_signup_trigger_chain.sql
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
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

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('Uso: node scripts/run-sql-migration.mjs <ruta-al.sql>');
  process.exit(1);
}

const fullPath = join(root, sqlPath);
if (!existsSync(fullPath)) {
  console.error('No existe el archivo:', fullPath);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error(
    'Falta DATABASE_URL (o DIRECT_URL / SUPABASE_DB_URL) en .env.local.\n' +
      'Obtén la URI en Supabase: Settings → Database → Connection string (URI).\n' +
      'Sin eso no puedo ejecutar SQL desde aquí; puedes pegar el contenido del archivo en el SQL Editor del dashboard.'
  );
  process.exit(1);
}

const sql = readFileSync(fullPath, 'utf8');
const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log('✅ SQL aplicado correctamente:', sqlPath);
} catch (e) {
  console.error('❌ Error ejecutando SQL:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
