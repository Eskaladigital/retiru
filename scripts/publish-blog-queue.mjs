#!/usr/bin/env node
/**
 * RETIRU · Publicar cola de 100 artículos (texto OpenAI + portada IA + fechas programadas)
 *
 * Lee docs/BLOG-TITULOS-PROPUESTOS.md. Calendario: 2/semana (~3 y 4 días) desde el 21-may-2026
 * (3 días después del último post existente, 18-may-2026). Los futuros no se ven en web hasta su fecha.
 *
 * Uso:
 *   node scripts/publish-blog-queue.mjs --dry-run
 *   node scripts/publish-blog-queue.mjs --limit=5
 *   node scripts/publish-blog-queue.mjs --offset=10 --limit=10
 *   node scripts/publish-blog-queue.mjs --skip-covers
 *   node scripts/publish-blog-queue.mjs --resume
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 * Opcional: SERPAPI_API_KEY
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const QUEUE_PATH = join(root, 'docs', 'BLOG-TITULOS-PROPUESTOS.md');
const PROGRESS_PATH = join(__dirname, '.blog-queue-progress.json');

const ANCHOR_DATE = '2026-05-18T09:00:00.000Z';
const FIRST_GAP_DAYS = 3;
const GAP_CYCLE = [3, 4];
const PUBLISH_HOUR_UTC = 9;

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let value = trimmed.slice(eq + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function categorySlugForLetter(letter) {
  if (letter === 'Y' || letter === 'M') return 'guias';
  return 'bienestar';
}

function loadQueueItems() {
  if (!existsSync(QUEUE_PATH)) {
    console.error('❌ Falta docs/BLOG-TITULOS-PROPUESTOS.md');
    process.exit(1);
  }
  const text = readFileSync(QUEUE_PATH, 'utf8');
  const items = [];
  const re = /^\|\s*(\d+)\s*\|\s*([RNMYA])\s*\|\s*(.+?)\s*\|/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    items.push({
      index: parseInt(m[1], 10),
      letter: m[2],
      topic: m[3].trim(),
      categorySlug: categorySlugForLetter(m[2]),
    });
  }
  return items.sort((a, b) => a.index - b.index);
}

/** index 1-based → ISO published_at */
function publishedAtForQueueIndex(queueIndex) {
  const d = new Date(ANCHOR_DATE);
  d.setUTCDate(d.getUTCDate() + FIRST_GAP_DAYS);
  for (let i = 1; i < queueIndex; i++) {
    d.setUTCDate(d.getUTCDate() + GAP_CYCLE[(i - 1) % GAP_CYCLE.length]);
  }
  d.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0);
  return d.toISOString();
}

function loadProgress() {
  if (!existsSync(PROGRESS_PATH)) return { done: [] };
  try {
    return JSON.parse(readFileSync(PROGRESS_PATH, 'utf8'));
  } catch {
    return { done: [] };
  }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = null;
  let offset = 0;
  const flags = {
    dryRun: args.includes('--dry-run'),
    skipCovers: args.includes('--skip-covers'),
    resume: args.includes('--resume'),
  };
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = Math.max(1, parseInt(a.slice(8), 10) || 1);
    if (a.startsWith('--offset=')) offset = Math.max(0, parseInt(a.slice(9), 10) || 0);
  }
  return { limit, offset, ...flags };
}

async function searchSerp(query, serpKey) {
  if (!serpKey) return '';
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&num=5`,
    );
    const data = res.ok ? await res.json() : null;
    if (data?.organic_results?.length) {
      return data.organic_results
        .map((r) => r.snippet || r.title)
        .filter(Boolean)
        .slice(0, 5)
        .join('\n');
    }
  } catch (e) {
    console.warn('  ⚠ SerpAPI:', e.message);
  }
  return '';
}

async function generateArticle(topic, serpContext, openaiKey) {
  const systemPrompt = `Eres redactor de Retiru (retiru.com), plataforma de retiros y bienestar en España.
Escribe artículos de blog INFORMATIVOS: recetas, nutrición, tipos de yoga/meditación, aceites y tratamientos ayurvédicos, prácticas concretas.

LÍNEA EDITORIAL (docs/BLOG-EDITORIAL.md):
- NO vendas retiros ni destinos. No «retiros en [ciudad]», maletas, cancelaciones.
- Datos útiles: pasos, ingredientes, duraciones, precauciones.
- Menciona Retiru como mucho una vez al final, breve.

Tono profesional y sobrio. Sin esoterismo vacío ni sustancias psicoactivas.
FORMATO markdown: ### secciones, - listas, **negrita**, párrafos con doble salto. Sin tablas ni HTML.
Responde SOLO JSON válido.`;

  const userPrompt = `Genera un artículo sobre: "${topic}"

${serpContext ? `Contexto búsqueda (no copies literal):\n${serpContext}\n\n` : ''}

JSON exacto:
{
  "title_es": "título en español (usa el tema dado o variante SEO)",
  "title_en": "título en inglés",
  "slug": "slug-url-unico-en-es",
  "excerpt_es": "resumen 1-2 frases ES",
  "excerpt_en": "resumen 1-2 frases EN",
  "content_es": "800-1200 palabras ES, markdown",
  "content_en": "600-900 palabras EN, markdown",
  "read_time_min": número,
  "meta_title_es": "SEO 50-60 chars",
  "meta_title_en": "SEO EN 50-60 chars",
  "meta_description_es": "150-160 chars",
  "meta_description_en": "150-160 chars EN"
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('OpenAI no devolvió contenido');

  let jsonStr = raw;
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();
  return JSON.parse(jsonStr);
}

function runCoverBackfill(articleId) {
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'backfill-blog-covers-ai.mjs'), `--id=${articleId}`, '--force'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`Portada IA falló (exit ${r.status})`);
}

