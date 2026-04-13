#!/usr/bin/env node
/**
 * RETIRU · Rellenar instagram / facebook leyendo solo el HTML de la web del centro
 * (sin Google APIs ni SERP). Descarga la URL de `website`, busca enlaces y actualiza BD.
 *
 * Requisitos: `.env.local` con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *   node scripts/scrape-center-socials-from-website.mjs              # dry-run (no escribe)
 *   node scripts/scrape-center-socials-from-website.mjs --update       # escribe solo campos vacíos
 *   node scripts/scrape-center-socials-from-website.mjs --slug=foo   # un centro
 *   node scripts/scrape-center-socials-from-website.mjs --limit=50
 *   node scripts/scrape-center-socials-from-website.mjs --delay=800  # ms entre peticiones
 *   node scripts/scrape-center-socials-from-website.mjs --force       # sobrescribe IG/FB aunque ya existan
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

const UA =
  'RetiruSocialScraper/1.0 (+https://www.retiru.com) directory maintenance; contact: legal@retiru.com';

const IG_RESERVED = new Set([
  'p',
  'reel',
  'reels',
  'tv',
  'stories',
  'explore',
  'accounts',
  'direct',
  'legal',
  'developer',
  'about',
  'static',
  'help',
  'press',
  'directory',
  'tags',
  'tag',
  's',
  'privacy',
  'reelst',
]);

const FB_DENY_PREFIX = [
  '/sharer',
  '/share.php',
  '/dialog',
  '/plugins',
  '/privacy',
  '/policies',
  '/help',
  '/login',
  '/recover',
  '/business',
  '/ads',
  '/marketing',
  '/watch',
  '/gaming',
  '/fundraisers',
  '/l.php',
  '/images',
  '/ajax',
  '/r.php',
  '/reg',
];

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error('❌ No se encontró .env.local');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function empty(v) {
  return v == null || String(v).trim() === '';
}

function parseArgs() {
  const a = process.argv.slice(2);
  const getNum = (prefix) => {
    const x = a.find((s) => s.startsWith(prefix));
    if (!x) return null;
    const n = Number(x.slice(prefix.length));
    return Number.isFinite(n) ? n : null;
  };
  const getStr = (prefix) => {
    const x = a.find((s) => s.startsWith(prefix));
    return x ? x.slice(prefix.length) : null;
  };
  return {
    update: a.includes('--update'),
    force: a.includes('--force'),
    limit: getNum('--limit='),
    delayMs: getNum('--delay=') ?? 700,
    slug: getStr('--slug='),
  };
}

function normalizeWebsiteInput(raw) {
  let u = String(raw).trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const url = new URL(u);
    if (!url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

function decodeHtmlAttr(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/g, '/')
    .replace(/&quot;/g, '"')
    .trim();
}

/** href + URLs sueltas en el HTML */
function collectUrlStrings(html, baseHref) {
  const base = normalizeWebsiteInput(baseHref);
  let baseUrl;
  try {
    baseUrl = base ? new URL(base) : null;
  } catch {
    baseUrl = null;
  }

  const out = [];
  const seen = new Set();
  const add = (raw) => {
    if (!raw || raw.startsWith('javascript:') || raw.startsWith('#') || raw.startsWith('mailto:')) return;
    let h = decodeHtmlAttr(raw);
    if (h.startsWith('//')) h = `https:${h}`;
    let abs;
    try {
      abs = baseUrl ? new URL(h, baseUrl).href : new URL(h).href;
    } catch {
      return;
    }
    const key = abs.split('#')[0];
    if (seen.has(key)) return;
    seen.add(key);
    out.push(abs.split('#')[0]);
  };
  const hrefRe = /href\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    add(m[2]);
  }

  const bare = /https?:\/\/[^\s"'<>()]+/gi;
  let b;
  while ((b = bare.exec(html)) !== null) {
    add(b[0].replace(/[,);]+$/g, ''));
  }

  return out;
}

function expandFacebookRedirect(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!/^(www\.)?l\.facebook\.com$/i.test(u.hostname)) return urlStr;
    const inner = u.searchParams.get('u');
    if (!inner) return urlStr;
    return decodeURIComponent(inner);
  } catch {
    return urlStr;
  }
}

function pickInstagram(urlStrings) {
  for (const raw of urlStrings) {
    const expanded = expandFacebookRedirect(raw);
    let u;
    try {
      u = new URL(expanded);
    } catch {
      continue;
    }
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'instagram.com' && host !== 'instagr.am') continue;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    const seg = parts[0];
    if (IG_RESERVED.has(seg.toLowerCase())) continue;
    if (seg === 'p' || seg === 'reel' || seg === 'reels') continue;
    if (!/^[A-Za-z0-9._]+$/.test(seg)) continue;
    if (seg.length < 1 || seg.length > 30) continue;
    return `@${seg.replace(/^@/, '')}`;
  }
  return null;
}

function facebookPathAllowed(pathname) {
  const lower = pathname.toLowerCase();
  for (const p of FB_DENY_PREFIX) {
    if (lower === p || lower.startsWith(`${p}/`) || lower.startsWith(`${p}?`)) return false;
  }
  if (lower.includes('photo.php')) return false;
  return true;
}

