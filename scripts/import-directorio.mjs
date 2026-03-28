#!/usr/bin/env node
/**
 * RETIRU · Importar centros desde directorio.csv a Supabase
 * Usa variables de .env.local (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)
 *
 * IMPORTANTE: Al actualizar centros existentes, NO sobrescribe campos vacíos del CSV.
 * Solo usa valores del CSV cuando tienen contenido; si el CSV está vacío, mantiene el dato en BD.
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

// ─── Inferir servicios desde categoría CSV ─────────────────────────────────
function inferServicesFromCategoria(categoria) {
  const c = (categoria || '').toLowerCase();
  if (c.includes('spa')) return ['Spa', 'Wellness'];
  if (c.includes('ayurveda')) return ['Ayurveda', 'Masaje ayurvédico', 'Wellness'];
  if (c.includes('pilates') && c.includes('yoga')) return ['Yoga', 'Pilates', 'Wellness'];
  if (c.includes('pilates')) return ['Pilates', 'Wellness'];
  if (c.includes('yoga')) return ['Yoga', 'Pilates', 'Wellness'];
  if (c.includes('meditación') || c.includes('meditation')) return ['Meditación', 'Wellness'];
  return ['Yoga', 'Pilates', 'Wellness'];
}

// ─── Mapear categoría CSV → center_type (solo yoga | meditation | ayurveda) ─
function mapType(categoria) {
  const c = (categoria || '').toLowerCase();
  if (c.includes('ayurveda')) return 'ayurveda';
  if (c.includes('meditación') || c.includes('meditation')) return 'meditation';
  if (c.includes('spa')) return 'meditation';
  if (c.includes('pilates') || c.includes('yoga')) return 'yoga';
  if (c.includes('wellness')) return 'yoga';
  return 'yoga';
}

// ─── Construir objeto centro con todas las columnas del CSV (para INSERT) ─────
function buildCenterFromRow(r, slug) {
  const name = (r.Nombre || '').trim();
  const province = (r.Provincia || '').trim() || 'España';
  const address = (r.Dirección || '').trim() || name;
  const city = extractCity(address, province);
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
    email: r.Email?.trim() || null,
    phone: r.Teléfono?.trim() || null,
    status: 'active',
    plan: 'basic',
    price_monthly: 50,
    avg_rating: r.Valoración ? parseFloat(r.Valoración) : 0,
    review_count: parseInt(r['Nº Reseñas'], 10) || 0,
    services_es: inferServicesFromCategoria(r.Categoría),
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
  };
}

// ─── Merge: solo incluye campos donde el CSV tiene valor (no sobrescribe con null) ─
function buildMergeFromRow(r, existing) {
  const province = (r.Provincia || '').trim() || 'España';
  const address = (r.Dirección || '').trim();
  const city = address ? extractCity(address, province) : null;

  const out = {};
  if ((r.Nombre || '').trim()) out.name = r.Nombre.trim();
  if (address) out.address = address;
  if (city) out.city = city;
  if (province) out.province = province;
  if (r.Latitud) out.latitude = parseFloat(r.Latitud);
  if (r.Longitud) out.longitude = parseFloat(r.Longitud);
  if (r.Web?.trim()) out.website = r.Web.trim();
  if (r.Email?.trim()) out.email = r.Email.trim();
  if (r.Teléfono?.trim()) out.phone = r.Teléfono.trim();
  if (r.Valoración) out.avg_rating = parseFloat(r.Valoración);
  if (r['Nº Reseñas']) out.review_count = parseInt(r['Nº Reseñas'], 10) || 0;
  if (r.Horarios?.trim()) out.schedule_summary_es = r.Horarios.trim();
  if (r['Nivel Precio']?.trim()) {
    out.price_range_es = r['Nivel Precio'].trim();
    out.price_level = r['Nivel Precio'].trim();
  }
  if (r['Place ID']?.trim()) out.google_place_id = r['Place ID'].trim();
  if (r['Tipos Google']?.trim()) out.google_types = r['Tipos Google'].trim();
  if (r['Google Maps']?.trim()) out.google_maps_url = r['Google Maps'].trim();
  if (r.Estado?.trim()) out.google_status = r.Estado.trim();
  if (r.Región?.trim()) out.region = r.Región.trim();
  if (r.País?.trim()) out.country = r.País.trim();
  if (r['Web válida (IA)']?.trim()) out.web_valid_ia = r['Web válida (IA)'].trim();
  if (r['Calidad (IA)']?.trim()) out.quality_ia = r['Calidad (IA)'].trim();
  if (r.Búsqueda?.trim()) out.search_terms = r.Búsqueda.trim();

  return Object.keys(out).length ? out : null;
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

  // Cargar centros existentes para merge (no sobrescribir emails/webs vacíos)
  console.log('📥 Cargando centros existentes...');
  const { data: existingList, error: fetchErr } = await supabase
    .from('centers')
    .select('id, slug, name, province, email, website, phone');
  if (fetchErr) {
    console.error('❌ Error al cargar centros:', fetchErr.message);
    process.exit(1);
  }
  const nameProvKey = (n, p) => `${slugify(n).slice(0, 50)}|${slugify(p || '')}`;
  const byNameProvince = new Map((existingList || []).map((c) => [nameProvKey(c.name, c.province), c]));
  const usedSlugs = new Set((existingList || []).map((c) => c.slug));
  console.log(`   ${byNameProvince.size} centros en BD\n`);

  const BATCH = 50;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const toInsert = [];
    const toUpdate = [];

    for (const r of batch) {
      const name = (r.Nombre || '').trim();
      const province = (r.Provincia || '').trim() || 'España';
      if (!name) continue;

      const key = nameProvKey(name, province);
      const existing = byNameProvince.get(key);

      if (existing && existing.id) {
        const merge = buildMergeFromRow(r, existing);
        if (merge) toUpdate.push({ id: existing.id, ...merge });
      } else if (!existing) {
        const slug = makeSlug(name, province, usedSlugs);
        byNameProvince.set(key, { slug });
        toInsert.push(buildCenterFromRow(r, slug));
      }
    }

    if (toInsert.length > 0) {
      const { data: insertedRows, error } = await supabase
        .from('centers')
        .upsert(toInsert, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id, slug, name, province');
      if (error) {
        console.error(`❌ Error insert batch ${Math.floor(i / BATCH) + 1}:`, error.message);
        errors += toInsert.length;
      } else {
        inserted += toInsert.length;
        (insertedRows || []).forEach((c) => byNameProvince.set(nameProvKey(c.name, c.province), c));
        console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${toInsert.length} insertados`);
      }
    }

    for (const u of toUpdate) {
      const { id, ...data } = u;
      const { error } = await supabase.from('centers').update(data).eq('id', id);
      if (error) {
        console.error(`   ❌ Error actualizando ${id}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    }
    if (toUpdate.length > 0 && toInsert.length === 0) {
      console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${toUpdate.length} actualizados (merge, sin borrar datos)`);
    }
  }

  console.log(`\n✅ Importación completada: ${inserted} insertados, ${updated} actualizados (merge seguro)`);
  if (errors > 0) console.log(`   ⚠ ${errors} con error\n`);
  else console.log('\n   Puedes usar "Generar descripciones con IA" en /administrator/centros para completar las descripciones.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