async function main() {
  loadEnvLocal();
  const { limit, offset, dryRun, skipCovers, resume } = parseArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const serpKey = process.env.SERPAPI_API_KEY || '';

  if (!url || !serviceKey || !openaiKey) {
    console.error('❌ Faltan SUPABASE_* u OPENAI_API_KEY en .env.local');
    process.exit(1);
  }

  const allItems = loadQueueItems();
  let slice = allItems.slice(offset);
  if (limit != null) slice = slice.slice(0, limit);

  const progress = loadProgress();
  const doneSet = new Set(progress.done || []);

  if (resume) {
    slice = slice.filter((item) => !doneSet.has(item.index));
  }

  console.log(`\n📚 RETIRU · Cola blog: ${slice.length} artículo(s) (offset ${offset}, dry-run=${dryRun})\n`);

  if (slice.length === 0) {
    console.log('Nada que procesar.');
    return;
  }

  slice.slice(0, 3).forEach((item) => {
    console.log(`   #${item.index} → ${publishedAtForQueueIndex(item.index).slice(0, 10)} · ${item.topic.slice(0, 55)}…`);
  });
  if (slice.length > 3) console.log(`   … y ${slice.length - 3} más\n`);

  if (dryRun) {
    console.log('Dry-run: no se escribe en BD.');
    return;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  const categories = [
    { name_es: 'Guías', name_en: 'Guides', slug: 'guias', sort_order: 1 },
    { name_es: 'Bienestar', name_en: 'Wellness', slug: 'bienestar', sort_order: 2 },
    { name_es: 'Destinos', name_en: 'Destinations', slug: 'destinos', sort_order: 3 },
  ];
  for (const cat of categories) {
    await supabase.from('blog_categories').upsert(cat, { onConflict: 'slug' });
  }

  const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin').limit(1);
  let authorId = adminRoles?.[0]?.user_id;
  if (!authorId) {
    const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1);
    authorId = anyProfile?.[0]?.id;
  }
  if (!authorId) {
    console.error('❌ No hay perfiles en BD');
    process.exit(1);
  }

  const { data: cats } = await supabase.from('blog_categories').select('id, slug');
  const catMap = Object.fromEntries((cats || []).map((c) => [c.slug, c.id]));

  let ok = 0;
  let fail = 0;

  for (const item of slice) {
    const publishedAt = publishedAtForQueueIndex(item.index);
    console.log(`\n── #${item.index}/${allItems.length} · ${publishedAt.slice(0, 10)} ──`);
    console.log(`   ${item.topic}`);

    try {
      const baseSlug = slugify(item.topic);
      const { data: existing } = await supabase
        .from('blog_articles')
        .select('id, slug, cover_image_url')
        .eq('slug', baseSlug)
        .maybeSingle();

      if (existing?.id) {
        console.log(`   ↷ Ya existe (${existing.slug}), actualizo fecha y salto generación texto`);
        await supabase
          .from('blog_articles')
          .update({ published_at: publishedAt, is_published: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (!skipCovers && (!existing.cover_image_url || existing.cover_image_url.includes('unsplash'))) {
          console.log('   🖼 Portada…');
          runCoverBackfill(existing.id);
        }
        doneSet.add(item.index);
        progress.done = [...doneSet].sort((a, b) => a - b);
        saveProgress(progress);
        ok++;
        continue;
      }

      const serpContext = await searchSerp(`${item.topic} receta guía`, serpKey);
      console.log('   ✍️  Generando texto…');
      const article = await generateArticle(item.topic, serpContext, openaiKey);

      const slug = article.slug || baseSlug;
      const titleEn = article.title_en || article.title_es;
      const slugEn = slugify(titleEn);
      const nowIso = new Date().toISOString();

      const row = {
        title_es: article.title_es || item.topic,
        title_en: titleEn,
        slug,
        slug_en: slugEn !== slug ? slugEn : null,
        excerpt_es: article.excerpt_es,
        excerpt_en: article.excerpt_en || article.excerpt_es,
        content_es: article.content_es,
        content_en: article.content_en || article.content_es,
        category_id: catMap[item.categorySlug] || catMap.bienestar,
        author_id: authorId,
        cover_image_url: null,
        read_time_min: article.read_time_min || 8,
        is_published: true,
        published_at: publishedAt,
        meta_title_es: article.meta_title_es || article.title_es,
        meta_title_en: article.meta_title_en || titleEn,
        meta_description_es: article.meta_description_es || article.excerpt_es,
        meta_description_en: article.meta_description_en || article.excerpt_en,
        view_count: 0,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const { data: inserted, error } = await supabase.from('blog_articles').insert(row).select('id').single();
      if (error) throw new Error(error.message);

      console.log(`   ✅ Insertado: ${slug} (${inserted.id.slice(0, 8)}…)`);

      if (!skipCovers) {
        console.log('   🖼 Portada IA…');
        runCoverBackfill(inserted.id);
      }

      doneSet.add(item.index);
      progress.done = [...doneSet].sort((a, b) => a - b);
      saveProgress(progress);
      ok++;
    } catch (e) {
      fail++;
      console.error(`   ❌ ${e.message}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✅ OK: ${ok} · ❌ Fallos: ${fail} · Progreso: ${doneSet.size}/${allItems.length}`);
  console.log(`   Log progreso: scripts/.blog-queue-progress.json\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
