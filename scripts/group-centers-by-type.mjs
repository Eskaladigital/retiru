#!/usr/bin/env node
/**
 * RETIRU · Agrupar centros por tipo (categoría + servicios 1, 2, 3)
 *
 * Analiza los 858 centros y propone una agrupación basada en:
 *   - name, description_es, services_es, categories, type, search_terms
 *
 * Categorías objetivo: Yoga, Pilates, Meditación, Ayurveda, Wellness, Spa
 *
 * Uso: node scripts/group-centers-by-type.mjs [--dry-run] [--update]
 *   --dry-run  Solo genera el CSV de reporte, no actualiza BD
 *   --update   Actualiza el campo type en la BD según la propuesta
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

// ─── Categorías objetivo (slug para BD) ─────────────────────────────────────
const TARGET_TYPES = ['yoga', 'pilates', 'meditation', 'ayurveda', 'wellness', 'spa'];

// Palabras clave por categoría (minúsculas)
const KEYWORDS = {
  ayurveda: ['ayurveda', 'ayurvédico', 'ayurvédica', 'abhyanga', 'shirodhara', 'dosha', 'marma', 'udvartana', 'kansu'],
  pilates: ['pilates', 'reformer', 'mat pilates'],
  yoga: ['yoga', 'ashtanga', 'vinyasa', 'hatha', 'kundalini', 'yin', 'acroyoga', 'aero yoga', 'yoga restaurativo'],
  meditation: ['meditación', 'meditation', 'mindfulness', 'gong', 'cuencos tibetanos', 'sound bath', 'baño de sonido', 'reiki'],
  spa: ['spa', 'baños árabes', 'termal', 'hidro', 'sauna', 'jacuzzi', 'circuito termal', 'vinoterapia'],
  wellness: ['wellness', 'bienestar', 'fisioterapia', 'osteopatía', 'masaje', 'quiromasaje', 'reflexología', 'nutrición'],
};

// ─── Inferir categoría principal ───────────────────────────────────────────
function inferCategory(center) {
  const nameText = (center.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fullText = [
    center.name || '',
    center.description_es || '',
    (center.services_es || []).join(' '),
    (center.categories || []).join(' '),
    center.type || '',
    center.search_terms || '',
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const scores = {};
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      const n = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = fullText.match(regex);
      if (matches) score += matches.length;
      // Bonus si la palabra está en el nombre (más peso)
      if (nameText.includes(n)) score += 5;
    }
    if (score > 0) scores[cat] = score;
  }

  // Prioridad: Ayurveda > Spa > Pilates > Yoga > Meditación > Wellness
  const order = ['ayurveda', 'spa', 'pilates', 'yoga', 'meditation', 'wellness'];
  let best = null;
  let bestScore = 0;
  for (const cat of order) {
    if (scores[cat] && scores[cat] > bestScore) {
      bestScore = scores[cat];
      best = cat;
    }
  }

  if (best) return best;

  // Fallback según type actual
  const typeMap = {
    yoga: 'yoga',
    meditation: 'meditation',
    pilates: 'pilates',
    ayurveda: 'ayurveda',
    wellness: 'wellness',
    spa: 'spa',
    yoga_meditation: 'yoga',
    wellness_spa: 'spa',
    multidisciplinary: 'wellness',
  };
  return typeMap[center.type] || 'wellness';
}

// ─── Extraer servicios 1, 2, 3 ──────────────────────────────────────────────
function extractServices(center, proposedCategory) {
  const services = [...(center.services_es || [])];
  const text = (center.description_es || '').toLowerCase();

  // Si services_es está vacío o genérico, intentar extraer de la descripción
  const knownServices = [
    'Yoga', 'Pilates', 'Meditación', 'Wellness', 'Spa', 'Ayurveda',
    'Fisioterapia', 'Masaje', 'Osteopatía', 'Reiki', 'Reflexología',
    'Hatha', 'Vinyasa', 'Ashtanga', 'Yin Yoga', 'Kundalini',
    'Baños árabes', 'Termal', 'Hidroterapia',
  ];

  if (services.length < 3) {
    for (const s of knownServices) {
      if (services.length >= 3) break;
      const lower = s.toLowerCase();
      if (text.includes(lower) && !services.some((x) => x.toLowerCase().includes(lower))) {
        services.push(s);
      }
    }
  }

  // Priorizar la categoría propuesta como primer servicio si no está
  const catLabels = {
    yoga: 'Yoga',
    pilates: 'Pilates',
    meditation: 'Meditación',
    ayurveda: 'Ayurveda',
    wellness: 'Wellness',
    spa: 'Spa',
  };
  const primary = catLabels[proposedCategory];
  if (primary && !services.some((s) => s.toLowerCase().includes(primary.toLowerCase()))) {
    services.unshift(primary);
  }

  return {
    servicio_1: services[0] || primary || '',
    servicio_2: services[1] || '',
    servicio_3: services[2] || '',
    services_es: services.slice(0, 6),
  };
}

// ─── Mapear tipo propuesto al enum de BD ───────────────────────────────────
// El enum actual: yoga, meditation, wellness, spa, yoga_meditation, wellness_spa, multidisciplinary
// Añadiremos pilates y ayurveda si la migración existe; si no, mapeamos a los existentes
function mapToDbType(proposed) {
  const mapping = {
    yoga: 'yoga',
    pilates: 'pilates',
    meditation: 'meditation',
    ayurveda: 'ayurveda',
    wellness: 'wellness',
    spa: 'spa',
  };
  return mapping[proposed] || 'multidisciplinary';
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

  console.log('\n📂 Cargando centros desde Supabase...');
  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, slug, type, categories, services_es, description_es, search_terms, city, province')
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
    const tipo_propuesto = inferCategory(c);
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
    console.log('⚠️  Actualizar BD requiere que el enum center_type incluya pilates y ayurveda.');
    console.log('   Ejecuta primero la migración 009_center_types_ayurveda_pilates.sql si no existe.\n');

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
