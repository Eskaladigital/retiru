#!/usr/bin/env node
/**
 * RETIRU · Informe: instagram / facebook en centros
 *
 * Lee `.env.local` (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Uso:
 *   node scripts/report-center-socials.mjs
 *   node scripts/report-center-socials.mjs --list        # lista slugs con web y sin redes
 *   node scripts/report-center-socials.mjs --list-all  # todas las filas (slug + columnas)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error('❌ No se encontró .env.local en la raíz del proyecto.');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function empty(v) {
  return v == null || String(v).trim() === '';
}

function parseArgs() {
  const a = process.argv.slice(2);
  return {
    list: a.includes('--list'),
    listAll: a.includes('--list-all'),
  };
}

loadEnvLocal();
const { list, listAll } = parseArgs();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

const SELECT_WITH_FB =
  'id, slug, name, status, website, instagram, facebook';

async function fetchRows() {
  let { data, error } = await supabase.from('centers').select(SELECT_WITH_FB).order('name');
  if (error?.code === '42703' || /facebook/.test(String(error?.message || '').toLowerCase())) {
    console.warn('⚠️  La columna `facebook` no existe aún. Aplica la migración `026_centers_facebook.sql` en Supabase.\n   Mostrando solo `instagram`.\n');
    ({ data, error } = await supabase
      .from('centers')
      .select('id, slug, name, status, website, instagram')
      .order('name'));
  }
  if (error) {
    console.error('❌ Error Supabase:', error.message);
    process.exit(1);
  }
  return data || [];
}

const rows = await fetchRows();
const hasFacebookCol = rows.length > 0 && 'facebook' in rows[0];

const total = rows.length;
const active = rows.filter((r) => r.status === 'active').length;

let noIg = 0;
let noFb = 0;
let noBoth = 0;
let webNoIg = 0;
let webNoFb = 0;

for (const r of rows) {
  const ig = empty(r.instagram);
  const fb = hasFacebookCol ? empty(r.facebook) : true;
  if (ig) noIg++;
  if (fb) noFb++;
  if (ig && fb) noBoth++;
  if (!empty(r.website)) {
    if (ig) webNoIg++;
    if (hasFacebookCol && fb) webNoFb++;
  }
}

console.log('═══ Centros · redes sociales ═══\n');
console.log(`Total filas en centers:     ${total}`);
console.log(`Estado active:              ${active}`);
console.log(`Sin Instagram (vacío):     ${noIg}`);
if (hasFacebookCol) {
  console.log(`Sin Facebook (vacío):      ${noFb}`);
  console.log(`Sin Instagram ni Facebook: ${noBoth}`);
} else {
  console.log(`Sin Facebook:              (columna no creada)`);
}
console.log(`Con website y sin Instagram: ${webNoIg}`);
if (hasFacebookCol) {
  console.log(`Con website y sin Facebook:  ${webNoFb}`);
}
console.log('');

if (listAll) {
  console.log('── Listado (slug · instagram · facebook · website) ──\n');
  for (const r of rows) {
    const ig = empty(r.instagram) ? '—' : String(r.instagram).trim();
    const fb = hasFacebookCol ? (empty(r.facebook) ? '—' : String(r.facebook).trim()) : 'N/A';
    const w = empty(r.website) ? '—' : String(r.website).trim();
    console.log(`${r.slug}\tIG:${ig}\tFB:${fb}\tWEB:${w}`);
  }
  process.exit(0);
}

if (list) {
  console.log('── Centros con website pero SIN Instagram (candidatos a rellenar) ──\n');
  const cand = rows.filter((r) => !empty(r.website) && empty(r.instagram));
  if (cand.length === 0) {
    console.log('(ninguno)');
  } else {
    for (const r of cand) {
      console.log(`${r.slug}\t${r.name}\t${String(r.website).trim()}`);
    }
  }
  if (hasFacebookCol) {
    console.log('\n── Centros con website pero SIN Facebook ──\n');
    const candFb = rows.filter((r) => !empty(r.website) && empty(r.facebook));
    if (candFb.length === 0) {
      console.log('(ninguno)');
    } else {
      for (const r of candFb) {
        console.log(`${r.slug}\t${r.name}\t${String(r.website).trim()}`);
      }
    }
  }
}
