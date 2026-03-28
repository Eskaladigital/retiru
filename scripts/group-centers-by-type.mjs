#!/usr/bin/env node
/**
 * RETIRU · Agrupar centros por tipo (categoría + servicios 1, 2, 3)
 *
 * Fuentes de verdad (en orden de prioridad):
 *   1. directorio.csv — Categoría original (yoga, pilates, ayurveda)
 *   2. search_terms (Búsqueda) — "centro pilates" → pilates, "centro yoga" → yoga
 *   3. Nombre del centro
 *   4. Descripción — solo keywords ESPECÍFICOS (yoga, ayurveda, meditation)
 *      NO wellness/bienestar (son genéricos, todos los centros los tienen)
 *
 * Categorías BD (fase 1): solo yoga, meditation, ayurveda.
 *
 * Uso: node scripts/group-centers-by-type.mjs [--dry-run] [--update]
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        let val = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        process.env[t.slice(0, eq).trim()] = val;
      }
    }
  });
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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

// Mapear Categoría CSV → tipo BD (solo tres disciplinas)
function mapCategoriaToType(categoria) {
  const c = (categoria || '').toLowerCase();
  if (c.includes('ayurveda')) return 'ayurveda';
  if (c.includes('spa')) return 'meditation';
  if (c.includes('meditación') || c.includes('meditation')) return 'meditation';
  if (c.includes('pilates') || c.includes('yoga')) return 'yoga';
  return null;
}

const TARGET_TYPES = ['yoga', 'meditation', 'ayurveda'];

const KEYWORDS_SPECIFIC = {
  ayurveda: ['ayurveda', 'ayurvédico', 'ayurvédica', 'abhyanga', 'shirodhara', 'udvartana', 'kansu'],
  yoga: ['yoga', 'ashtanga', 'vinyasa', 'hatha', 'kundalini', 'yin', 'acroyoga', 'aero yoga', 'yoga restaurativo', 'pilates', 'reformer', 'mat pilates'],
  meditation: ['meditación', 'meditation', 'mindfulness', 'gong', 'cuencos tibetanos', 'sound bath', 'baño de sonido', 'reiki', 'spa', 'baños árabes', 'termal', 'hidro', 'sauna', 'jacuzzi', 'circuito termal', 'vinoterapia'],
};

// ─── Inferir categoría principal ───────────────────────────────────────────
// Prioridad: Búsqueda (cómo encontramos el centro) > Categoría CSV > Google types > nombre > resto
function inferCategory(center, csvMap) {
  const nameNorm = slugify(center.name).slice(0, 50);
  const provNorm = slugify(center.province || '');

  const search = (center.search_terms || '').toLowerCase();
  if (search.includes('pilates')) return 'yoga';
  if (search.includes('ayurveda')) return 'ayurveda';
  if (search.includes('yoga')) return 'yoga';
  if (search.includes('meditación') || search.includes('meditation')) return 'meditation';
  if (search.includes('spa')) return 'meditation';

  // 2. CSV: Categoría original (si hay match)
  const csvKey = `${nameNorm}|${provNorm}`;
  const csvRow = csvMap.get(csvKey);
  if (csvRow?.categoria) {
    const t = mapCategoriaToType(csvRow.categoria);
    if (t) return t;
  }

  const gTypes = (center.google_types || '').toLowerCase();
  if (gTypes.includes('spa')) return 'meditation';
  if (gTypes.includes('yoga_studio')) return 'yoga';

  const nameLower = (center.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (nameLower.includes('ayurveda') || nameLower.includes('ayurvédic')) return 'ayurveda';
  if (nameLower.includes('pilates')) return 'yoga';
  if (nameLower.includes('yoga')) return 'yoga';
  if (nameLower.includes('spa')) return 'meditation';

  // 5. services_es + descripción: solo keywords ESPECÍFICOS (sin wellness) — último recurso
  const fullText = [
    center.description_es || '',
    (center.services_es || []).join(' '),
    center.google_types || '',
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const scores = {};
  for (const [cat, words] of Object.entries(KEYWORDS_SPECIFIC)) {
    let score = 0;
    for (const w of words) {
      const n = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = fullText.match(regex);
      if (matches) score += matches.length;
      if (nameLower.includes(n)) score += 5;
    }
    if (score > 0) scores[cat] = score;
  }

  const order = ['ayurveda', 'meditation', 'yoga'];
  let best = null;
  let bestScore = 0;
  for (const cat of order) {
    if (scores[cat] && scores[cat] > bestScore) {
      bestScore = scores[cat];
      best = cat;
    }
  }
  if (best) return best;

  const typeMap = {
    yoga: 'yoga',
    pilates: 'yoga',
    meditation: 'meditation',
    ayurveda: 'ayurveda',
    spa: 'meditation',
    wellness: 'yoga',
    yoga_meditation: 'yoga',
    wellness_spa: 'meditation',
    multidisciplinary: 'yoga',
  };
  if (typeMap[center.type]) return typeMap[center.type];

  return 'yoga';
}

// ─── Extraer servicios 1, 2, 3 (SOLO lo que da Google/importación, sin inventar) ─
function extractServices(center, proposedCategory) {
  // Filtrar "Wellness"/"Bienestar" — genéricos, no específicos
  const raw = (center.services_es || []).filter((s) => {
    const l = s.toLowerCase();
    return l !== 'wellness' && l !== 'bienestar';
  });
  const services = [...raw];

  // NO inventar servicios desde descripción — solo usar services_es reales
  const catLabels = {
    yoga: 'Yoga',
    meditation: 'Meditación',
    ayurveda: 'Ayurveda',
  };
  const primary = catLabels[proposedCategory];
  if (primary && !services.some((s) => s.toLowerCase().includes(primary.toLowerCase()))) {
    services.unshift(primary);
  }

  return {
    servicio_1: services[0] || primary || '',
    servicio_2: services[1] || '',
    servicio_3: services[2] || '',
    services_es: services.slice(0, 6).filter(Boolean),
  };
}

function mapToDbType(proposed) {
  if (TARGET_TYPES.includes(proposed)) return proposed;
  return 'yoga';
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  const args = process.argv.slice(2);
  const DRY_RUN = args.includes('--dry-run');
  const UPDATE = args.includes('--update') && !DRY_RUN;

  // Cargar directorio.csv para Categoría original
  const csvPath = join(root, 'directorio.csv');
  const csvMap = new Map();
  if (existsSync(csvPath)) {
    const csvContent = readFileSync(csvPath, 'utf8');
    const csvRows = parseCSV(csvContent);
    for (const r of csvRows) {
      const nameNorm = slugify(r.Nombre).slice(0, 50);
      const provNorm = slugify(r.Provincia || '');
      csvMap.set(`${nameNorm}|${provNorm}`, {
        categoria: r.Categoría?.trim() || '',
        busqueda: r.Búsqueda?.trim() || '',
      });
    }
    console.log(`📂 directorio.csv: ${csvRows.length} filas cargadas\n`);
  }

  console.log('📂 Cargando centros desde Supabase...');
  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, slug, type, categories, services_es, description_es, search_terms, google_types, city, province')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`   ${centers.length} centros activos\n`);

  const results = [];
  const stats = {};

  for (const c of centers) {
    const tipo_propuesto = inferCategory(c, csvMap);
    const { servicio_1, servicio_2, servicio_3, services_es } = extractServices(c, tipo_propuesto);
    const tipo_db = mapToDbType(tipo_propuesto);

    stats[tipo_propuesto] = (stats[tipo_propuesto] || 0) + 1;

    results.push({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type_actual: c.type,
      tipo_propuesto,
      tipo_db,
      servicio_1,
      servicio_2,
      servicio_3,
      services_es,
    });
  }

  // Resumen
  console.log('📊 Resumen por categoría propuesta:\n');
  for (const t of TARGET_TYPES) {
    const n = stats[t] || 0;
    console.log(`   ${t.padEnd(12)} ${n}`);
  }
  console.log('');

  // CSV de reporte
  const csvLines = [
    'Nombre,Slug,Tipo_actual,Tipo_propuesto,Servicio_1,Servicio_2,Servicio_3',
    ...results.map((r) =>
      [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.slug,
        r.type_actual,
        r.tipo_propuesto,
        `"${(r.servicio_1 || '').replace(/"/g, '""')}"`,
        `"${(r.servicio_2 || '').replace(/"/g, '""')}"`,
        `"${(r.servicio_3 || '').replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ];
  const reportPath = join(root, 'centros-agrupacion-propuesta.csv');
  writeFileSync(reportPath, '\ufeff' + csvLines.join('\n'), 'utf8');
  console.log(`✅ Reporte guardado en: centros-agrupacion-propuesta.csv\n`);

  // Actualizar BD si se solicita
  if (UPDATE) {
    console.log('⚠️  El enum center_type debe ser solo yoga | meditation | ayurveda (migración 014).\n');

    // Verificar qué valores acepta el enum (no podemos hacerlo fácilmente, intentamos update)
    const toUpdate = results.filter((r) => r.type_actual !== r.tipo_db);
    console.log(`   Centros a actualizar: ${toUpdate.length}`);

    if (toUpdate.length > 0) {
      let ok = 0;
      let err = 0;
      for (const r of toUpdate) {
        const { error: updErr } = await supabase
          .from('centers')
          .update({
            type: r.tipo_db,
            services_es: r.services_es.filter(Boolean),
          })
          .eq('id', r.id);
        if (updErr) {
          console.error(`   ❌ ${r.slug}: ${updErr.message}`);
          err++;
        } else ok++;
      }
      console.log(`   ✓ ${ok} actualizados, ${err} errores`);
    }
  } else {
    console.log('   Usa --update para aplicar los cambios a la base de datos.');
  }

  console.log('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
