#!/usr/bin/env node
/**
 * Consolida las provincias duplicadas al slug canónico (§8.9 docs/SEO-LANDINGS.md).
 *
 * SEGURIDAD: por defecto corre en --dry-run. Exige --execute para tocar datos.
 *
 * Acciones por cada regla canónica:
 *   1. UPDATE centers SET province = '<canonical_display_name>' WHERE province IN (aliases...).
 *   2. DELETE FROM center_type_province_seo WHERE province_slug IN (alias_slugs...)
 *      (borramos el contenido SEO del slug alias porque ya no lo serviremos;
 *       las landings del canónico se regenerarán con el nuevo generador).
 *   3. DELETE FROM style_province_seo WHERE province_slug IN (alias_slugs...)
 *      (misma lógica para la tabla de Cap. 4, nueva en migración 045).
 *
 * Después de correr con --execute:
 *   - Los centros ya tienen el province canónico.
 *   - Las URLs `/es/centros/[tipo]/{alias}` quedan rotas (no aparecen centros)
 *     pero NO las redirigimos aquí. La redirección 301 se añade en
 *     `src/middleware.ts` (lista fija `DUPLICATE_PROVINCE_REDIRECTS`).
 *
 * Uso:
 *   node scripts/consolidate-duplicate-provinces.mjs             # dry-run (default)
 *   node scripts/consolidate-duplicate-provinces.mjs --execute   # aplica cambios
 *   node scripts/consolidate-duplicate-provinces.mjs --json      # salida JSON
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
const execute = args.includes('--execute');
const asJson = args.includes('--json');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
const admin = createClient(supabaseUrl, serviceKey);

// Reglas de consolidación (alineadas con docs/SEO-LANDINGS.md §8.9).
// `aliasDisplayNames` son los valores concretos que aparecen en centers.province
// (con tildes y mayúsculas) que hay que reemplazar por `canonicalDisplayName`.
// `aliasSlugs` son los slugs URL que hay que purgar de las tablas SEO.
const RULES = [
  {
    canonicalSlug: 'baleares',
    canonicalDisplayName: 'Baleares',
    aliasDisplayNames: ['Islas Baleares'],
    aliasSlugs: ['islas-baleares'],
  },
  {
    canonicalSlug: 'gipuzkoa',
    canonicalDisplayName: 'Gipuzkoa',
    aliasDisplayNames: ['Guipúzcoa', 'Guipuzcoa'],
    aliasSlugs: ['guipuzcoa'],
  },
  {
    canonicalSlug: 'lleida',
    canonicalDisplayName: 'Lleida',
    aliasDisplayNames: ['Lérida', 'Lerida'],
    aliasSlugs: ['lerida'],
  },
  {
    canonicalSlug: 'santa-cruz-de-tenerife',
    canonicalDisplayName: 'Santa Cruz de Tenerife',
    aliasDisplayNames: ['Tenerife'],
    aliasSlugs: ['tenerife'],
  },
  {
    canonicalSlug: 'pyrenees-atlantiques',
    canonicalDisplayName: 'Pyrénées-Atlantiques',
    aliasDisplayNames: ['Pirineos Atlánticos', 'Pirineos Atlanticos'],
    aliasSlugs: ['pirineos-atlanticos'],
  },
];

async function countCenters(displayNames) {
  if (displayNames.length === 0) return 0;
  const { count, error } = await admin
    .from('centers')
    .select('*', { count: 'exact', head: true })
    .in('province', displayNames);
  if (error) throw new Error(error.message);
  return count || 0;
}

async function countSeoRows(table, slugs) {
  if (slugs.length === 0) return 0;
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .in('province_slug', slugs);
  if (error) throw new Error(error.message);
  return count || 0;
}

async function applyRule(rule) {
  const beforeCenters = await countCenters(rule.aliasDisplayNames);
  const beforeTypeProvSeo = await countSeoRows('center_type_province_seo', rule.aliasSlugs);
  const beforeStyleProvSeo = await countSeoRows('style_province_seo', rule.aliasSlugs);

  if (beforeCenters === 0 && beforeTypeProvSeo === 0 && beforeStyleProvSeo === 0) {
    return {
      rule: rule.canonicalSlug,
      action: 'skip',
      reason: 'nada que consolidar',
    };
  }

  if (!execute) {
    return {
      rule: rule.canonicalSlug,
      action: 'dry-run',
      planned_updates: {
        centers: beforeCenters,
        center_type_province_seo_deletes: beforeTypeProvSeo,
        style_province_seo_deletes: beforeStyleProvSeo,
      },
      sql_preview: [
        `UPDATE centers SET province = '${rule.canonicalDisplayName}' WHERE province IN (${rule.aliasDisplayNames.map((s) => `'${s}'`).join(', ')});`,
        `DELETE FROM center_type_province_seo WHERE province_slug IN (${rule.aliasSlugs.map((s) => `'${s}'`).join(', ')});`,
        `DELETE FROM style_province_seo WHERE province_slug IN (${rule.aliasSlugs.map((s) => `'${s}'`).join(', ')});`,
      ],
    };
  }

  // EJECUCIÓN REAL
  const { error: updErr, count: updCount } = await admin
    .from('centers')
    .update({ province: rule.canonicalDisplayName }, { count: 'exact' })
    .in('province', rule.aliasDisplayNames);
  if (updErr) throw new Error(`UPDATE centers: ${updErr.message}`);

  let typeProvDeleted = 0;
  if (beforeTypeProvSeo > 0) {
    const { error: delErr1, count: c1 } = await admin
      .from('center_type_province_seo')
      .delete({ count: 'exact' })
      .in('province_slug', rule.aliasSlugs);
    if (delErr1) throw new Error(`DELETE center_type_province_seo: ${delErr1.message}`);
    typeProvDeleted = c1 || 0;
  }

  let styleProvDeleted = 0;
  if (beforeStyleProvSeo > 0) {
    const { error: delErr2, count: c2 } = await admin
      .from('style_province_seo')
      .delete({ count: 'exact' })
      .in('province_slug', rule.aliasSlugs);
    if (delErr2) throw new Error(`DELETE style_province_seo: ${delErr2.message}`);
    styleProvDeleted = c2 || 0;
  }

  return {
    rule: rule.canonicalSlug,
    action: 'executed',
    updated: {
      centers: updCount || 0,
      center_type_province_seo_deleted: typeProvDeleted,
      style_province_seo_deleted: styleProvDeleted,
    },
  };
}

async function main() {
  const results = [];
  for (const rule of RULES) {
    try {
      const r = await applyRule(rule);
      results.push(r);
    } catch (e) {
      results.push({ rule: rule.canonicalSlug, action: 'error', message: e.message });
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ execute, results }, null, 2));
    return;
  }

  const title = execute ? 'CONSOLIDACIÓN EJECUTADA' : 'CONSOLIDACIÓN (DRY-RUN — no se ha tocado nada)';
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ${title}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const r of results) {
    if (r.action === 'skip') {
      console.log(`✓ ${r.rule} — ${r.reason}`);
      continue;
    }
    if (r.action === 'error') {
      console.log(`✗ ${r.rule} — ERROR: ${r.message}`);
      continue;
    }
    if (r.action === 'dry-run') {
      console.log(`◆ ${r.rule}`);
      console.log(`   centers a actualizar: ${r.planned_updates.centers}`);
      console.log(`   filas center_type_province_seo a borrar: ${r.planned_updates.center_type_province_seo_deletes}`);
      console.log(`   filas style_province_seo a borrar: ${r.planned_updates.style_province_seo_deletes}`);
      r.sql_preview.forEach((s) => console.log(`   SQL: ${s}`));
      console.log('');
      continue;
    }
    if (r.action === 'executed') {
      console.log(`✅ ${r.rule}`);
      console.log(`   centers actualizados: ${r.updated.centers}`);
      console.log(`   filas center_type_province_seo borradas: ${r.updated.center_type_province_seo_deleted}`);
      console.log(`   filas style_province_seo borradas: ${r.updated.style_province_seo_deleted}\n`);
    }
  }

  if (!execute) {
    console.log('Para aplicar: node scripts/consolidate-duplicate-provinces.mjs --execute\n');
    console.log('⚠️  NO olvides actualizar src/middleware.ts con las redirecciones 301 (hecho automáticamente si usas la entrada DUPLICATE_PROVINCE_REDIRECTS).\n');
  } else {
    console.log('✅ Datos consolidados. Próximos pasos:');
    console.log('   1. Comprobar que src/middleware.ts tiene las 301 (DUPLICATE_PROVINCE_REDIRECTS).');
    console.log('   2. Regenerar contenido SEO para los slugs canónicos con:');
    console.log('      npm run seo:type-province -- --force');
    console.log('      (o el nuevo generador seo:sections cuando esté listo).\n');
  }
}

main().catch((e) => {
  console.error('ERR:', e);
  process.exit(1);
});
