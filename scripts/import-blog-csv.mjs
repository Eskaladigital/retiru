#!/usr/bin/env node
/**
 * Importa artículos de blog desde CSV (Titulo, Articulo, Ingles, …).
 * - Orden: barajado (semilla fija), no alfabético.
 * - Fechas: 10 → 11 → 12 → 13 días entre publicaciones sucesivas (hacia atrás).
 *
 * Uso:
 *   node scripts/import-blog-csv.mjs [ruta.csv]              # solo genera SQL
 *   node scripts/import-blog-csv.mjs [ruta.csv] --push       # inserta/actualiza en Supabase (.env.local)
 *   node scripts/import-blog-csv.mjs --push --dry-run      # muestra qué haría sin escribir
 *
 * Variables .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const toSlug = (s, locale = 'es') =>
  slugify(String(s || ''), { lower: true, strict: true, locale });

function loadEnvLocal() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) return false;
  readFileSync(p, 'utf8').split('\n').forEach((line) => {
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
  return true;
}

/** Parser CSV con campos entre comillas y saltos de línea internos */
function parseCsvRecords(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
      if (c === '\r') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    if (c === '\r') {
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  }
  return rows;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleDeterministic(arr, seedLabel) {
  const seed = seedFromString(seedLabel);
  const rnd = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstLine(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  const line = t.split(/\r?\n/).find((l) => l.trim());
  return line ? line.trim() : '';
}

function excerptFromBody(body, max = 280) {
  const plain = String(body || '')
    .replace(/\r\n/g, '\n')
    .replace(/^#+\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
}

function readTimeMin(body) {
  const words = String(body || '')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(3, Math.min(45, Math.round(words / 200) || 5));
}

const COVERS = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',
  'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=1200&q=80',
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
];

const GAP_CYCLE = [10, 11, 12, 13];
const CAT_SLUGS = ['guias', 'bienestar', 'destinos'];
const SEED_LABEL = 'retiru-blog-csv-2026-v1';
const AUTHOR_ID = '00000000-0000-0000-0000-000000000001';

function publishedAtIso(anchorMs, daysBefore) {
  const d = new Date(anchorMs - daysBefore * 86400000);
  return d.toISOString();
}

function escapeSqlString(s) {
  return String(s).replace(/'/g, "''");
}

function dollarTags(i) {
  return { es: `csv${i}es`, en: `csv${i}en` };
}

/**
 * @param {Array<{titleEs:string,contentEs:string,contentEn:string}>} articles
 * @param {object} opts
 * @param {number} opts.anchorMs
 * @param {Set<string>} [opts.usedSlugs]
 * @param {Set<string>} [opts.usedSlugEn]
 */
function buildPreparedRows(articles, opts) {
  const shuffled = shuffleDeterministic(articles, SEED_LABEL);
  const usedSlugs = opts.usedSlugs ?? new Set();
  const usedSlugEn = opts.usedSlugEn ?? new Set();
  let daysBack = 0;
  const anchorMs = opts.anchorMs;
  const rows = [];

  for (let i = 0; i < shuffled.length; i++) {
    const a = shuffled[i];
    let titleEn = firstLine(a.contentEn);
    if (!titleEn) titleEn = a.titleEs;

    let slug = toSlug(a.titleEs);
    const base = slug;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
    usedSlugs.add(slug);

    let slugEn = toSlug(titleEn, 'en');
    const baseEn = slugEn;
    n = 2;
    while (usedSlugEn.has(slugEn)) slugEn = `${baseEn}-${n++}`;
    usedSlugEn.add(slugEn);

    const publishedAt = publishedAtIso(anchorMs, daysBack);
    if (i < shuffled.length - 1) daysBack += GAP_CYCLE[i % GAP_CYCLE.length];

    const exEs = excerptFromBody(a.contentEs);
    const exEn = excerptFromBody(a.contentEn || a.contentEs);
    const rt = Math.max(readTimeMin(a.contentEs), readTimeMin(a.contentEn));
    const categorySlug = CAT_SLUGS[i % CAT_SLUGS.length];
    const cover = COVERS[i % COVERS.length];
    const viewCount = Math.floor(20 + (i * 37) % 400);

    rows.push({
      title_es: a.titleEs,
      title_en: titleEn,
      slug,
      slug_en: slugEn,
      excerpt_es: exEs,
      excerpt_en: exEn,
      content_es: a.contentEs,
      content_en: a.contentEn || a.contentEs,
      category_slug: categorySlug,
      cover_image_url: cover,
      read_time_min: rt,
      is_published: true,
      published_at: publishedAt,
      meta_title_es: `${a.titleEs} | Retiru`,
      meta_title_en: `${titleEn} | Retiru`,
      meta_description_es: exEs.slice(0, 155),
      meta_description_en: exEn.slice(0, 155),
      view_count: viewCount,
      created_at: publishedAt,
      updated_at: publishedAt,
    });
  }

  return { rows, shuffledCount: shuffled.length, daysBack };
}

function writeSqlFile(preparedRows, anchorMs, daysBack, outPath) {
  const blocks = [];
  blocks.push(`-- ============================================================================
-- RETIRU · Blog: importación desde CSV (${preparedRows.length} artículos)
-- Orden: barajado (no alfabético). Fechas: -10/-11/-12/-13 días en ciclo.
-- Ejecutar en Supabase SQL Editor. Requiere categorías blog + perfil autor demo.
-- ============================================================================`);

  blocks.push(`DO $$
DECLARE
  author_id UUID := '${AUTHOR_ID}';
  cat_guias UUID;
  cat_bienestar UUID;
  cat_destinos UUID;
  cats UUID[];
BEGIN
  SELECT id INTO cat_guias FROM blog_categories WHERE slug = 'guias' LIMIT 1;
  SELECT id INTO cat_bienestar FROM blog_categories WHERE slug = 'bienestar' LIMIT 1;
  SELECT id INTO cat_destinos FROM blog_categories WHERE slug = 'destinos' LIMIT 1;
  cats := ARRAY[cat_guias, cat_bienestar, cat_destinos];
`);

  preparedRows.forEach((r, i) => {
    const catIdx = CAT_SLUGS.indexOf(r.category_slug);
    const { es: dEs, en: dEn } = dollarTags(i);
    const esc = (s) => escapeSqlString(s);

    blocks.push(`  INSERT INTO blog_articles (
    title_es, title_en, slug, slug_en,
    excerpt_es, excerpt_en, content_es, content_en,
    category_id, author_id, cover_image_url, read_time_min,
    is_published, published_at,
    meta_title_es, meta_title_en, meta_description_es, meta_description_en,
    view_count, created_at, updated_at
  ) VALUES (
    '${esc(r.title_es)}',
    '${esc(r.title_en)}',
    '${esc(r.slug)}',
    '${esc(r.slug_en)}',
    '${esc(r.excerpt_es)}',
    '${esc(r.excerpt_en)}',
    $${dEs}$
${r.content_es}
$${dEs}$,
    $${dEn}$
${r.content_en}
$${dEn}$,
    cats[${catIdx + 1}],
    author_id,
    '${esc(r.cover_image_url)}',
    ${r.read_time_min},
    true,
    '${r.published_at}'::timestamptz,
    '${esc(r.meta_title_es)}',
    '${esc(r.meta_title_en)}',
    '${esc(r.meta_description_es)}',
    '${esc(r.meta_description_en)}',
    ${r.view_count},
    '${r.published_at}'::timestamptz,
    '${r.published_at}'::timestamptz
  ) ON CONFLICT (slug) DO UPDATE SET
    title_es = EXCLUDED.title_es,
    title_en = EXCLUDED.title_en,
    slug_en = EXCLUDED.slug_en,
    excerpt_es = EXCLUDED.excerpt_es,
    excerpt_en = EXCLUDED.excerpt_en,
    content_es = EXCLUDED.content_es,
    content_en = EXCLUDED.content_en,
    category_id = EXCLUDED.category_id,
    cover_image_url = EXCLUDED.cover_image_url,
    read_time_min = EXCLUDED.read_time_min,
    is_published = EXCLUDED.is_published,
    published_at = EXCLUDED.published_at,
    meta_title_es = EXCLUDED.meta_title_es,
    meta_title_en = EXCLUDED.meta_title_en,
    meta_description_es = EXCLUDED.meta_description_es,
    meta_description_en = EXCLUDED.meta_description_en,
    updated_at = NOW();`);
  });

  blocks.push(`END $$;`);
  writeFileSync(outPath, blocks.join('\n'), 'utf8');

  console.log(`SQL → ${outPath}`);
  console.log('Primera publicación (más reciente):', publishedAtIso(anchorMs, 0));
  console.log('Última (más antigua), días atrás:', daysBack, '→', publishedAtIso(anchorMs, daysBack));
}

// ——— CLI ———
async function main() {
  const argv = process.argv.slice(2);
  const doPush = argv.includes('--push');
  const dryRun = argv.includes('--dry-run');
  const csvArg = argv.find((a) => !a.startsWith('--'));
  const csvPath = csvArg || join(root, 'Table 1-Grid view.csv');

  if (!existsSync(csvPath)) {
    console.error('No existe el CSV:', csvPath);
    process.exit(1);
  }

  const raw = readFileSync(csvPath, 'utf8');
  const table = parseCsvRecords(raw);
  if (table.length < 2) {
    console.error('CSV vacío o sin datos');
    process.exit(1);
  }

  const header = table[0].map((h) => h.trim());
  const idxTitulo = header.findIndex((h) => /^titulo$/i.test(h));
  const idxArt = header.findIndex((h) => /^articulo$/i.test(h));
  const idxEn = header.findIndex((h) => /^ingles$/i.test(h));
  if (idxTitulo < 0 || idxArt < 0 || idxEn < 0) {
    console.error('Cabeceras esperadas: Titulo, Articulo, Ingles. Encontrado:', header);
    process.exit(1);
  }

  const articles = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    if (!row || row.length < Math.max(idxTitulo, idxArt, idxEn) + 1) continue;
    const titleEs = String(row[idxTitulo] || '').trim();
    const contentEs = String(row[idxArt] || '').trim();
    const contentEn = String(row[idxEn] || '').trim();
    if (!titleEs || !contentEs) continue;
    articles.push({ titleEs, contentEs, contentEn });
  }

  if (articles.length === 0) {
    console.error('No se extrajo ningún artículo');
    process.exit(1);
  }

  const anchorMs = Date.now();
  const usedSlugs = new Set();
  const usedSlugEn = new Set();

  if (doPush) {
    if (!loadEnvLocal()) {
      console.error('No se encontró .env.local en la raíz del proyecto.');
      process.exit(1);
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
      process.exit(1);
    }

    const supabase = createClient(url, key);
    const { data: existing, error: exErr } = await supabase.from('blog_articles').select('slug, slug_en');
    if (exErr) {
      console.error('No se pudieron leer slugs existentes:', exErr.message);
      process.exit(1);
    }
    for (const row of existing || []) {
      usedSlugs.add(row.slug);
      if (row.slug_en) usedSlugEn.add(row.slug_en);
    }

    const { data: cats, error: catErr } = await supabase.from('blog_categories').select('id, slug');
    if (catErr || !cats?.length) {
      console.error('No se pudieron cargar blog_categories:', catErr?.message || 'vacío');
      process.exit(1);
    }
    const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    for (const s of CAT_SLUGS) {
      if (!catBySlug[s]) {
        console.error(`Falta la categoría de blog con slug "${s}". Ejecuta el seed 003_sample_blog.sql primero.`);
        process.exit(1);
      }
    }

    const { rows: preparedRows, daysBack } = buildPreparedRows(articles, {
      anchorMs,
      usedSlugs,
      usedSlugEn,
    });

    if (dryRun) {
      console.log(`[dry-run] Se insertarían/actualizarían ${preparedRows.length} artículos.`);
      preparedRows.slice(0, 3).forEach((r) => console.log(`  - ${r.slug} | ${r.published_at}`));
      if (preparedRows.length > 3) console.log(`  … y ${preparedRows.length - 3} más`);
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const r of preparedRows) {
      const category_id = catBySlug[r.category_slug];
      const payload = {
        title_es: r.title_es,
        title_en: r.title_en,
        slug: r.slug,
        slug_en: r.slug_en,
        excerpt_es: r.excerpt_es,
        excerpt_en: r.excerpt_en,
        content_es: r.content_es,
        content_en: r.content_en,
        category_id,
        author_id: AUTHOR_ID,
        cover_image_url: r.cover_image_url,
        read_time_min: r.read_time_min,
        is_published: r.is_published,
        published_at: r.published_at,
        meta_title_es: r.meta_title_es,
        meta_title_en: r.meta_title_en,
        meta_description_es: r.meta_description_es,
        meta_description_en: r.meta_description_en,
        view_count: r.view_count,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };

      const { error: upErr } = await supabase.from('blog_articles').upsert(payload, { onConflict: 'slug' });
      if (upErr) {
        console.error(`✗ ${r.slug}:`, upErr.message);
        fail++;
      } else {
        ok++;
        console.log(`✓ ${r.slug}`);
      }
    }

    console.log(`\nListo: ${ok} correctos, ${fail} errores.`);
    const outPath = join(root, 'supabase', 'seed', '016_blog_from_csv.sql');
    writeSqlFile(preparedRows, anchorMs, daysBack, outPath);
    if (fail > 0) process.exit(1);
    return;
  }

  const { rows: preparedRows, daysBack } = buildPreparedRows(articles, { anchorMs });
  const outPath = join(root, 'supabase', 'seed', '016_blog_from_csv.sql');
  writeSqlFile(preparedRows, anchorMs, daysBack, outPath);
  console.log(`OK: ${articles.length} filas CSV → ${preparedRows.length} artículos barajados`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
