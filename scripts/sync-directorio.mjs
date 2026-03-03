#!/usr/bin/env node
/**
 * RETIRU · Sincronizar directorioNEW.csv con Supabase
 * Solo añade centros NUEVOS. Detecta existentes por: email, web, teléfono, nombre+provincia.
 *
 * Uso: node scripts/sync-directorio.mjs
 *      node scripts/sync-directorio.mjs --dry-run   (simular sin insertar)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

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

// ─── Parse CSV ──────────────────────────────────────────────────────────────
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

// ─── Normalización para matching ────────────────────────────────────────────
const BAD_EMAILS = ['usuario@dominio.com', 'hibiscus@qodeinteractive.com', 'info@example.com', 'contact@example.com'];

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  if (!e || e.length < 5) return null;
  if (BAD_EMAILS.includes(e)) return null;
  if (!e.includes('@') || !e.includes('.')) return null;
  return e;
}

function normalizeWebsite(web) {
  if (!web || typeof web !== 'string') return null;
  let w = web.trim().toLowerCase();
  if (!w) return null;
  try {
    if (!w.startsWith('http')) w = 'https://' + w;
    const u = new URL(w);
    const host = u.hostname.replace(/^www\./, '');
    return host;
  } catch {
    return null;
  }
}

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeNameForMatch(name) {
  return slugify((name || '').trim()).slice(0, 50);
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
  if (c.includes('spa')) return 'spa';
  if (c.includes('pilates') && c.includes('yoga')) return 'yoga_meditation';
  if (c.includes('pilates')) return 'yoga_meditation';
  if (c.includes('yoga')) return 'yoga';
  if (c.includes('ayurveda') || c.includes('meditación') || c.includes('meditation')) return 'meditation';
  if (c.includes('wellness')) return 'wellness';
  return 'multidisciplinary';
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

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }

  const csvPath = join(root, 'directorioNEW.csv');
  if (!existsSync(csvPath)) {
    console.error('❌ directorioNEW.csv no encontrado en la raíz del proyecto');
    process.exit(1);
  }

  console.log('\n📂 Leyendo directorioNEW.csv...');
  const content = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  console.log(`   ${rows.length} centros en CSV\n`);

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  // Cargar centros existentes
  console.log('📥 Cargando centros existentes en BD...');
  const { data: existing, error: fetchErr } = await supabase
    .from('centers')
    .select('id, name, slug, email, website, phone, address, city, province');

  if (fetchErr) {
    console.error('❌ Error al cargar centros:', fetchErr.message);
    process.exit(1);
  }

  const existingList = existing || [];

  // Índices para matching rápido
  const byEmail = new Map();
  const byWebsite = new Map();
  const byPhone = new Map();
  const byNameProvince = new Map();

  existingList.forEach((c) => {
    const email = normalizeEmail(c.email);
    if (email) byEmail.set(email, c);

    const web = normalizeWebsite(c.website);
    if (web) byWebsite.set(web, c);

    const phone = normalizePhone(c.phone);
    if (phone) byPhone.set(phone, c);

    const key = `${normalizeNameForMatch(c.name)}|${slugify(c.province || '')}`;
    byNameProvince.set(key, c);
  });

  console.log(`   ${existingList.length} centros en BD\n`);

  // Determinar cuáles son nuevos (evitando duplicados dentro del CSV)
  const toInsert = [];
  const skipped = [];
  const insertedKeys = new Set(); // para no duplicar dentro del mismo CSV

  for (const r of rows) {
    const name = (r.Nombre || '').trim();
    const province = (r.Provincia || '').trim() || 'España';
    if (!name) continue;

    const email = normalizeEmail(r.Email);
    const web = normalizeWebsite(r.Web);
    const phone = normalizePhone(r.Teléfono);
    const nameProvKey = `${normalizeNameForMatch(name)}|${slugify(province)}`;

    let found = false;
    let matchReason = '';

    if (email && byEmail.has(email)) {
      found = true;
      matchReason = 'email';
    }
    if (!found && web && byWebsite.has(web)) {
      found = true;
      matchReason = 'web';
    }
    if (!found && phone && byPhone.has(phone)) {
      found = true;
      matchReason = 'teléfono';
    }
    if (!found && byNameProvince.has(nameProvKey)) {
      found = true;
      matchReason = 'nombre+provincia';
    }

    if (found) {
      skipped.push({ name, matchReason });
    } else {
      // Evitar duplicados dentro del CSV: si ya vamos a insertar uno con mismo email/web/name+prov, omitir
      const dupKey = email || web || nameProvKey;
      if (insertedKeys.has(dupKey)) {
        skipped.push({ name, matchReason: 'duplicado en CSV' });
      } else {
        insertedKeys.add(dupKey);
        toInsert.push(r);
      }
    }
  }

  console.log(`📊 Resultado del análisis:`);
  console.log(`   ✓ ${skipped.length} ya existen (omitidos)`);
  console.log(`   + ${toInsert.length} nuevos a insertar\n`);

  if (toInsert.length === 0) {
    console.log('✅ No hay centros nuevos que añadir.\n');
    return;
  }

  if (DRY_RUN) {
    console.log('🔍 Modo dry-run: no se insertará nada. Centros que se añadirían:\n');
    toInsert.slice(0, 15).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.Nombre} (${r.Provincia})`);
    });
    if (toInsert.length > 15) {
      console.log(`   ... y ${toInsert.length - 15} más`);
    }
    console.log('\n   Ejecuta sin --dry-run para insertar.\n');
    return;
  }

  const usedSlugs = new Set(existingList.map((c) => c.slug));
  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const centers = batch
      .map((r) => {
        const name = (r.Nombre || '').trim();
        const province = (r.Provincia || '').trim() || 'España';
        const address = (r.Dirección || '').trim() || name;
        const city = extractCity(address, province);

        if (!name) return null;

        const slug = makeSlug(name, province, usedSlugs);
        const description_es =
          'Centro de yoga, pilates y wellness en ' +
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
          website: r.Web?.trim() || null,
          email: normalizeEmail(r.Email) ? r.Email.trim() : null,
          phone: r.Teléfono?.trim() || null,
          status: 'active',
          plan: 'basic',
          price_monthly: 50,
          avg_rating: r.Valoración ? parseFloat(r.Valoración) : 0,
          review_count: parseInt(r['Nº Reseñas'], 10) || 0,
          services_es: r.Categoría?.includes('Spa') ? ['Spa', 'Wellness'] : ['Yoga', 'Pilates', 'Wellness'],
        };
      })
      .filter(Boolean);

    const { error } = await supabase.from('centers').insert(centers);

    if (error) {
      console.error(`❌ Error en batch ${Math.floor(i / BATCH) + 1}:`, error.message);
    } else {
      inserted += centers.length;
      console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${centers.length} centros insertados`);
    }
  }

  console.log(`\n✅ Sincronización completada: ${inserted} centros nuevos añadidos.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
