#!/usr/bin/env node
/**
 * Traduce artículos publicados ES → EN (título, extracto, contenido, metas, slug_en).
 * Usa .env.local: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   node scripts/translate-blog-articles-en.mjs
 *   node scripts/translate-blog-articles-en.mjs --dry-run
 *   node scripts/translate-blog-articles-en.mjs --force   (retraduce aunque ya haya EN)
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
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

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

if (!OPENAI_KEY) {
  console.error('Falta OPENAI_API_KEY');
  process.exit(1);
}

function enSlugFromTitle(titleEn, slugEs) {
  const s = slugify(titleEn, { lower: true, strict: true, trim: true });
  if (!s || s === slugEs) return null;
  return s;
}

async function translateMetaBundle(fields) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You translate Retiru blog metadata from Spanish to natural US English.
Return ONLY JSON with keys: title_en, excerpt_en, meta_title_en, meta_description_en.
Rules: meta_title_en 50-60 characters; meta_description_en 150-160 characters; excerpt_en 1-2 sentences.`,
        },
        {
          role: 'user',
          content: `Translate these fields:\n${JSON.stringify(fields)}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty meta response');
  return JSON.parse(raw);
}

async function translateMarkdownBody(contentEs) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      max_tokens: 8000,
      messages: [
        {
          role: 'system',
          content: `You translate Spanish markdown to US English for a wellness travel blog.
Preserve exactly: heading levels (###, ####), **bold**, *italic*, list markers (- and 1.), line breaks and paragraph spacing.
Do not add or remove sections. Do not wrap output in code fences.`,
        },
        { role: 'user', content: contentEs },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty body response');
  return text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
}

function needsTranslation(row) {
  if (FORCE) return true;
  const ce = (row.content_en || '').trim();
  const cs = (row.content_es || '').trim();
  const te = (row.title_en || '').trim();
  if (!ce || ce.length < Math.min(200, cs.length * 0.4)) return true;
  if (!te) return true;
  if (ce === cs) return true;
  return false;
}

const { data: articles, error } = await supabase
  .from('blog_articles')
  .select(
    'id, slug, slug_en, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en, meta_title_es, meta_title_en, meta_description_es, meta_description_en, read_time_min'
  )
  .eq('is_published', true)
  .order('published_at', { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const list = (articles || []).filter((a) => a.content_es?.trim());
const toProcess = list.filter(needsTranslation);

console.log(`\n═══ Blog ES → EN ═══`);
console.log(`Publicados con contenido ES: ${list.length}`);
console.log(`A traducir (${FORCE ? 'force' : 'solo faltantes / duplicados'}): ${toProcess.length}\n`);

if (toProcess.length === 0) {
  console.log('Nada que hacer. Usa --force para retraducir todo.');
  process.exit(0);
}

let ok = 0;
let fail = 0;

for (let i = 0; i < toProcess.length; i++) {
  const a = toProcess[i];
  process.stdout.write(`[${i + 1}/${toProcess.length}] ${a.slug}... `);
  try {
    const meta = await translateMetaBundle({
      title_es: a.title_es,
      excerpt_es: a.excerpt_es,
      meta_title_es: a.meta_title_es || a.title_es,
      meta_description_es: a.meta_description_es || a.excerpt_es,
    });
    const content_en = await translateMarkdownBody(a.content_es);

    const title_en = (meta.title_en || '').trim();
    const excerpt_en = (meta.excerpt_en || '').trim();
    const meta_title_en = (meta.meta_title_en || title_en).trim().slice(0, 70);
    const meta_description_en = (meta.meta_description_en || excerpt_en).trim().slice(0, 200);
    const slug_en = enSlugFromTitle(title_en, a.slug);

    if (DRY_RUN) {
      console.log(`OK (dry-run) slug_en=${slug_en || 'null'}`);
      ok++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('blog_articles')
      .update({
        title_en,
        excerpt_en,
        content_en,
        meta_title_en,
        meta_description_en,
        slug_en,
        read_time_min: a.read_time_min ?? Math.max(5, Math.ceil(content_en.split(/\s+/).length / 200)),
      })
      .eq('id', a.id);

    if (upErr) throw upErr;
    console.log(`✓ slug_en=${slug_en || '(igual ES)'}`);
    ok++;
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    console.log(`✗ ${e.message}`);
    fail++;
    if (e.message?.includes('429')) await new Promise((r) => setTimeout(r, 20000));
  }
}

console.log(`\n═══ Fin: ${ok} ok · ${fail} errores ═══\n`);
