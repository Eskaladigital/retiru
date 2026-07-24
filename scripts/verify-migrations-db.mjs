// ============================================================================
// RETIRU · Verificación de esquema: migraciones vs base de datos real
// ----------------------------------------------------------------------------
// Parsea supabase/migrations/*.sql para construir el estado esperado
// (tablas + columnas, vistas, buckets de Storage) y lo contrasta contra el
// proyecto enlazado en .env.local usando la service role vía PostgREST.
//
// Limitación: funciones, triggers, políticas RLS, índices y valores de enums
// no son verificables por PostgREST (requieren acceso SQL directo); el script
// los contabiliza como «no verificables».
//
// Uso: npm run db:verify-schema
//      (con proxy corporativo: $env:NODE_TLS_REJECT_UNAUTHORIZED='0')
// ============================================================================
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const MIGRATIONS_DIR = 'supabase/migrations';

// ─── .env.local ──────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── Parseo de migraciones ───────────────────────────────────────────────────
const CONSTRAINT_KEYWORDS = /^(CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|EXCLUDE|LIKE)\b/i;

function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, '');
}

/** Divide el cuerpo de un CREATE TABLE en definiciones (comas a profundidad 0, fuera de strings). */
function splitDefs(body) {
  const defs = [];
  let depth = 0, inString = false, cur = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'") inString = !inString; // '' escapado alterna dos veces y queda igual
    if (!inString) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { defs.push(cur); cur = ''; continue; }
    }
    cur += ch;
  }
  if (cur.trim()) defs.push(cur);
  return defs;
}

/** Extrae el cuerpo entre paréntesis de un CREATE TABLE a partir de un índice (ignora strings). */
function extractParenBody(sql, fromIdx) {
  const open = sql.indexOf('(', fromIdx);
  if (open === -1) return null;
  let depth = 0, inString = false;
  for (let i = open; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inString = !inString;
    if (inString) continue;
    if (ch === '(') depth++;
    if (ch === ')') { depth--; if (depth === 0) return sql.slice(open + 1, i); }
  }
  return null;
}

const tables = new Map(); // nombre → Set(columnas)
const views = new Set();
const buckets = new Set();
const notVerifiable = { functions: 0, triggers: 0, policies: 0, indexes: 0, types: 0, alterType: 0 };
const warnings = [];

const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  const sql = stripComments(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));

  // CREATE TABLE
  for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?([a-z_][a-z0-9_]*)/gi)) {
    const name = m[1].toLowerCase();
    const body = extractParenBody(sql, m.index);
    if (!body) { warnings.push(`${file}: no pude parsear columnas de ${name}`); continue; }
    const cols = tables.get(name) ?? new Set();
    for (const def of splitDefs(body)) {
      const trimmed = def.trim();
      if (!trimmed || CONSTRAINT_KEYWORDS.test(trimmed)) continue;
      const col = trimmed.match(/^"?([a-z_][a-z0-9_]*)"?/i)?.[1];
      if (col) cols.add(col.toLowerCase());
    }
    tables.set(name, cols);
  }

  // Sentencia a sentencia para ALTER/DROP/VIEW/buckets
  for (const stmtRaw of sql.split(';')) {
    const stmt = stmtRaw.trim();
    if (!stmt) continue;

    let m;
    if ((m = stmt.match(/^ALTER TABLE (?:IF EXISTS )?(?:ONLY )?(?:public\.)?([a-z_][a-z0-9_]*)/i))) {
      const t = m[1].toLowerCase();
      if (['objects', 'buckets'].includes(t)) continue; // storage.*
      if (/RENAME TO/i.test(stmt)) { warnings.push(`RENAME TABLE no soportado: ${stmt.slice(0, 80)}`); continue; }
      const cols = tables.get(t);
      for (const add of stmt.matchAll(/ADD COLUMN (?:IF NOT EXISTS )?"?([a-z_][a-z0-9_]*)"?/gi)) {
        cols ? cols.add(add[1].toLowerCase()) : warnings.push(`ADD COLUMN sobre tabla desconocida ${t} (${file})`);
      }
      for (const drop of stmt.matchAll(/DROP COLUMN (?:IF EXISTS )?"?([a-z_][a-z0-9_]*)"?/gi)) {
        cols?.delete(drop[1].toLowerCase());
      }
      const ren = stmt.match(/RENAME COLUMN "?([a-z_][a-z0-9_]*)"? TO "?([a-z_][a-z0-9_]*)"?/i);
      if (ren && cols) { cols.delete(ren[1].toLowerCase()); cols.add(ren[2].toLowerCase()); }
    } else if ((m = stmt.match(/^DROP TABLE (?:IF EXISTS )?(?:public\.)?([a-z_][a-z0-9_]*)/i))) {
      tables.delete(m[1].toLowerCase());
    } else if ((m = stmt.match(/^CREATE (?:OR REPLACE )?VIEW (?:public\.)?([a-z_][a-z0-9_]*)/i))) {
      views.add(m[1].toLowerCase());
    } else if ((m = stmt.match(/^DROP VIEW (?:IF EXISTS )?(?:public\.)?([a-z_][a-z0-9_]*)/i))) {
      views.delete(m[1].toLowerCase());
    } else if (/^INSERT INTO storage\.buckets/i.test(stmt)) {
      const valuesPart = stmt.match(/VALUES([\s\S]*)/i)?.[1] ?? '';
      for (const tuple of valuesPart.matchAll(/\(\s*'([^']+)'/g)) buckets.add(tuple[1]);
    } else if (/^CREATE (OR REPLACE )?FUNCTION/i.test(stmt)) notVerifiable.functions++;
    else if (/^CREATE TRIGGER/i.test(stmt)) notVerifiable.triggers++;
    else if (/^CREATE POLICY/i.test(stmt)) notVerifiable.policies++;
    else if (/^CREATE (UNIQUE )?INDEX/i.test(stmt)) notVerifiable.indexes++;
    else if (/^CREATE TYPE/i.test(stmt)) notVerifiable.types++;
    else if (/^ALTER TYPE/i.test(stmt)) notVerifiable.alterType++;
  }
}

