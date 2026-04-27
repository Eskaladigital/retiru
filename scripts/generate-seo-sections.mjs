#!/usr/bin/env node
/**
 * Generador unificado de contenido SEO editorial por capas (§8 SEO-LANDINGS.md).
 *
 * Capas soportadas:
 *   1 · type_national          → tabla categories
 *   2 · type_style             → tabla styles
 *   3 · type_province          → tabla center_type_province_seo (city_slug NULL)
 *   4 · style_province         → tabla style_province_seo (migr. 045)
 *   5 · type_province_city     → tabla center_type_province_seo (city_slug NOT NULL)
 *
 * Uso:
 *   npm run seo:sections -- --layer=3 --type=ayurveda --province=alava
 *   npm run seo:sections -- --layer=3                               # todas cap.3
 *   npm run seo:sections -- --layer=5 --city-min=2
 *   npm run seo:sections -- --layer=4 --type=yoga
 *   npm run seo:sections -- --layer=1                               # 3 filas
 *   npm run seo:sections -- --layer=all --dry-run
 *
 * Flags:
 *   --dry-run           No escribe en BD, solo muestra qué haría.
 *   --force             Regenera aunque ya exista contenido.
 *   --no-serp           No llama SerpApi (para tests sin gastar créditos).
 *   --concurrency=2     Workers paralelos (default 2).
 *   --limit=1           Máximo de ítems a procesar.
 *   --type=yoga         Filtra por disciplina.
 *   --province=alava    Filtra por slug de provincia.
 *   --style=kundalini   Filtra por slug de estilo (capas 2, 4).
 *   --city=vitoria      Filtra por slug de ciudad (capa 5).
 *   --model=gpt-4o      Modelo OpenAI (gpt-4o | gpt-4o-mini | gpt-4.1 | gpt-4-turbo).
 *   --temp=0.55         Temperatura (0.3-0.8). Default 0.55.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── .env.local ─────────────────────────────────────────────────────────────
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('Falta .env.local'); process.exit(1); }
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
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

const { LAYERS, DOMINANT_STYLES, generateLayerContent, applySuppressionRules } = await import('./lib/seo-engine.mjs');

// ── Args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const arg = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=')[1] : null;
};
const dryRun = flag('dry-run');
const force = flag('force');
const useSerp = !flag('no-serp');
const concurrency = Math.max(1, Math.min(6, parseInt(arg('concurrency') || '2', 10) || 2));
const limit = arg('limit') ? parseInt(arg('limit'), 10) : null;
const typeFilter = arg('type');
const provinceFilter = arg('province');
const styleFilter = arg('style');
const cityFilter = arg('city');
const cityMin = Math.max(1, parseInt(arg('city-min') || '2', 10) || 2);
const layerArg = arg('layer') || 'all';
// Default: gpt-4.1 (mucho mejor obedeciendo listas negras y produciendo datos
// concretos) + temperatura baja para reducir deriva hacia tópicos. Cambiar con
// --model y --temp.
const model = arg('model') || 'gpt-4.1';
const temperature = parseFloat(arg('temp') || '0.4') || 0.4;

// Capa 1 (nacional por tipo) vive en `src/lib/center-type-editorial.ts` como
// contenido estático curado; NO se genera aquí. Si en el futuro se mueve a BD
// (tabla `center_type_seo` o similar), reactivar la capa en LAYERS y loadCap1.
const SUPPORTED_LAYERS = [2, 3, 4, 5];
const layerIds = layerArg === 'all'
  ? SUPPORTED_LAYERS
  : layerArg.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => SUPPORTED_LAYERS.includes(n));

// ── Supabase admin ─────────────────────────────────────────────────────────
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── Utilidades ─────────────────────────────────────────────────────────────
function normalizeProvinceSlug(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}
function normalizeCitySlug(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function stripHtml(html, maxLen = 160) {
  if (!html) return '';
  let t = String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

async function fetchAllCenters() {
  const { data, error } = await admin
    .from('centers')
    .select('id, name, city, province, type, description_es')
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchCentersWithStyles() {
  // Join manual: centers + center_styles + styles (para Cap. 4)
  const { data: centers, error: eC } = await admin
    .from('centers')
    .select('id, name, city, province, type, description_es')
    .eq('status', 'active');
  if (eC) throw new Error(eC.message);
  const { data: links, error: eL } = await admin
    .from('center_styles')
    .select('center_id, style_id');
  if (eL) throw new Error(eL.message);
  const { data: styles, error: eS } = await admin
    .from('styles')
    .select('id, slug, name_es, center_type');
  if (eS) throw new Error(eS.message);

  const styleById = new Map(styles.map((s) => [s.id, s]));
  const stylesByCenter = new Map();
  for (const l of links) {
    const st = styleById.get(l.style_id);
    if (!st) continue;
    if (!stylesByCenter.has(l.center_id)) stylesByCenter.set(l.center_id, []);
    stylesByCenter.get(l.center_id).push(st);
  }
  return centers.map((c) => ({ ...c, styles: stylesByCenter.get(c.id) || [] }));
}

// ── Cargadores por capa ────────────────────────────────────────────────────
async function loadCap1() {
  const { data, error } = await admin
    .from('categories')
    .select('id, slug, name_es, name_en, description_es, description_en')
    .in('slug', ['yoga', 'meditation', 'ayurveda']);
  if (error) throw new Error(error.message);
  const centers = await fetchAllCenters();
  return (data || []).map((cat) => ({
    layer: LAYERS.type_national,
    rowKey: { slug: cat.slug },
    type: cat.slug,
    centersCount: centers.filter((c) => c.type === cat.slug).length,
  }));
}

async function loadCap2() {
  const { data, error } = await admin
    .from('styles')
    .select('id, slug, name_es, name_en, center_type')
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  const centers = await fetchAllCenters();
  return (data || []).map((s) => ({
    layer: LAYERS.type_style,
    rowKey: { center_type: s.center_type, slug: s.slug },
    type: s.center_type,
    styleSlug: s.slug,
    styleName: s.name_es,
    centersCount: centers.filter((c) => c.type === s.center_type).length, // aprox: nacional
  }));
}

async function loadCap3() {
  const centers = await fetchAllCenters();
  const byPair = new Map();
  for (const c of centers) {
    if (!c.type || !c.province) continue;
    const slug = normalizeProvinceSlug(c.province);
    const k = `${c.type}|${slug}`;
    if (!byPair.has(k)) byPair.set(k, { type: c.type, provinceName: c.province, provinceSlug: slug, centers: [] });
    byPair.get(k).centers.push({ name: c.name, city: c.city, description_snippet: c.description_es });
  }
  return Array.from(byPair.values()).map((p) => {
    const cityCounts = new Map();
    p.centers.forEach((c) => { const k = c.city || '(sin ciudad)'; cityCounts.set(k, (cityCounts.get(k) || 0) + 1); });
    return {
      layer: LAYERS.type_province,
      rowKey: { type: p.type, province_slug: p.provinceSlug, city_slug: null },
      type: p.type,
      provinceName: p.provinceName,
      provinceSlug: p.provinceSlug,
      centers: p.centers,
      centersCount: p.centers.length,
      cityBreakdown: Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ city, count })),
    };
  });
}

async function loadCap4() {
  const centers = await fetchCentersWithStyles();
  const byTriple = new Map();
  for (const c of centers) {
    if (!c.type || !c.province || !c.styles?.length) continue;
    const provinceSlug = normalizeProvinceSlug(c.province);
    for (const st of c.styles) {
      if (st.center_type !== c.type) continue;
      if (DOMINANT_STYLES.has(st.slug)) continue; // R3
      const k = `${c.type}|${st.slug}|${provinceSlug}`;
      if (!byTriple.has(k)) byTriple.set(k, {
        type: c.type, styleSlug: st.slug, styleName: st.name_es,
        provinceName: c.province, provinceSlug, centers: [],
      });
      byTriple.get(k).centers.push({ name: c.name, city: c.city, description_snippet: c.description_es });
    }
  }
  return Array.from(byTriple.values()).map((t) => ({
    layer: LAYERS.style_province,
    rowKey: { center_type: t.type, style_slug: t.styleSlug, province_slug: t.provinceSlug },
    type: t.type,
    styleSlug: t.styleSlug,
    styleName: t.styleName,
    provinceName: t.provinceName,
    provinceSlug: t.provinceSlug,
    centers: t.centers,
    centersCount: t.centers.length,
  }));
}

async function loadCap5() {
  const centers = await fetchAllCenters();
  const byTriple = new Map();
  const byPair = new Map();
  for (const c of centers) {
    if (!c.type || !c.province || !c.city) continue;
    const provSlug = normalizeProvinceSlug(c.province);
    const citySlug = normalizeCitySlug(c.city);
    if (!citySlug) continue;
    const tkey = `${c.type}|${provSlug}|${citySlug}`;
    const pkey = `${c.type}|${provSlug}`;
    byPair.set(pkey, (byPair.get(pkey) || 0) + 1);
    if (!byTriple.has(tkey)) byTriple.set(tkey, { type: c.type, provinceName: c.province, provinceSlug: provSlug, cityName: c.city, citySlug, centers: [] });
    byTriple.get(tkey).centers.push({ name: c.name, city: c.city, description_snippet: c.description_es });
  }
  return Array.from(byTriple.values())
    .filter((t) => t.centers.length >= cityMin)
    .map((t) => {
      const pKey = `${t.type}|${t.provinceSlug}`;
      const total = byPair.get(pKey) || t.centers.length;
      return {
        layer: LAYERS.type_province_city,
        rowKey: { type: t.type, province_slug: t.provinceSlug, city_slug: t.citySlug },
        type: t.type,
        provinceName: t.provinceName,
        provinceSlug: t.provinceSlug,
        cityName: t.cityName,
        citySlug: t.citySlug,
        centers: t.centers,
        centersCount: t.centers.length,
        cityShareOfProvince: t.centers.length / total,
      };
    });
}

// ── Upsert por capa ────────────────────────────────────────────────────────
async function upsertCap1(ctx, content) {
  const payload = {
    sections_es: content.sections_es, sections_en: content.sections_en,
    serp_data: content.serp_data, suppress_reason: content.suppress_reason,
  };
  // categories ya tiene intro/meta/faq; sobrescribimos solo si content los trae
  // (Cap. 1 incluye intro_es, meta_title_es, faq_es en categories_seo_fields).
  // Por seguridad, NO sobrescribimos intro/meta/faq en categorias para no pisar
  // trabajo editorial previo. Solo tocamos sections_*, serp_data, suppress_reason.
  const { error } = await admin.from('categories').update(payload).eq('slug', ctx.rowKey.slug);
  if (error) throw new Error(error.message);
}

async function upsertCap2(ctx, content) {
  const payload = {
    meta_title_es: content.meta_title_es, meta_title_en: content.meta_title_en,
    meta_description_es: content.meta_description_es, meta_description_en: content.meta_description_en,
    sections_es: content.sections_es, sections_en: content.sections_en,
    faq_es: content.faq_es, faq_en: content.faq_en,
    serp_data: content.serp_data, suppress_reason: content.suppress_reason,
  };
  const { error } = await admin.from('styles').update(payload).eq('center_type', ctx.rowKey.center_type).eq('slug', ctx.rowKey.slug);
  if (error) throw new Error(error.message);
}

async function upsertCap3Or5(ctx, content) {
  const payload = {
    type: ctx.rowKey.type,
    province_slug: ctx.rowKey.province_slug,
    province_name: ctx.provinceName,
    city_slug: ctx.rowKey.city_slug,
    city_name: ctx.cityName || null,
    intro_es: content.intro_es, intro_en: content.intro_en,
    meta_title_es: content.meta_title_es, meta_title_en: content.meta_title_en,
    meta_description_es: content.meta_description_es, meta_description_en: content.meta_description_en,
    sections_es: content.sections_es, sections_en: content.sections_en,
    faq_es: content.faq_es, faq_en: content.faq_en,
    serp_data: content.serp_data, suppress_reason: content.suppress_reason,
  };
  let q = admin.from('center_type_province_seo').select('id').eq('type', ctx.rowKey.type).eq('province_slug', ctx.rowKey.province_slug);
  q = ctx.rowKey.city_slug ? q.eq('city_slug', ctx.rowKey.city_slug) : q.is('city_slug', null);
  const { data: existing } = await q.maybeSingle();
  if (existing?.id) {
    const { error } = await admin.from('center_type_province_seo').update(payload).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('center_type_province_seo').insert(payload);
    if (error) throw new Error(error.message);
  }
}

async function upsertCap4(ctx, content) {
  const payload = {
    center_type: ctx.rowKey.center_type,
    style_slug: ctx.rowKey.style_slug,
    province_slug: ctx.rowKey.province_slug,
    province_name: ctx.provinceName,
    intro_es: content.intro_es, intro_en: content.intro_en,
    meta_title_es: content.meta_title_es, meta_title_en: content.meta_title_en,
    meta_description_es: content.meta_description_es, meta_description_en: content.meta_description_en,
    sections_es: content.sections_es, sections_en: content.sections_en,
    faq_es: content.faq_es, faq_en: content.faq_en,
    serp_data: content.serp_data, suppress_reason: content.suppress_reason,
  };
  const { data: existing } = await admin
    .from('style_province_seo')
    .select('id')
    .eq('center_type', ctx.rowKey.center_type)
    .eq('style_slug', ctx.rowKey.style_slug)
    .eq('province_slug', ctx.rowKey.province_slug)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await admin.from('style_province_seo').update(payload).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('style_province_seo').insert(payload);
    if (error) throw new Error(error.message);
  }
}

function upsertForLayer(ctx, content) {
  switch (ctx.layer.id) {
    case 1: return upsertCap1(ctx, content);
    case 2: return upsertCap2(ctx, content);
    case 3: case 5: return upsertCap3Or5(ctx, content);
    case 4: return upsertCap4(ctx, content);
    default: throw new Error(`Capa ${ctx.layer.id} sin upsert`);
  }
}

// ── Pool ───────────────────────────────────────────────────────────────────
async function runPool(items, workers, fn) {
  let next = 0;
  const results = [];
  async function workerFn() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try { results[i] = await fn(items[i], i); }
      catch (e) { results[i] = { error: e instanceof Error ? e.message : String(e), item: items[i] }; }
    }
  }
  const n = Math.min(workers, items.length) || 1;
  await Promise.all(Array.from({ length: n }, workerFn));
  return results;
}

// ── Existencia previa ──────────────────────────────────────────────────────
async function loadExistingKeys(layerId) {
  if (layerId === 1) {
    const { data } = await admin.from('categories').select('slug, sections_es');
    return new Set((data || []).filter((r) => Array.isArray(r.sections_es) && r.sections_es.length).map((r) => r.slug));
  }
  if (layerId === 2) {
    const { data } = await admin.from('styles').select('center_type, slug, sections_es');
    return new Set((data || []).filter((r) => Array.isArray(r.sections_es) && r.sections_es.length).map((r) => `${r.center_type}|${r.slug}`));
  }
  if (layerId === 3 || layerId === 5) {
    const { data } = await admin.from('center_type_province_seo').select('type, province_slug, city_slug, sections_es');
    const set = new Set();
    for (const r of data || []) {
      if (Array.isArray(r.sections_es) && r.sections_es.length) {
        set.add(`${r.type}|${r.province_slug}|${r.city_slug || ''}`);
      }
    }
    return set;
  }
  if (layerId === 4) {
    const { data } = await admin.from('style_province_seo').select('center_type, style_slug, province_slug, sections_es');
    return new Set((data || []).filter((r) => Array.isArray(r.sections_es) && r.sections_es.length).map((r) => `${r.center_type}|${r.style_slug}|${r.province_slug}`));
  }
  return new Set();
}

function keyOf(ctx) {
  if (ctx.layer.id === 1) return ctx.rowKey.slug;
  if (ctx.layer.id === 2) return `${ctx.rowKey.center_type}|${ctx.rowKey.slug}`;
  if (ctx.layer.id === 3 || ctx.layer.id === 5) return `${ctx.rowKey.type}|${ctx.rowKey.province_slug}|${ctx.rowKey.city_slug || ''}`;
  if (ctx.layer.id === 4) return `${ctx.rowKey.center_type}|${ctx.rowKey.style_slug}|${ctx.rowKey.province_slug}`;
  return '';
}

// ── Main ───────────────────────────────────────────────────────────────────
async function loadLayer(id) {
  if (id === 1) return loadCap1();
  if (id === 2) return loadCap2();
  if (id === 3) return loadCap3();
  if (id === 4) return loadCap4();
  if (id === 5) return loadCap5();
  throw new Error(`Capa desconocida: ${id}`);
}

function applyFilters(ctxList) {
  return ctxList.filter((c) => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (provinceFilter && c.provinceSlug && c.provinceSlug !== provinceFilter) return false;
    if (styleFilter && c.styleSlug && c.styleSlug !== styleFilter) return false;
    if (cityFilter && c.citySlug && c.citySlug !== cityFilter) return false;
    return true;
  });
}

async function main() {
  console.log(`\n═══ generate-seo-sections ═══`);
  console.log(`Capas: ${layerIds.join(',')} | dryRun=${dryRun} force=${force} useSerp=${useSerp} conc=${concurrency} limit=${limit ?? '—'}`);
  console.log(`Modelo: ${model} temp=${temperature}`);
  console.log(`Filtros: type=${typeFilter ?? '—'} prov=${provinceFilter ?? '—'} style=${styleFilter ?? '—'} city=${cityFilter ?? '—'}\n`);

  let allContexts = [];
  for (const id of layerIds) {
    const raw = await loadLayer(id);
    const filtered = applyFilters(raw);
    console.log(`  Capa ${id} (${raw[0]?.layer.label ?? ''}): ${filtered.length}/${raw.length} tras filtros`);
    allContexts.push(...filtered);
  }

  if (!force) {
    const existsSets = new Map();
    for (const id of layerIds) existsSets.set(id, await loadExistingKeys(id));
    const before = allContexts.length;
    allContexts = allContexts.filter((c) => !existsSets.get(c.layer.id)?.has(keyOf(c)));
    console.log(`  Ya existentes (sections no vacías): ${before - allContexts.length}`);
  }

  if (limit) allContexts = allContexts.slice(0, limit);
  console.log(`\nTotal a procesar: ${allContexts.length}\n`);
  if (allContexts.length === 0) return;

  const stats = { ok: 0, suppress: 0, fail: 0 };
  const costs = { in: 0, out: 0 };

  await runPool(allContexts, concurrency, async (ctx) => {
    const label = `[cap${ctx.layer.id}] ${keyOf(ctx)}`;
    try {
      const suppress = applySuppressionRules(ctx);
      if (suppress && !dryRun) {
        await upsertForLayer(ctx, {
          sections_es: [], sections_en: [],
          intro_es: null, intro_en: null,
          meta_title_es: null, meta_title_en: null,
          meta_description_es: null, meta_description_en: null,
          faq_es: [], faq_en: [],
          serp_data: null, suppress_reason: suppress,
        });
        console.log(`🚫 ${label} — suppress: ${suppress}`);
        stats.suppress++;
        return;
      }

      if (dryRun) {
        console.log(`DRY ${label} — centers=${ctx.centersCount ?? 0} suppress=${suppress || '—'}`);
        stats.ok++;
        return;
      }

      const content = await generateLayerContent({ context: ctx, useSerp, model, temperature });
      if (content.suppress_reason) {
        await upsertForLayer(ctx, content);
        console.log(`🚫 ${label} — suppress: ${content.suppress_reason}`);
        stats.suppress++;
        return;
      }
      await upsertForLayer(ctx, content);
      if (content._usage) { costs.in += content._usage.prompt_tokens || 0; costs.out += content._usage.completion_tokens || 0; }
      const meta = content.meta_title_es ? `"${content.meta_title_es}"` : `sections=${content.sections_es.length}`;
      console.log(`✅ ${label} — ${meta}`);
      stats.ok++;
    } catch (e) {
      console.error(`❌ ${label}: ${e.message}`);
      stats.fail++;
    }
  });

  console.log(`\nResumen: ok=${stats.ok} suppressed=${stats.suppress} fail=${stats.fail}`);
  if (costs.in || costs.out) {
    // Pricing aprox. USD / 1M tokens:
    //   gpt-4o     → in 2.5, out 10
    //   gpt-4o-mini→ in 0.15, out 0.60
    //   gpt-4.1    → in 2.0, out 8.0
    const rates = {
      'gpt-4o':      [2.5, 10],
      'gpt-4o-mini': [0.15, 0.60],
      'gpt-4.1':     [2.0, 8.0],
    };
    const [rIn, rOut] = rates[model] || rates['gpt-4o'];
    const cost = (costs.in * rIn + costs.out * rOut) / 1_000_000;
    console.log(`Tokens: in=${costs.in} out=${costs.out} ≈ $${cost.toFixed(3)} USD (${model})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
