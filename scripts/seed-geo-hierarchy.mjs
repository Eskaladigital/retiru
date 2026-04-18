#!/usr/bin/env node
/**
 * RETIRU · Seed de jerarquía geográfica en `destinations`
 *   país (country) → comunidad autónoma (region) → provincia (province) → destino (destination)
 *
 * Se ejecuta tras aplicar la migración 037. Idempotente (upsert por slug).
 *   node scripts/seed-geo-hierarchy.mjs
 *   node scripts/seed-geo-hierarchy.mjs --dry-run
 *
 * Lee `.env.local` (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  readFileSync(p, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq <= 0) return;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, eq).trim()] = v;
  });
}
loadEnv();

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dryRun = process.argv.includes('--dry-run');

// ─── Datos maestros ─────────────────────────────────────────────────────────

// Países con landing propia
const COUNTRIES = [
  { slug: 'espana', name_es: 'España', name_en: 'Spain', country: 'ES' },
  { slug: 'marruecos', name_es: 'Marruecos', name_en: 'Morocco', country: 'MA' },
];

// Comunidades autónomas de España (parent_slug = 'espana')
const CCAA = [
  { slug: 'andalucia', name_es: 'Andalucía', name_en: 'Andalusia' },
  { slug: 'aragon', name_es: 'Aragón', name_en: 'Aragon' },
  { slug: 'cantabria', name_es: 'Cantabria', name_en: 'Cantabria' },
  { slug: 'castilla-la-mancha', name_es: 'Castilla-La Mancha', name_en: 'Castilla-La Mancha' },
  { slug: 'castilla-y-leon', name_es: 'Castilla y León', name_en: 'Castile and León' },
  { slug: 'cataluna', name_es: 'Cataluña', name_en: 'Catalonia' },
  { slug: 'comunidad-de-madrid', name_es: 'Comunidad de Madrid', name_en: 'Community of Madrid' },
  { slug: 'comunidad-foral-de-navarra', name_es: 'Comunidad Foral de Navarra', name_en: 'Navarre' },
  { slug: 'comunidad-valenciana', name_es: 'Comunidad Valenciana', name_en: 'Valencian Community' },
  { slug: 'extremadura', name_es: 'Extremadura', name_en: 'Extremadura' },
  { slug: 'galicia', name_es: 'Galicia', name_en: 'Galicia' },
  { slug: 'islas-baleares', name_es: 'Islas Baleares', name_en: 'Balearic Islands' },
  { slug: 'islas-canarias', name_es: 'Islas Canarias', name_en: 'Canary Islands' },
  { slug: 'la-rioja', name_es: 'La Rioja', name_en: 'La Rioja' },
  { slug: 'pais-vasco', name_es: 'País Vasco', name_en: 'Basque Country' },
  { slug: 'principado-de-asturias', name_es: 'Principado de Asturias', name_en: 'Asturias' },
  { slug: 'region-de-murcia', name_es: 'Región de Murcia', name_en: 'Region of Murcia' },
];

// Provincias top con su CCAA (parent_slug). Se crean con slug propio salvo que el
// slug base ya esté ocupado por un destino hoja (p. ej. "murcia"), en cuyo caso
// se deja sin fila provincial (la región uniprovincial sirve como nivel).
const PROVINCIAS = [
  { slug: 'madrid', name_es: 'Madrid', name_en: 'Madrid', parent: 'comunidad-de-madrid' },
  { slug: 'barcelona', name_es: 'Barcelona', name_en: 'Barcelona', parent: 'cataluna' },
  { slug: 'malaga', name_es: 'Málaga', name_en: 'Málaga', parent: 'andalucia' },
  { slug: 'baleares', name_es: 'Baleares', name_en: 'Balearic Islands', parent: 'islas-baleares' },
  { slug: 'las-palmas', name_es: 'Las Palmas', name_en: 'Las Palmas', parent: 'islas-canarias' },
  { slug: 'santa-cruz-de-tenerife', name_es: 'Santa Cruz de Tenerife', name_en: 'Santa Cruz de Tenerife', parent: 'islas-canarias' },
  { slug: 'tarragona', name_es: 'Tarragona', name_en: 'Tarragona', parent: 'cataluna' },
  { slug: 'asturias', name_es: 'Asturias', name_en: 'Asturias', parent: 'principado-de-asturias' },
  { slug: 'cadiz', name_es: 'Cádiz', name_en: 'Cádiz', parent: 'andalucia' },
  { slug: 'sevilla', name_es: 'Sevilla', name_en: 'Seville', parent: 'andalucia' },
  { slug: 'albacete', name_es: 'Albacete', name_en: 'Albacete', parent: 'castilla-la-mancha' },
  { slug: 'valencia', name_es: 'Valencia', name_en: 'Valencia', parent: 'comunidad-valenciana' },
  { slug: 'granada', name_es: 'Granada', name_en: 'Granada', parent: 'andalucia' },
  { slug: 'girona', name_es: 'Girona', name_en: 'Girona', parent: 'cataluna' },
  { slug: 'alicante', name_es: 'Alicante', name_en: 'Alicante', parent: 'comunidad-valenciana' },
  { slug: 'navarra', name_es: 'Navarra', name_en: 'Navarre', parent: 'comunidad-foral-de-navarra' },
  { slug: 'cordoba', name_es: 'Córdoba', name_en: 'Córdoba', parent: 'andalucia' },
  { slug: 'leon', name_es: 'León', name_en: 'León', parent: 'castilla-y-leon' },
  { slug: 'almeria', name_es: 'Almería', name_en: 'Almería', parent: 'andalucia' },
  { slug: 'badajoz', name_es: 'Badajoz', name_en: 'Badajoz', parent: 'extremadura' },
  { slug: 'jaen', name_es: 'Jaén', name_en: 'Jaén', parent: 'andalucia' },
  { slug: 'burgos', name_es: 'Burgos', name_en: 'Burgos', parent: 'castilla-y-leon' },
  { slug: 'huelva', name_es: 'Huelva', name_en: 'Huelva', parent: 'andalucia' },
  { slug: 'zaragoza', name_es: 'Zaragoza', name_en: 'Zaragoza', parent: 'aragon' },
  { slug: 'caceres', name_es: 'Cáceres', name_en: 'Cáceres', parent: 'extremadura' },
  { slug: 'toledo', name_es: 'Toledo', name_en: 'Toledo', parent: 'castilla-la-mancha' },
];

// Mapa region.column (texto libre que tenía la tabla) → slug de CCAA, para
// backfillear parent_slug de destinos existentes.
const REGION_TEXT_TO_SLUG = {
  'Andalucía': 'andalucia',
  'Aragón': 'aragon',
  'Asturias': 'principado-de-asturias',
  'Cantabria': 'cantabria',
  'Castilla y León': 'castilla-y-leon',
  'Castilla-La Mancha': 'castilla-la-mancha',
  'Cataluña': 'cataluna',
  'Comunidad de Madrid': 'comunidad-de-madrid',
  'Comunidad Foral de Navarra': 'comunidad-foral-de-navarra',
  'Comunidad Valenciana': 'comunidad-valenciana',
  'Extremadura': 'extremadura',
  'Galicia': 'galicia',
  'Islas Baleares': 'islas-baleares',
  'Islas Canarias': 'islas-canarias',
  'La Rioja': 'la-rioja',
  'País Vasco': 'pais-vasco',
  'Principado de Asturias': 'principado-de-asturias',
  'Región de Murcia': 'region-de-murcia',
  'Navarra': 'comunidad-foral-de-navarra',
  'Madrid': 'comunidad-de-madrid',
  // países/otros
  'Marrakech, Alto Atlas y Sahara': null,
};

async function upsert(row) {
  if (dryRun) {
    console.log('  [DRY]', row.kind.padEnd(12), row.slug);
    return;
  }
  const { error } = await sb
    .from('destinations')
    .upsert(row, { onConflict: 'slug' });
  if (error) {
    console.error('  ❌', row.slug, '→', error.message);
    return;
  }
  console.log('  ✓', row.kind.padEnd(12), row.slug);
}

async function run() {
  console.log('🌍 Seed geo-jerarquía' + (dryRun ? ' (DRY-RUN)' : ''));

  // 1) Países — detectar colisiones con destinos hoja existentes
  console.log('\nPaíses:');
  const { data: countryCollisions } = await sb
    .from('destinations')
    .select('slug, kind')
    .in('slug', COUNTRIES.map((c) => c.slug));
  const collidesAsDest = new Set(
    (countryCollisions || []).filter((r) => r.kind === 'destination').map((r) => r.slug),
  );
  for (const c of COUNTRIES) {
    if (collidesAsDest.has(c.slug)) {
      // Ya existe como destino hoja. Mantenemos el destination y creamos
      // también un alias "{slug}-pais" para la landing de país, así los
      // retiros existentes con destination_id=<slug> siguen en
      // /es/retiros-retiru/{slug} sin tocarse.
      const aliasSlug = `${c.slug}-pais`;
      await upsert({
        slug: aliasSlug,
        name_es: c.name_es,
        name_en: c.name_en,
        kind: 'country',
        parent_slug: null,
        country: c.country,
        region: null,
        is_active: true,
      });
      // El destino hoja original se cuelga del país-alias para que aparezca
      // como descendiente en /es/retiros-en/{alias}.
      if (!dryRun) {
        const { error } = await sb.from('destinations').update({ parent_slug: aliasSlug }).eq('slug', c.slug).eq('kind', 'destination');
        if (error) console.error('  ⚠ backfill parent ' + c.slug + ' →', error.message);
      }
      console.log('  · ' + c.slug.padEnd(12) + ' ya es destino → se crea alias ' + aliasSlug);
      continue;
    }
    await upsert({
      slug: c.slug,
      name_es: c.name_es,
      name_en: c.name_en,
      kind: 'country',
      parent_slug: null,
      country: c.country,
      region: null,
      is_active: true,
    });
  }

  // 2) Comunidades autónomas (España)
  console.log('\nComunidades autónomas (ES):');
  for (const r of CCAA) {
    await upsert({
      slug: r.slug,
      name_es: r.name_es,
      name_en: r.name_en,
      kind: 'region',
      parent_slug: 'espana',
      country: 'ES',
      region: r.name_es,
      is_active: true,
    });
  }

  // 3) Provincias top
  console.log('\nProvincias top (ES):');
  // Detectar colisiones con destinos hoja existentes
  const { data: existingSlugs } = await sb
    .from('destinations')
    .select('slug, kind')
    .in('slug', PROVINCIAS.map((p) => p.slug));
  const colidingAsDestination = new Set(
    (existingSlugs || []).filter((r) => r.kind === 'destination').map((r) => r.slug),
  );

  for (const p of PROVINCIAS) {
    if (colidingAsDestination.has(p.slug)) {
      // Ya existe como destino hoja; solo le asignamos parent_slug para colgar
      // de su CCAA, pero no lo promocionamos a 'province'.
      if (!dryRun) {
        const { error } = await sb
          .from('destinations')
          .update({ parent_slug: p.parent })
          .eq('slug', p.slug)
          .eq('kind', 'destination');
        if (error) console.error('  ⚠ ' + p.slug + ' backfill parent:', error.message);
      }
      console.log('  · ' + p.slug.padEnd(28) + ' (ya existe como destino; solo se asigna parent)');
      continue;
    }
    await upsert({
      slug: p.slug,
      name_es: p.name_es,
      name_en: p.name_en,
      kind: 'province',
      parent_slug: p.parent,
      country: 'ES',
      region: CCAA.find((c) => c.slug === p.parent)?.name_es || null,
      is_active: true,
    });
  }

  // 4) Backfill parent_slug de destinos hoja existentes sin parent
  console.log('\nBackfill parent_slug en destinos hoja existentes:');
  const { data: leaves } = await sb
    .from('destinations')
    .select('slug, name_es, country, region, parent_slug, kind')
    .eq('kind', 'destination');

  for (const d of leaves || []) {
    if (d.parent_slug) continue;
    let parent = null;
    if (d.country && d.country !== 'ES') {
      // para países distintos a ES, padre = país (si existe)
      const countrySlug = COUNTRIES.find((c) => c.country === d.country)?.slug;
      parent = countrySlug || null;
    } else if (d.region) {
      parent = REGION_TEXT_TO_SLUG[d.region] || null;
    }
    if (!parent) {
      console.log('  · ' + d.slug.padEnd(28) + '  (sin parent detectable)');
      continue;
    }
    if (dryRun) {
      console.log('  [DRY] ' + d.slug + ' → parent=' + parent);
      continue;
    }
    const { error } = await sb.from('destinations').update({ parent_slug: parent }).eq('slug', d.slug);
    if (error) console.error('  ❌', d.slug, error.message);
    else console.log('  ✓ ' + d.slug.padEnd(28) + ' → parent=' + parent);
  }

  console.log('\n✅ Listo.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