function pickFacebook(urlStrings) {
  for (const raw of urlStrings) {
    let s = expandFacebookRedirect(raw);
    let u;
    try {
      u = new URL(s);
    } catch {
      continue;
    }
    let host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'm.facebook.com' || host === 'mobile.facebook.com') {
      host = 'facebook.com';
      u = new URL(`https://www.facebook.com${u.pathname}${u.search}`);
    }
    if (host === 'fb.com') {
      u = new URL(`https://www.facebook.com${u.pathname}${u.search}`);
      host = 'facebook.com';
    }
    if (host === 'fb.me') {
      // sin HEAD: guardamos URL canónica fb.me (la app abre bien); si prefieres expandir, usar --update tras revisar
      const path = u.pathname.replace(/\/+$/, '') || '/';
      if (path === '/') continue;
      return `https://fb.me${u.pathname}`.replace(/\/+$/, '');
    }
    if (host !== 'facebook.com' && !host.endsWith('.facebook.com')) continue;

    const path = u.pathname || '/';
    if (path === '/' || path === '') continue;
    if (!facebookPathAllowed(path)) continue;

    if (path.toLowerCase().startsWith('/profile.php')) {
      const id = u.searchParams.get('id');
      if (id && /^\d+$/.test(id)) return `https://www.facebook.com/profile.php?id=${id}`;
      continue;
    }

    const sp = new URLSearchParams(u.search);
    ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((k) => sp.delete(k));
    const q = sp.toString();
    const basePath = path.replace(/\/+$/, '') || '/';
    const href = `https://www.facebook.com${basePath}${q ? `?${q}` : ''}`;
    return href;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHomepageHtml(websiteUrl) {
  const url = normalizeWebsiteInput(websiteUrl);
  if (!url) throw new Error('URL inválida');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  const res = await fetch(url, {
    redirect: 'follow',
    signal: controller.signal,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const looksHtml = /<html[\s>]|<!doctype html/i.test(text.slice(0, 4000));
  if (!looksHtml && !ct.includes('text/html') && !ct.includes('application/xhtml')) {
    throw new Error(`Respuesta no parece HTML (Content-Type: ${ct || '—'})`);
  }
  const finalUrl = res.url || url;
  return { html: text, finalUrl };
}

loadEnvLocal();
const { update, force, limit, delayMs, slug } = parseArgs();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

let q = supabase
  .from('centers')
  .select('id, slug, name, website, instagram, facebook')
  .not('website', 'is', null)
  .neq('website', '')
  .order('slug');

if (slug) q = q.eq('slug', slug);

const { data: rows, error: qErr } = await q;
if (qErr) {
  console.error('❌ Error leyendo centros:', qErr.message);
  process.exit(1);
}

let work = (rows || []).filter((r) => normalizeWebsiteInput(r.website));
work = work.filter((r) => {
  if (force) return true;
  return empty(r.instagram) || empty(r.facebook);
});
if (limit != null && limit > 0) work = work.slice(0, limit);

console.log(
  `Modo: ${update ? 'ESCRITURA (--update)' : 'dry-run (sin --update no se guarda)'}${force ? ' · --force' : ''}`,
);
console.log(`Centros a procesar: ${work.length} (delay ${delayMs} ms entre peticiones)`);
if (work.length > 30) {
  const min = ((work.length * delayMs) / 60000).toFixed(1);
  console.log(`Solo pausas ≈ ${min} min; las descargas añaden más tiempo.\n`);
} else {
  console.log('');
}

let ok = 0;
let err = 0;
let skipped = 0;
let wrote = 0;

for (let i = 0; i < work.length; i++) {
  const r = work[i];
  const prefix = `[${i + 1}/${work.length}] ${r.slug}`;
  try {
    const { html, finalUrl } = await fetchHomepageHtml(r.website);
    const urls = collectUrlStrings(html, finalUrl);
    let ig = pickInstagram(urls);
    let fb = pickFacebook(urls);

    if (!force) {
      if (!empty(r.instagram)) ig = null;
      if (!empty(r.facebook)) fb = null;
    }

    if (!ig && !fb) {
      console.log(`${prefix} · sin enlaces de perfil detectados · ${finalUrl.slice(0, 60)}…`);
      skipped++;
    } else {
      console.log(
        `${prefix} · IG=${ig || '—'} · FB=${fb || '—'} · web=${String(r.website).slice(0, 55)}…`,
      );
      ok++;
    }

    if (update && (ig || fb)) {
      const patch = { updated_at: new Date().toISOString() };
      if (ig) patch.instagram = ig;
      if (fb) patch.facebook = fb;
      const { error: uErr } = await supabase.from('centers').update(patch).eq('id', r.id);
      if (uErr) {
        console.error(`   ❌ Error guardando: ${uErr.message}`);
        err++;
      } else {
        wrote++;
      }
    }
  } catch (e) {
    console.error(`${prefix} · ERROR: ${e.message || e}`);
    err++;
  }

  if (i < work.length - 1 && delayMs > 0) await sleep(delayMs);
}

console.log('\n── Resumen ──');
console.log(`Procesados: ${work.length}`);
console.log(`Con al menos una red detectada: ${ok}`);
console.log(`Sin detectar (o ya relleno sin --force): ${skipped}`);
console.log(`Errores (fetch o BD): ${err}`);
if (update) console.log(`Filas actualizadas en BD: ${wrote}`);
else console.log('(Ejecuta con --update para guardar en Supabase)');
