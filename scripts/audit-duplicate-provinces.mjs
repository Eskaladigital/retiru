#!/usr/bin/env node
/**
 * Auditoría de provincias duplicadas en `centers.province` (§8.9 de docs/SEO-LANDINGS.md).
 *
 * Motivación: hay slugs distintos que apuntan a la misma provincia real
 * (p. ej. `lerida` y `lleida`). Si generamos landings para ambos, se canibalizan
 * el ranking y diluyen PageRank. Este script NO modifica nada: solo reporta.
 *
 * Uso:
 *   node scripts/audit-duplicate-provinces.mjs
 *   node scripts/audit-duplicate-provinces.mjs --json          # salida JSON
 *   node scripts/audit-duplicate-provinces.mjs --with-centers  # muestra centros afectados
 *
 * Después de ejecutar, usa `scripts/consolidate-duplicate-provinces.mjs`
 * (pendiente de crear) para aplicar la migración de datos con la propuesta.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('Falta .env.local');
  process.exit(1);
}
readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        let val = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        process.env[t.slice(0, eq).trim()] = val;
      }
    }
  });

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const withCenters = args.includes('--with-centers');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

// Reglas canónicas (§8.9). Cada entrada define slug canónico + aliases.
// La decisión fue tomada tras analizar Google Trends España y nomenclatura oficial.
const CANONICAL_RULES = [
  {
    canonical: 'baleares',
    canonicalName: 'Baleares',
    aliases: ['islas-baleares'],
    rationale: 'Alineado con datos operativos: 25 centros en "Baleares" vs 3 en "Islas Baleares". Mayor volumen de búsqueda en Google Trends España.',
  },
  {
    canonical: 'gipuzkoa',
    canonicalName: 'Gipuzkoa',
    aliases: ['guipuzcoa'],
    rationale: 'Slug sin diacríticos normalizado; oficial en euskera y aceptado en ES.',
  },
  {
    canonical: 'lleida',
    canonicalName: 'Lleida',
    aliases: ['lerida'],
    rationale: 'Oficial en catalán; uso mayoritario en Google Trends España.',
  },
  {
    canonical: 'santa-cruz-de-tenerife',
    canonicalName: 'Santa Cruz de Tenerife',
    aliases: ['tenerife'],
    rationale: '"Tenerife" es la isla; la provincia es Santa Cruz de Tenerife (incluye La Palma, La Gomera, El Hierro).',
  },
  {
    canonical: 'pyrenees-atlantiques',
    canonicalName: 'Pyrénées-Atlantiques',
    aliases: ['pirineos-atlanticos'],
    rationale: 'Departamento francés: nombre oficial francés; "Pirineos Atlánticos" es traducción. Decidir scope primero.',
  },
];

function normSlug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

async function fetchAllProvinces() {
  const { data, error } = await admin
    .from('centers')
    .select('id, name, city, province, type, status')
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  const byProvince = new Map();
  for (const row of (data || [])) {
    if (!row.province) continue;
    const slug = normSlug(row.province);
    if (!byProvince.has(slug)) {
      byProvince.set(slug, { slug, displayName: row.province, centers: [], types: new Set() });
    }
    const entry = byProvince.get(slug);
    entry.centers.push({ id: row.id, name: row.name, city: row.city, type: row.type });
    entry.types.add(row.type);
  }
  return byProvince;
}

async function main() {
  const byProvince = await fetchAllProvinces();

  const report = {
    total_provinces: byProvince.size,
    duplicate_groups: [],
    orphan_slugs: [],
    recommendations: [],
  };

  for (const rule of CANONICAL_RULES) {
    const canonicalEntry = byProvince.get(rule.canonical);
    const aliasEntries = rule.aliases
      .map((alias) => byProvince.get(alias))
      .filter(Boolean);

    if (!canonicalEntry && aliasEntries.length === 0) {
      continue; // no hay datos para este par, skip
    }

    const group = {
      canonical: rule.canonical,
      canonical_name: rule.canonicalName,
      canonical_centers: canonicalEntry?.centers.length || 0,
      canonical_types: canonicalEntry ? Array.from(canonicalEntry.types) : [],
      aliases: rule.aliases.map((alias) => {
        const entry = byProvince.get(alias);
        return {
          slug: alias,
          found: !!entry,
          display_name: entry?.displayName || null,
          centers: entry?.centers.length || 0,
          types: entry ? Array.from(entry.types) : [],
        };
      }),
      rationale: rule.rationale,
    };

    if (withCenters && canonicalEntry) {
      group.canonical_centers_sample = canonicalEntry.centers.slice(0, 5).map((c) => c.name);
    }
    if (withCenters) {
      group.aliases.forEach((a) => {
        const entry = byProvince.get(a.slug);
        if (entry) a.centers_sample = entry.centers.slice(0, 5).map((c) => c.name);
      });
    }

    report.duplicate_groups.push(group);

    // Recomendación operativa
    const affectedAliases = group.aliases.filter((a) => a.found && a.centers > 0);
    if (affectedAliases.length > 0) {
      const totalAffected = affectedAliases.reduce((sum, a) => sum + a.centers, 0);
      report.recommendations.push({
        action: 'migrate_and_redirect',
        canonical: rule.canonical,
        affected_aliases: affectedAliases.map((a) => a.slug),
        affected_centers: totalAffected,
        sql: affectedAliases
          .map(
            (a) =>
              `UPDATE centers SET province = '${rule.canonicalName.replace(/'/g, "''")}' WHERE province ILIKE '%${a.display_name || a.slug}%';`,
          )
          .join('\n'),
        middleware_note: `Añadir 301 en middleware.ts para rutas que contengan /${affectedAliases.map((a) => a.slug).join('|')}/ → /${rule.canonical}/`,
      });
    }
  }

  // Detectar provincias "sueltas" que no son ES estándar (Francia, Portugal, Andorra)
  const ES_STANDARD = new Set([
    'a-coruna', 'albacete', 'alicante', 'almeria', 'asturias', 'avila', 'badajoz', 'barcelona',
    'bizkaia', 'burgos', 'caceres', 'cadiz', 'cantabria', 'castellon', 'ceuta', 'cordoba',
    'cuenca', 'girona', 'granada', 'guadalajara', 'huelva', 'huesca', 'jaen', 'la-rioja',
    'las-palmas', 'leon', 'lugo', 'madrid', 'malaga', 'melilla', 'murcia', 'navarra',
    'ourense', 'palencia', 'pontevedra', 'salamanca', 'segovia', 'sevilla', 'soria',
    'tarragona', 'teruel', 'toledo', 'valencia', 'valladolid', 'zamora', 'zaragoza',
    'alava', 'gipuzkoa', 'lleida', 'baleares', 'santa-cruz-de-tenerife',
  ]);
  for (const [slug, entry] of byProvince.entries()) {
    if (ES_STANDARD.has(slug)) continue;
    const isAliasKnown = CANONICAL_RULES.some(
      (r) => r.canonical === slug || r.aliases.includes(slug),
    );
    if (!isAliasKnown) {
      report.orphan_slugs.push({
        slug,
        display_name: entry.displayName,
        centers: entry.centers.length,
        types: Array.from(entry.types),
        note: 'No coincide con provincia ES estándar ni regla canónica. Revisar: Francia, Portugal, Andorra o typo.',
      });
    }
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Reporte humano
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  AUDITORÍA DE PROVINCIAS DUPLICADAS (§8.9 SEO-LANDINGS.md)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Total provincias distintas en centers: ${report.total_provinces}\n`);

  console.log('─── Grupos de duplicadas ─────────────────────────────────────\n');
  for (const g of report.duplicate_groups) {
    console.log(`◆ Canónico: "${g.canonical_name}" (/${g.canonical}) — ${g.canonical_centers} centros${g.canonical_types.length ? ` [${g.canonical_types.join(', ')}]` : ''}`);
    for (const a of g.aliases) {
      if (a.found) {
        const flag = a.centers > 0 ? '⚠️ ACTIVO' : '○ vacío';
        console.log(`   ${flag} Alias "${a.display_name || a.slug}" (/${a.slug}) — ${a.centers} centros${a.types.length ? ` [${a.types.join(', ')}]` : ''}`);
        if (withCenters && a.centers_sample) {
          a.centers_sample.forEach((n) => console.log(`          · ${n}`));
        }
      } else {
        console.log(`   ✓ Alias "${a.slug}" no presente (nada que migrar)`);
      }
    }
    console.log(`   Razón: ${g.rationale}\n`);
  }

  if (report.orphan_slugs.length > 0) {
    console.log('─── Provincias "sueltas" (no ES estándar) ────────────────────\n');
    for (const o of report.orphan_slugs) {
      console.log(`  • "${o.display_name}" (/${o.slug}) — ${o.centers} centros [${o.types.join(', ')}]`);
      console.log(`    ${o.note}`);
    }
    console.log('');
  }

  if (report.recommendations.length > 0) {
    console.log('─── Acciones recomendadas ────────────────────────────────────\n');
    report.recommendations.forEach((r, i) => {
      console.log(`${i + 1}. Consolidar ${r.affected_aliases.join(', ')} → ${r.canonical} (${r.affected_centers} centros afectados)`);
      console.log(`   SQL:\n${r.sql.replace(/^/gm, '     ')}`);
      console.log(`   ${r.middleware_note}\n`);
    });
    console.log('\nPara aplicar los cambios: crear scripts/consolidate-duplicate-provinces.mjs');
    console.log('   (NO incluido en este script por seguridad; requiere revisión manual).\n');
  } else {
    console.log('✓ No hay acciones pendientes: todas las provincias ya están consolidadas.\n');
  }
}

main().catch((e) => {
  console.error('ERR:', e);
  process.exit(1);
});