// ─── Verificación contra la BD ───────────────────────────────────────────────
let okTables = 0;
const problems = [];

for (const [table, cols] of [...tables.entries()].sort()) {
  const colList = [...cols];
  const { error } = await supabase.from(table).select(colList.join(',')).limit(0);
  if (!error) { okTables++; continue; }

  // Afinar: ¿falta la tabla entera o columnas concretas?
  const { error: tableErr } = await supabase.from(table).select('*').limit(0);
  if (tableErr) {
    problems.push(`TABLA AUSENTE ${table}: ${tableErr.message}`);
    continue;
  }
  const missing = [];
  for (const col of colList) {
    const { error: colErr } = await supabase.from(table).select(col).limit(0);
    if (colErr) missing.push(col);
  }
  problems.push(`COLUMNAS AUSENTES en ${table}: ${missing.join(', ') || `(error: ${error.message})`}`);
}

let okViews = 0;
for (const view of [...views].sort()) {
  const { error } = await supabase.from(view).select('*').limit(0);
  error ? problems.push(`VISTA AUSENTE ${view}: ${error.message}`) : okViews++;
}

// Spot-checks de enums ampliados por ALTER TYPE (PostgREST valida el literal al filtrar)
// y de las RPC usadas por el flujo de reservas (llamadas con UUID inexistente = no-op).
const ENUM_SPOT_CHECKS = [
  ['bookings', 'status', 'reserved_no_payment'],          // 022
  ['centers', 'type', 'ayurveda'],                        // 009/014
  ['organizer_verification_steps', 'step', 'economic_activity'], // 031a
  ['organizer_verification_steps', 'step', 'insurance'],  // 031a
];
let okEnums = 0;
for (const [table, column, value] of ENUM_SPOT_CHECKS) {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).eq(column, value).limit(0);
  error
    ? problems.push(`ENUM: ${table}.${column} no acepta '${value}': ${error.message}`)
    : okEnums++;
}

const RPC_SPOT_CHECKS = ['increment_confirmed_bookings', 'decrement_confirmed_bookings'];
let okRpcs = 0;
for (const fn of RPC_SPOT_CHECKS) {
  const { error } = await supabase.rpc(fn, { retreat_id_param: '00000000-0000-0000-0000-000000000000' });
  error && /could not find|does not exist/i.test(error.message)
    ? problems.push(`RPC AUSENTE: ${fn}: ${error.message}`)
    : okRpcs++;
}

// Nota: las funciones RETURNS TRIGGER no se exponen por RPC en PostgREST,
// así que no son verificables por esta vía (igual que triggers, políticas e índices).
const { data: realBuckets, error: bucketsErr } = await supabase.storage.listBuckets();
let okBuckets = 0;
if (bucketsErr) {
  problems.push(`No pude listar buckets: ${bucketsErr.message}`);
} else {
  const realIds = new Set((realBuckets ?? []).map((b) => b.id));
  for (const b of [...buckets].sort()) {
    realIds.has(b) ? okBuckets++ : problems.push(`BUCKET AUSENTE: ${b}`);
  }
}

// ─── Informe ─────────────────────────────────────────────────────────────────
console.log(`Migraciones parseadas: ${files.length}`);
console.log(`Tablas esperadas: ${tables.size} · OK: ${okTables}`);
console.log(`Vistas esperadas: ${views.size} · OK: ${okViews}`);
console.log(`Buckets esperados: ${buckets.size} · OK: ${okBuckets}`);
console.log(`Spot-checks de enums: ${ENUM_SPOT_CHECKS.length} · OK: ${okEnums}`);
console.log(`Spot-checks de RPC: ${RPC_SPOT_CHECKS.length} · OK: ${okRpcs}`);
console.log(`No verificable vía PostgREST: ${notVerifiable.functions} funciones, ${notVerifiable.triggers} triggers, ${notVerifiable.policies} políticas RLS, ${notVerifiable.indexes} índices, ${notVerifiable.types} tipos (+${notVerifiable.alterType} ALTER TYPE)`);

if (warnings.length) {
  console.log(`\nAvisos del parser (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (problems.length) {
  console.log(`\nPROBLEMAS DETECTADOS (${problems.length}):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
} else {
  console.log('\n✓ La estructura verificable (tablas, columnas, vistas, buckets) coincide con las migraciones.');
}
