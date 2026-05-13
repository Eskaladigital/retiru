#!/usr/bin/env node
/**
 * Consulta destinations agrupadas por country (usa .env.local, anon key).
 * Uso: node scripts/peek-destinations.mjs
 * No imprime claves completas.
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

if (!url) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const key = service || anon;
if (!key) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  const rest = `${url.replace(/\/$/, '')}/rest/v1/destinations?select=name_es,name_en,slug,country,region,sort_order,is_active&order=country.asc,sort_order.asc`;
  let res;
  try {
    res = await fetch(rest, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
  } catch (e) {
    console.error('❌ fetch falló:', e?.cause?.code || e?.message || String(e));
    process.exit(1);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error('❌ HTTP', res.status, text.slice(0, 400));
    process.exit(1);
  }

  const rows = JSON.parse(text);
  const byCountry = new Map();
  for (const row of rows) {
    const c = (row.country ?? '').trim() || '?';
    if (!byCountry.has(c)) byCountry.set(c, []);
    byCountry.get(c).push(row);
  }

  console.log(`\nDestinos en BD (${rows.length} filas):\n`);
  for (const code of [...byCountry.keys()].sort()) {
    const list = byCountry.get(code).map((d) => `${d.slug}${d.is_active ? '' : '(inactivo)'}`).join(', ');
    console.log(`  [${code}] ${byCountry.get(code).length} → ${list}`);
  }

  const inactive = rows.filter((r) => r.is_active === false);
  if (inactive.length) {
    console.log(`\n  ⚠ Inactivos (${inactive.length}) no aparecen en el alta de evento (getDestinations filtra is_active=true):`);
    inactive.forEach((r) => console.log(`     - ${r.slug} (${r.country})`));
  }

  const ptRows = byCountry.get('PT') ?? [];
  const ptActive = ptRows.filter((d) => d.is_active !== false);
  const hasMA = (byCountry.get('MA') ?? []).length > 0;

  console.log('');
  if (ptActive.length) {
    console.log(`✅ Portugal tiene destino activo (${ptActive.map((d) => d.slug).join(', ')}). La app debe listarlo al crear evento.`);
  } else if (ptRows.length) {
    console.log('⚠️ Hay fila PT pero está inactiva → no saldrá en el desplegable del organizador hasta activar is_active.');
  } else {
    console.log('⚠️ No hay country=PT → falta insertar destinos Portugal.');
  }

  if (hasMA) console.log('✅ Hay destinos Marruecos (country=MA).');
  else console.log('ℹ️  Sin country=MA (opcional si no ofrecéis Marruecos).');
  console.log('');
}

await main();
