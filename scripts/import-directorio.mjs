#!/usr/bin/env node
/**
 * RETIRU · Importar centros desde directorio.csv a Supabase
 * Usa variables de .env.local (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)
 *
 * Uso: node scripts/import-directorio.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Cargar .env.local ─────────────────────────────────────────────────────
function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
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

// ─── Parse CSV con campos entre comillas ────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
      result.push(current.trim());
      current = '';
      if (c === '\n') break;
    } else {
      current += c;
    }
  }
  if (current !== '') result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

// ─── Slug desde nombre (único con provincia para evitar duplicados) ─────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeSlug(name, province, used) {
  let base = slugify(name);
  if (base.length > 40) base = base.slice(0, 40);
  let slug = base;
  let n = 0;
  while (used.has(slug)) {
    n++;
    slug = `${base}-${n}`;
  }
  used.add(slug);
  return slug;
}

// ─── Extraer ciudad de dirección ───────────────────────────────────────────
function extractCity(address, province) {
  if (!address) return province || 'España';
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 3) {
    const cityPart = parts[parts.length - 3];
    return cityPart.replace(/^\d{5}\s*/, '').trim() || province || 'España';
  }
  return province || 'España';
}

// ─── Mapear categoría CSV → center_type ────────────────────────────────────
function mapType(categoria) {
  const c = (categoria || '').toLowerCase();
  if (c.includes('pilates') && c.includes('yoga')) return 'yoga_meditation';
  if (c.includes('pilates')) return 'yoga_meditation';
  if (c.includes('yoga')) return 'yoga';
  return 'multidisciplinary';
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }

  const csvPath = join(root, 'directorio.csv');
  if (!existsSync(csvPath)) {
    console.error('❌ directorio.csv no encontrado en la raíz del proyecto');
    process.exit(1);
  }

  console.log('\n📂 Leyendo directorio.csv...');
  const content = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  console.log(`   ${rows.length} centros encontrados\n`);

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  const usedSlugs = new Set();
  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const centers = batch
      .map((r) => {
        const name = (r.Nombre || '').trim();
        const province = (r.Provincia || '').trim() || 'España';
        const address = (r.Dirección || '').trim() || name;
        const city = extractCity(address, province);

        if (!name) return null;

        const slug = makeSlug(name, province, usedSlugs);
        const description_es =
          'Centro de yoga y pilates en ' +
          province +
          '. Descripción generada automáticamente. Puedes completarla desde el panel de administración.';

        return {
          name,
          slug,
          description_es,
          type: mapType(r.Categoría),
          address,
          city,
          province,
          postal_code: null,
          latitude: r.Latitud ? parseFloat(r.Latitud) : null,
          longitude: r.Longitud ? parseFloat(r.Longitud) : null,
          website: r.Web || null,
          email: r.Email || null,
          phone: r.Teléfono || null,
          status: 'active',
          plan: 'basic',
          price_monthly: 50,
          avg_rating: r.Valoración ? parseFloat(r.Valoración) : 0,
          review_count: parseInt(r['Nº Reseñas'], 10) || 0,
          services_es: r.Categoría?.includes('pilates') ? ['Pilates', 'Yoga'] : ['Yoga', 'Pilates'],
        };
      })
      .filter(Boolean);

    const { data, error } = await supabase.from('centers').upsert(centers, {
      onConflict: 'slug',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`❌ Error en batch ${Math.floor(i / BATCH) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += centers.length;
      console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${centers.length} centros`);
    }
  }

  console.log(`\n✅ Importación completada: ${inserted} centros insertados/actualizados`);
  if (errors > 0) console.log(`   ⚠ ${errors} con error\n`);
  else console.log('\n   Puedes usar "Generar descripciones con IA" en /administrator/centros para completar las descripciones.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
