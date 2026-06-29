#!/usr/bin/env node
/** Análisis rápido: artículos antiguos vs cola nueva */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) throw new Error('Falta .env.local');
  readFileSync(p, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq > 0) {
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = v;
    }
  });
}

function wc(text) {
  return (text || '').replace(/[#*_`[\]()>-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function metrics(text) {
  const t = text || '';
  return {
    words: wc(t),
    h3: (t.match(/^### .+/gm) || []).length,
    h4: (t.match(/^#### .+/gm) || []).length,
    bullets: (t.match(/^- .+/gm) || []).length,
    numbered: (t.match(/^\d+\. .+/gm) || []).length,
    hasPrecauciones: /precaucion|contraindic|no conviene|evitar si/i.test(t),
    hasIngredientes: /ingredient|materiales|necesitarás|necesitaras/i.test(t),
    hasPasos: /paso|preparaci|instrucc/i.test(t),
    hasParaQuien: /para quién|para quien|ideal para|no es para/i.test(t),
    hasFaq: /preguntas frecuentes|### .*\\?/i.test(t),
    retiruMentions: (t.match(/retiru/gi) || []).length,
    externalLinks: (t.match(/https?:\/\//g) || []).length,
  };
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x[key], 0) / arr.length;
}

loadEnvLocal();
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await sb
  .from('blog_articles')
  .select('title_es, slug, published_at, read_time_min, content_es, excerpt_es, created_at')
  .order('published_at', { ascending: true });

if (error) throw error;

const anchor = new Date('2026-05-21T00:00:00.000Z');
const old = data.filter((a) => new Date(a.published_at) < anchor);
const neu = data.filter((a) => new Date(a.published_at) >= anchor);

function summarize(label, arr) {
  const m = arr.map((a) => ({ ...metrics(a.content_es), title: a.title_es, read: a.read_time_min }));
  console.log(`\n=== ${label} (n=${arr.length}) ===`);
  console.log({
    avgWords: Math.round(avg(m, 'words')),
    minWords: Math.min(...m.map((x) => x.words)),
    maxWords: Math.max(...m.map((x) => x.words)),
    avgH3: avg(m, 'h3').toFixed(1),
    avgH4: avg(m, 'h4').toFixed(1),
    avgBullets: avg(m, 'bullets').toFixed(1),
    avgNumbered: avg(m, 'numbered').toFixed(1),
    pctPrecauciones: `${Math.round((m.filter((x) => x.hasPrecauciones).length / m.length) * 100)}%`,
    pctIngredientes: `${Math.round((m.filter((x) => x.hasIngredientes).length / m.length) * 100)}%`,
    pctPasos: `${Math.round((m.filter((x) => x.hasPasos).length / m.length) * 100)}%`,
    pctParaQuien: `${Math.round((m.filter((x) => x.hasParaQuien).length / m.length) * 100)}%`,
    avgRetiruMentions: avg(m, 'retiruMentions').toFixed(1),
    avgExternalLinks: avg(m, 'externalLinks').toFixed(1),
    avgReadTime: avg(m, 'read').toFixed(1),
  });
  return m;
}

const mOld = summarize('ANTIGUOS (< 21-may-2026)', old);
const mNew = summarize('NUEVOS (>= 21-may-2026)', neu);

console.log('\n--- 3 ANTIGUOS más largos ---');
old
  .map((a) => ({ title: a.title_es, ...metrics(a.content_es) }))
  .sort((a, b) => b.words - a.words)
  .slice(0, 3)
  .forEach((x) => console.log(`${x.words}w · h3:${x.h3} bullets:${x.bullets} · ${x.title.slice(0, 65)}`));

console.log('\n--- 5 NUEVOS más cortos ---');
neu
  .map((a) => ({ title: a.title_es, ...metrics(a.content_es), read: a.read_time_min }))
  .sort((a, b) => a.words - b.words)
  .slice(0, 5)
  .forEach((x) => console.log(`${x.words}w (read ${x.read}min) · h3:${x.h3} bullets:${x.bullets} · ${x.title.slice(0, 65)}`));

console.log('\n--- MUESTRA ANTIGUO (mediana longitud) ---');
const medOld = [...old].sort((a, b) => wc(a.content_es) - wc(b.content_es))[Math.floor(old.length / 2)];
console.log(medOld?.title_es);
console.log((medOld?.content_es || '').slice(0, 1800));

console.log('\n--- MUESTRA NUEVO (mediana longitud) ---');
const medNew = [...neu].sort((a, b) => wc(a.content_es) - wc(b.content_es))[Math.floor(neu.length / 2)];
console.log(medNew?.title_es);
console.log((medNew?.content_es || '').slice(0, 1800));
