#!/usr/bin/env node
/**
 * Lista retiros revisados/publicados según reviewed_at · día civil Europe/Madrid.
 * Usa .env.local (service role recomendado).
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
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[k] = v;
      }
    }
  });
}

function madridYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function madridYmdFromIso(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o clave Supabase');
  process.exit(1);
}

async function rest(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('HTTP', res.status, text.slice(0, 400));
    process.exit(1);
  }
  return JSON.parse(text);
}

const todayMadrid = madridYmd();

async function main() {
  const horizon = encodeURIComponent(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  /** Últimos 30 días con revisión para filtrar en cliente (reviewed_at not null implícito) */
  const path =
    `retreats?reviewed_at=not.is.null&reviewed_at=gte.${horizon}` +
    `&select=id,title_es,slug,status,reviewed_at,reviewed_by,published_at,organizer_id` +
    `&order=reviewed_at.desc&limit=200`;

  const rows = await rest(path);
  const hit = rows.filter((r) => madridYmdFromIso(r.reviewed_at) === todayMadrid);

  if (!hit.length) {
    console.log(`No hay retiros con reviewed_at hoy (${todayMadrid} · Europa/Madrid) en ventana últimos ~30 días.`);
    return;
  }

  const orgIds = [...new Set(hit.map((r) => r.organizer_id).filter(Boolean))];
  let orgNames = {};
  if (orgIds.length) {
    const inClause = orgIds.join(',');
    const orgRows = await rest(`organizer_profiles?id=in.(${inClause})&select=id,business_name`);
    orgNames = Object.fromEntries(orgRows.map((o) => [o.id, o.business_name]));
  }

  console.log(`${hit.length} retiro(s) con reviewed_at · ${todayMadrid} (Madrid), orden reviewed_at descendente:\n`);
  for (const r of hit) {
    console.log('-', r.title_es);
    console.log('  slug:', r.slug);
    console.log('  status:', r.status);
    console.log('  reviewed_at (UTC BD):', r.reviewed_at);
    console.log('  published_at:', r.published_at || '—');
    console.log('  organizador:', orgNames[r.organizer_id] || r.organizer_id);
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
