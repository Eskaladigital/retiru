#!/usr/bin/env node
/**
 * Lista organizadores verificados recientes (usa .env.local, service role o anon).
 * Uso: node scripts/peek-organizer-verifications.mjs [--limit=30]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('No se encontró .env.local');
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

function argLimit() {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  if (!a) return 30;
  const n = Number.parseInt(a.slice(8), 10);
  return Number.isFinite(n) && n > 0 && n <= 200 ? n : 30;
}

loadEnvLocal();

const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const limit = argLimit();

if (!base || !key) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o clave Supabase');
  process.exit(1);
}

async function restGet(pathAndQuery) {
  const res = await fetch(`${base}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

async function main() {
  const orgs = await restGet(
    `organizer_profiles?status=eq.verified&select=id,business_name,slug,verified_at,verified_by,user_id&order=verified_at.desc.nullslast&limit=${limit}`,
  );

  if (!orgs.length) {
    console.log('No hay filas con status=verified.');
    return;
  }

  const ids = [...new Set(orgs.map((o) => o.user_id).filter(Boolean))];
  const inList = ids.join(',');
  let profilesById = {};
  if (inList) {
    const profs = await restGet(`profiles?id=in.(${inList})&select=id,email,preferred_locale`);
    profilesById = Object.fromEntries(profs.map((p) => [p.id, p]));
  }

  console.log(`Últimos ${orgs.length} organizadores con status verified (por verified_at desc):\n`);
  for (const o of orgs) {
    const p = profilesById[o.user_id];
    const email = p?.email ?? '(sin email en profiles)';
    const loc = p?.preferred_locale ?? '';
    console.log(
      [
        `- ${o.business_name || '(sin nombre)'}`,
        `  slug: ${o.slug}`,
        `  verified_at: ${o.verified_at ?? '(null)'}`,
        `  email: ${email}${loc ? ` · locale: ${loc}` : ''}`,
        `  id perfil: ${o.id}`,
      ].join('\n'),
    );
    console.log('');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
