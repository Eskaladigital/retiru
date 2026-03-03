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
const UPDATE_EXISTING = process.argv.includes('--update-existing');

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

// Construye el objeto de columnas del directorio desde una fila CSV
function buildDirectorioFields(r, base = {}) {
  const province = (r.Provincia || '').trim() || 'España';
  const address = (r.Dirección || '').trim() || base.address;
  const city = extractCity(address, province);
  return {
    ...base,
    address: address || base.address,
    city: city || base.city,
    province,
    latitude: r.Latitud ? parseFloat(r.Latitud) : base.latitude,
    longitude: r.Longitud ? parseFloat(r.Longitud) : base.longitude,
    website: r.Web?.trim() || base.website,
    email: normalizeEmail(r.Email) ? r.Email.trim() : base.email,
    phone: r.Teléfono?.trim() || base.phone,
    avg_rating: r.Valoración ? parseFloat(r.Valoración) : base.avg_rating,
    review_count: parseInt(r['Nº Reseñas'], 10) || base.review_count || 0,
    schedule_summary_es: r.Horarios?.trim() || base.schedule_summary_es,
    price_range_es: r['Nivel Precio']?.trim() || base.price_range_es,
    google_place_id: r['Place ID']?.trim() || base.google_place_id,
    google_types: r['Tipos Google']?.trim() || base.google_types,
    google_maps_url: r['Google Maps']?.trim() || base.google_maps_url,
    google_status: r.Estado?.trim() || base.google_status,
    region: r.Región?.trim() || base.region,
    country: r.País?.trim() || base.country,
    web_valid_ia: r['Web válida (IA)']?.trim() || base.web_valid_ia,
    quality_ia: r['Calidad (IA)']?.trim() || base.quality_ia,
    search_terms: r.Búsqueda?.trim() || base.search_terms,
    price_level: r['Nivel Precio']?.trim() || base.price_level,
  };
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
    .select('id, name, slug, email, website, phone, address, city, province, latitude, longitude, avg_rating, review_count');

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

  // Determinar cuáles son nuevos y cuáles actualizar (evitando duplicados dentro del CSV)
  const toInsert = [];
  const toUpdate = []; // { row, center } para actualizar existentes con columnas del directorio
  const skipped = [];
  const insertedKeys = new Set();

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
    let matchedCenter = null;

    if (email && byEmail.has(email)) {
      found = true;
      matchReason = 'email';
      matchedCenter = byEmail.get(email);
    }
    if (!found && web && byWebsite.has(web)) {
      found = true;
      matchReason = 'web';
      matchedCenter = byWebsite.get(web);
    }
    if (!found && phone && byPhone.has(phone)) {
      found = true;
      matchReason = 'teléfono';
      matchedCenter = byPhone.get(phone);
    }
    if (!found && byNameProvince.has(nameProvKey)) {
      found = true;
      matchReason = 'nombre+provincia';
      matchedCenter = byNameProvince.get(nameProvKey);
    }

    if (found) {
      skipped.push({ name, matchReason });
      if (UPDATE_EXISTING && matchedCenter) {
        toUpdate.push({ row: r, center: matchedCenter });
      }
    } else {
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
  console.log(`   + ${toInsert.length} nuevos a insertar`);
  if (UPDATE_EXISTING && toUpdate.length > 0) {
    console.log(`   ↻ ${toUpdate.length} a actualizar con columnas del directorio`);
  }
  console.log('');

  if (toInsert.length === 0 && toUpdate.length === 0) {
    console.log('✅ No hay centros nuevos que añadir ni actualizar.\n');
    return;
  }

  if (DRY_RUN) {
    console.log('🔍 Modo dry-run: no se modificará nada.\n');
    if (toInsert.length > 0) {
      console.log('   Centros que se añadirían:');
      toInsert.slice(0, 15).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.Nombre} (${r.Provincia})`);
      });
      if (toInsert.length > 15) console.log(`   ... y ${toInsert.length - 15} más`);
    }
    if (toUpdate.length > 0) {
      console.log(`\n   Centros que se actualizarían: ${toUpdate.length}`);
    }
    console.log('\n   Ejecuta sin --dry-run para aplicar. Usa --update-existing para actualizar existentes.\n');
    return;
  }

  const usedSlugs = new Set(existingList.map((c) => c.slug));
  const BATCH = 50;
  let inserted = 0;
  let updated = 0;

  // Actualizar centros existentes con columnas del directorio
  if (toUpdate.length > 0) {
    console.log('↻ Actualizando centros existentes...');
    for (const { row: r, center } of toUpdate) {
      const updateData = {
        address: (r.Dirección || '').trim() || center.address,
        city: extractCity(r.Dirección || '', r.Provincia || '') || center.city,
        province: (r.Provincia || '').trim() || center.province,
        latitude: r.Latitud ? parseFloat(r.Latitud) : center.latitude,
        longitude: r.Longitud ? parseFloat(r.Longitud) : center.longitude,
        website: r.Web?.trim() || center.website,
        email: normalizeEmail(r.Email) ? r.Email.trim() : center.email,
        phone: r.Teléfono?.trim() || center.phone,
        avg_rating: r.Valoración ? parseFloat(r.Valoración) : center.avg_rating,
        review_count: parseInt(r['Nº Reseñas'], 10) || center.review_count || 0,
        schedule_summary_es: r.Horarios?.trim() || null,
        price_range_es: r['Nivel Precio']?.trim() || null,
        google_place_id: r['Place ID']?.trim() || null,
        google_types: r['Tipos Google']?.trim() || null,
        google_maps_url: r['Google Maps']?.trim() || null,
        google_status: r.Estado?.trim() || null,
        region: r.Región?.trim() || null,
        country: r.País?.trim() || null,
        web_valid_ia: r['Web válida (IA)']?.trim() || null,
        quality_ia: r['Calidad (IA)']?.trim() || null,
        search_terms: r.Búsqueda?.trim() || null,
        price_level: r['Nivel Precio']?.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('centers').update(updateData).eq('id', center.id);
      if (error) {
        console.error(`   ❌ Error actualizando ${center.name}:`, error.message);
      } else {
        updated++;
      }
    }
    console.log(`   ✓ ${updated} centros actualizados\n`);
  }

  // Insertar centros nuevos
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const centers = batch
      .map((r) => {
        const name = (r.Nombre || '').trim();
        const province = (r.Provincia || '').trim() || 'España';
        const address = (r.Dirección || '').trim() || name;
        if (!name) return null;

        const slug = makeSlug(name, province, usedSlugs);
        const description_es =
          'Centro de yoga, pilates y wellness en ' +
          province +
          '. Descripción generada automáticamente. Puedes completarla desde el panel de administración.';

        return buildDirectorioFields(r, {
          name,
          slug,
          description_es,
          type: mapType(r.Categoría),
          postal_code: null,
          status: 'active',
          plan: 'basic',
          price_monthly: 50,
          services_es: r.Categoría?.includes('Spa') ? ['Spa', 'Wellness'] : ['Yoga', 'Pilates', 'Wellness'],
        });
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

  console.log(`\n✅ Sincronización completada: ${inserted} nuevos, ${updated} actualizados.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
