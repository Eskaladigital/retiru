#!/usr/bin/env node
/**
 * RETIRU · Superagente buscador de emails para centros
 *
 * Orquesta una cascada de fases por coste y fiabilidad, escribiendo en
 * `centers` con trazabilidad (email_source, email_source_url, email_confidence,
 * email_found_at). Migración 036 debe estar aplicada.
 *
 * Modos:
 *   node scripts/sync-and-fetch-emails.mjs                      # hunt completo
 *   node scripts/sync-and-fetch-emails.mjs --solo-csv           # solo importar CSV
 *   node scripts/sync-and-fetch-emails.mjs --solo-serp          # legacy SerpAPI
 *   node scripts/sync-and-fetch-emails.mjs --hunt               # cascada superagente
 *
 * Flags comunes:
 *   --limit N                máximo de centros a procesar en hunt/serp
 *   --slug=foo               procesar solo un centro
 *   --dry-run                no escribe en BD, muestra lo que haría
 *   --min-confidence=0.7     umbral para guardar (hunt). Default 0.7
 *   --delay=800              ms entre descargas al mismo tipo de fuente
 *   --stages=web,places,serp,llm,mx  fases activas (por defecto: todas)
 *   --no-llm                 desactiva OpenAI (usa ranking determinista)
 *   --no-mx                  desactiva validación MX
 *   --verbose                traza detallada
 *
 * Requisitos (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (obligatorios)
 *   SERPAPI_API_KEY           (fase serp)
 *   OPENAI_API_KEY            (fase llm)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns/promises';
import { Resolver as DnsResolver } from 'dns/promises';
import { createClient } from '@supabase/supabase-js';

// En Windows el stack DNS de Node a veces falla con ECONNREFUSED. Forzamos
// resolvers públicos (Cloudflare + Google) para la validación MX.
const mxResolver = new DnsResolver();
try {
  mxResolver.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4']);
} catch {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ──────────────────────────────────────────────────────────────────────────
// Config / utilidades
// ──────────────────────────────────────────────────────────────────────────

const UA =
  'RetiruEmailAgent/1.0 (+https://www.retiru.com) directory maintenance; contact: legal@retiru.com';

const BAD_EMAIL_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'yoursite.com',
  'yourdomain.com',
  'email.com',
  'domain.com',
  'dominio.com',
  'midominio.com',
  'tudominio.com',
  'tusitio.com',
  'mysite.com',
  'mi-sitio.com',
  'mail.com',
  'sentry.io',
  'sentry.wixpress.com',
  'wixpress.com',
  'wix.com',
  'w.wix.com',
  'wixsite.com',
  'godaddy.com',
  'cloudflare.com',
  'retiru.com',
  'myrealfood.app',
  // Proveedores de link-in-bio / acortadores: jamás son el email del centro
  'linktr.ee',
  'linktree.com',
  'bit.ly',
  'bitly.com',
  'tinyurl.com',
  't.co',
  'lnk.bio',
  'beacons.ai',
  'stan.store',
  'carrd.co',
  // Redes / plataformas
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'mindbodyonline.com',
  'booksy.com',
  'timely.com',
];

const BAD_LOCAL_PARTS = new Set([
  'noreply',
  'no-reply',
  'no_reply',
  'donotreply',
  'do-not-reply',
  'mailer-daemon',
  'postmaster',
  'bounce',
  'bounces',
  'abuse',
  'hostmaster',
  'webmaster-wix',
  'privacy',
  'legal',
  'dpd',
  'dpo',
  'gdpr',
  'cookies',
]);

const CONTACT_PATHS = [
  '/',
  '/contacto',
  '/contacto/',
  '/contact',
  '/contact/',
  '/contactanos',
  '/contactenos',
  '/contactame',
  '/sobre-nosotros',
  '/sobre-mi',
  '/quienes-somos',
  '/about',
  '/about-us',
  '/aviso-legal',
  '/legal',
  '/privacidad',
  '/politica-de-privacidad',
  '/impressum',
  '/info',
];

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq <= 0) return;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}

function parseArgs() {
  const a = process.argv.slice(2);
  const getNum = (pref) => {
    const x = a.find((s) => s.startsWith(pref));
    if (!x) return null;
    const n = Number(x.slice(pref.length));
    return Number.isFinite(n) ? n : null;
  };
  const getStr = (pref) => {
    const x = a.find((s) => s.startsWith(pref));
    return x ? x.slice(pref.length) : null;
  };
  const legacyLimit = (() => {
    const i = a.indexOf('--limit');
    if (i >= 0) {
      const n = parseInt(a[i + 1], 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  })();
  return {
    soloCsv: a.includes('--solo-csv'),
    soloSerp: a.includes('--solo-serp'),
    hunt: a.includes('--hunt'),
    dryRun: a.includes('--dry-run'),
    noLlm: a.includes('--no-llm'),
    noMx: a.includes('--no-mx'),
    verbose: a.includes('--verbose'),
    limit: getNum('--limit=') ?? legacyLimit ?? 0,
    minConfidence: getNum('--min-confidence=') ?? 0.7,
    delayMs: getNum('--delay=') ?? 700,
    slug: getStr('--slug='),
    stages: (getStr('--stages=') || 'web,places,serp,llm,mx')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeUrl(raw) {
  if (!raw) return null;
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

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function isValidEmailSyntax(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim().toLowerCase();
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(t);
}

function isAcceptableEmail(email, siteDomain = null) {
  const lower = email.toLowerCase();
  const [local, domain] = lower.split('@');
  if (!local || !domain) return false;
  if (BAD_LOCAL_PARTS.has(local)) return false;
  if (BAD_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return false;
  // dominios de imágenes/assets típicos
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(domain)) return false;
  if (/sentry/i.test(domain)) return false;
  return true;
}

// Desobfuscación típica: "info [at] dominio [punto] com", etc.
function deobfuscate(text) {
  if (!text) return '';
  let out = text;
  out = out.replace(/\s*\[\s*at\s*\]\s*/gi, '@');
  out = out.replace(/\s*\(\s*at\s*\)\s*/gi, '@');
  out = out.replace(/\s+at\s+/gi, '@');
  out = out.replace(/\s+arroba\s+/gi, '@');
  out = out.replace(/\s*\[\s*arroba\s*\]\s*/gi, '@');
  out = out.replace(/\s*\(\s*arroba\s*\)\s*/gi, '@');
  out = out.replace(/\s*\[\s*dot\s*\]\s*/gi, '.');
  out = out.replace(/\s*\(\s*dot\s*\)\s*/gi, '.');
  out = out.replace(/\s+dot\s+/gi, '.');
  out = out.replace(/\s*\[\s*punto\s*\]\s*/gi, '.');
  out = out.replace(/\s*\(\s*punto\s*\)\s*/gi, '.');
  out = out.replace(/\s+punto\s+/gi, '.');
  // Decode HTML entities usuales
  out = out
    .replace(/&amp;/g, '&')
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/gi, '@')
    .replace(/&#46;/g, '.')
    .replace(/&#x2e;/gi, '.')
    .replace(/%40/g, '@');
  return out;
}

function extractEmails(text, siteDomain = null) {
  if (!text) return [];
  const normalized = deobfuscate(text);
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = normalized.match(re) || [];
  const uniq = [...new Set(matches.map((m) => m.toLowerCase()))];
  const cleaned = uniq.filter((e) => isValidEmailSyntax(e) && isAcceptableEmail(e, siteDomain));
  if (!siteDomain || cleaned.length <= 1) return cleaned;
  // Priorizar dominio del sitio
  const d = siteDomain.replace(/^www\./, '');
  const preferred = cleaned.filter((e) => e.split('@')[1] === d || e.split('@')[1].endsWith('.' + d));
  return preferred.length ? [...preferred, ...cleaned.filter((e) => !preferred.includes(e))] : cleaned;
}

// ──────────────────────────────────────────────────────────────────────────
// Fase 1: fetch de HTML de una URL
// ──────────────────────────────────────────────────────────────────────────
async function fetchHtml(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const body = await res.text();
    const looksHtml = /<html[\s>]|<!doctype html/i.test(body.slice(0, 4000));
    if (!res.ok) return { ok: false, status: res.status, finalUrl: res.url, body: '' };
    if (!looksHtml && !ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return { ok: false, status: res.status, finalUrl: res.url, body: '' };
    }
    return { ok: true, status: res.status, finalUrl: res.url || url, body };
  } catch (e) {
    return { ok: false, status: 0, error: e.message, finalUrl: url, body: '' };
  } finally {
    clearTimeout(t);
  }
}

function extractMailtoLinks(html) {
  if (!html) return [];
  const out = [];
  const re = /href\s*=\s*(["'])\s*mailto:([^"']+)\1/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = decodeURIComponent(m[2]).split('?')[0].trim();
    if (raw) out.push(raw.toLowerCase());
  }
  return out;
}

// Explora homepage + rutas típicas; devuelve candidatos { email, sourceUrl, stage:'web' }
async function phaseWeb(center, { delayMs, verbose }) {
  const site = normalizeUrl(center.website);
  if (!site) return [];
  const origin = new URL(site).origin;
  const host = new URL(site).hostname.replace(/^www\./, '');

  const tried = new Set();
  const candidates = [];

  // Visita homepage primero (para obtener enlaces de contacto reales)
  const homeRes = await fetchHtml(site);
  if (homeRes.ok) {
    const mails = [
      ...extractMailtoLinks(homeRes.body),
      ...extractEmails(homeRes.body, host),
    ];
    for (const e of mails) candidates.push({ email: e, sourceUrl: homeRes.finalUrl, stage: 'web' });
    if (verbose) console.log(`    · ${site} → ${mails.length} candidato(s) en homepage`);
  }
  tried.add(site);

  // Saca enlaces internos que parezcan de contacto/legal desde la home
  if (homeRes.ok) {
    const hrefRe = /href\s*=\s*(["'])([^"']+)\1/gi;
    let m;
    const internalLinks = new Set();
    while ((m = hrefRe.exec(homeRes.body)) !== null) {
      try {
        const abs = new URL(m[2], homeRes.finalUrl).href;
        const u = new URL(abs);
        if (u.hostname.replace(/^www\./, '') !== host) continue;
        const path = u.pathname.toLowerCase();
        if (
          /contact|aviso|legal|privac|impressum|sobre|about|info|quienes/.test(path)
        ) {
          internalLinks.add(abs.split('#')[0]);
        }
      } catch {}
    }
    CONTACT_PATHS.forEach((p) => internalLinks.add(origin + p));
    for (const link of internalLinks) {
      if (tried.has(link)) continue;
      tried.add(link);
      if (tried.size > 10) break;
      await sleep(delayMs);
      const r = await fetchHtml(link);
      if (!r.ok) continue;
      const mails = [...extractMailtoLinks(r.body), ...extractEmails(r.body, host)];
      for (const e of mails) candidates.push({ email: e, sourceUrl: r.finalUrl, stage: 'web' });
      if (verbose && mails.length) console.log(`    · ${link} → ${mails.length}`);
    }
  }

  return dedupeCandidates(candidates);
}

// ──────────────────────────────────────────────────────────────────────────
// Fase MX: validación de dominio
// ──────────────────────────────────────────────────────────────────────────
const mxCache = new Map();
async function hasMx(domain) {
  if (!domain) return false;
  if (mxCache.has(domain)) return mxCache.get(domain);
  // Intento 1: resolver con servidores públicos
  try {
    const records = await mxResolver.resolveMx(domain);
    if (Array.isArray(records) && records.length > 0) {
      mxCache.set(domain, true);
      return true;
    }
  } catch {}
  // Intento 2: resolver del sistema (por si acaso)
  try {
    const records = await dns.resolveMx(domain);
    if (Array.isArray(records) && records.length > 0) {
      mxCache.set(domain, true);
      return true;
    }
  } catch {}
  // Intento 3: al menos que el dominio tenga registros A (algunos MTAs aceptan por A/AAAA)
  try {
    const a = await mxResolver.resolve4(domain);
    if (Array.isArray(a) && a.length > 0) {
      mxCache.set(domain, true);
      return true;
    }
  } catch {}
  mxCache.set(domain, false);
  return false;
}

// ──────────────────────────────────────────────────────────────────────────
// Fase SerpAPI: búsquedas (queries del LLM o deterministas)
// ──────────────────────────────────────────────────────────────────────────
async function serpSearch(query, apiKey) {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
    query,
  )}&api_key=${apiKey}&hl=es&num=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { query, results: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const organic = (data.organic_results || []).map((r) => ({
      title: r.title || '',
      link: r.link || '',
      snippet: r.snippet || '',
    }));
    return { query, results: organic };
  } catch (e) {
    return { query, results: [], error: e.message };
  }
}

function buildDeterministicQueries(center) {
  const qs = [];
  const name = center.name || '';
  const city = center.city || '';
  const domain = center.website ? hostOf(normalizeUrl(center.website) || '') : null;
  if (domain) {
    qs.push(`site:${domain} (contacto OR email OR "info@")`);
    qs.push(`site:${domain} "@${domain}"`);
  }
  if (name) {
    qs.push(`"${name}" email contacto ${city}`.trim());
    qs.push(`"${name}" "info@"`);
    qs.push(`"${name}" ${city} aviso legal`);
  }
  if (center.instagram) {
    const handle = String(center.instagram).replace(/^@/, '');
    if (handle) qs.push(`site:instagram.com ${handle} email`);
  }
  return [...new Set(qs)].slice(0, 5);
}

async function phaseSerp(center, candidates, { serpKey, llmQueries, delayMs, verbose }) {
  const queries = llmQueries && llmQueries.length ? llmQueries : buildDeterministicQueries(center);
  const domain = center.website ? hostOf(normalizeUrl(center.website) || '') : null;
  const hits = [];
  for (const q of queries) {
    await sleep(delayMs);
    const r = await serpSearch(q, serpKey);
    if (verbose) console.log(`    · SERP «${q}» → ${r.results.length} resultados`);
    for (const item of r.results) {
      const text = `${item.title} ${item.snippet}`;
      const emails = extractEmails(text, domain);
      for (const e of emails) {
        hits.push({
          email: e,
          sourceUrl: item.link || `serp:${q}`,
          stage: 'serp',
          context: text.slice(0, 300),
        });
      }
    }
  }
  return dedupeCandidates([...candidates, ...hits]);
}

// ──────────────────────────────────────────────────────────────────────────
// Fase LLM: OpenAI genera queries y rankea candidatos
// ──────────────────────────────────────────────────────────────────────────
let _openai = null;
async function getOpenAI() {
  if (_openai) return _openai;
  if (!process.env.OPENAI_API_KEY) return null;
  const mod = await import('openai');
  _openai = new mod.default({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function llmGenerateQueries(center) {
  const ai = await getOpenAI();
  if (!ai) return null;
  const payload = {
    name: center.name,
    city: center.city,
    province: center.province,
    website: center.website || null,
    domain: center.website ? hostOf(normalizeUrl(center.website) || '') : null,
    instagram: center.instagram || null,
  };
  try {
    const resp = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en OSINT para encontrar emails públicos de negocios. ' +
            'Devuelve JSON con una sola clave "queries" (array de 3 a 5 strings). ' +
            'Cada query debe ser optimizada para Google (usa site:, comillas, operadores). ' +
            'Incluye al menos una query con site:<dominio> si hay dominio.',
        },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    });
    const txt = resp.choices?.[0]?.message?.content || '{}';
    const j = JSON.parse(txt);
    const arr = Array.isArray(j.queries) ? j.queries.filter((s) => typeof s === 'string') : [];
    return arr.slice(0, 5);
  } catch (e) {
    console.error('   ⚠ LLM queries error:', e.message);
    return null;
  }
}

async function llmRank(center, candidates) {
  const ai = await getOpenAI();
  if (!ai) return null;
  if (!candidates.length) return { email: null, confidence: 0, reason: 'sin candidatos' };
  const domain = center.website ? hostOf(normalizeUrl(center.website) || '') : null;
  const payload = {
    center: {
      name: center.name,
      city: center.city,
      province: center.province,
      website: center.website,
      domain,
      instagram: center.instagram || null,
    },
    candidates: candidates.map((c) => ({
      email: c.email,
      emailDomain: c.email.split('@')[1],
      source: c.stage,
      sourceUrl: c.sourceUrl,
      context: c.context ? c.context.slice(0, 200) : undefined,
    })),
  };
  try {
    const resp = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un revisor muy estricto de emails de contacto de negocios. ' +
            'Dado un centro y candidatos, elige el más probable como email público oficial. ' +
            'Reglas: (1) Prefiere dominio propio del centro sobre gmail/hotmail/yahoo. ' +
            '(2) Descarta no-reply, noreply, postmaster, abuse. ' +
            '(3) Si hay dudas serias, devuelve email=null con confidence baja. ' +
            'Devuelve JSON: {"email": string|null, "confidence": number 0..1, "reason": string, "source": string|null, "sourceUrl": string|null}.',
        },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    });
    const txt = resp.choices?.[0]?.message?.content || '{}';
    const j = JSON.parse(txt);
    return {
      email: (j.email || '').toLowerCase().trim() || null,
      confidence: typeof j.confidence === 'number' ? Math.max(0, Math.min(1, j.confidence)) : 0,
      reason: j.reason || '',
      source: j.source || null,
      sourceUrl: j.sourceUrl || null,
    };
  } catch (e) {
    console.error('   ⚠ LLM rank error:', e.message);
    return null;
  }
}

// Ranking determinista (fallback si no hay OpenAI o --no-llm)
function deterministicRank(center, candidates) {
  if (!candidates.length) return { email: null, confidence: 0, reason: 'sin candidatos' };
  const domain = center.website ? hostOf(normalizeUrl(center.website) || '') : null;
  const scored = candidates.map((c) => {
    let score = 0.4;
    const d = c.email.split('@')[1];
    if (domain && (d === domain || d.endsWith('.' + domain))) score += 0.45;
    if (['gmail.com', 'hotmail.com', 'yahoo.com', 'yahoo.es', 'outlook.com', 'outlook.es', 'live.com', 'icloud.com'].includes(d)) score -= 0.1;
    if (c.stage === 'web') score += 0.15;
    if (c.stage === 'places') score += 0.1;
    if (c.stage === 'serp') score += 0.03;
    const local = c.email.split('@')[0];
    if (/^(info|hola|contact|contacto|reservas|hi|booking)$/.test(local)) score += 0.05;
    return { ...c, score: Math.max(0, Math.min(1, score)) };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return {
    email: best.email,
    confidence: best.score,
    reason: `ranking determinista (dominio=${domain || '—'}, fuente=${best.stage})`,
    source: best.stage,
    sourceUrl: best.sourceUrl,
  };
}

// ──────────────────────────────────────────────────────────────────────────
function dedupeCandidates(list) {
  const map = new Map();
  for (const c of list) {
    const key = c.email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      // Preferir web > places > serp > llm
      const order = { web: 4, places: 3, serp: 2, llm: 1 };
      const cur = map.get(key);
      if ((order[c.stage] || 0) > (order[cur.stage] || 0)) map.set(key, c);
    }
  }
  return [...map.values()];
}

// ──────────────────────────────────────────────────────────────────────────
// Fase CSV (retrocompat): sincroniza emails desde directorio.csv
// ──────────────────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
      result.push(current.trim());
      current = '';
      if (c === '\n') break;
    } else current += c;
  }
  if (current !== '') result.push(current.trim());
  return result;
}
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

async function runCsvSync(supabase, { dryRun }) {
  const csvPath = join(root, 'directorio.csv');
  if (!existsSync(csvPath)) {
    console.error('❌ directorio.csv no encontrado');
    return;
  }
  console.log('\n📂 Sincronizando emails desde directorio.csv...');
  const rows = parseCSV(readFileSync(csvPath, 'utf8'));

  const { data: allCenters } = await supabase.from('centers').select('id, name, province, email');
  const byKey = new Map();
  for (const c of allCenters || []) {
    const key = `${(c.name || '').trim().toLowerCase()}|||${(c.province || '').trim()}`;
    if (!byKey.has(key)) byKey.set(key, c);
  }

  let updated = 0;
  let skipped = 0;
  for (const r of rows) {
    const name = (r.Nombre || '').trim();
    const province = (r.Provincia || '').trim() || 'España';
    const emailRaw = (r.Email || '').trim().toLowerCase();
    if (!name || !isValidEmailSyntax(emailRaw)) continue;
    const center = byKey.get(`${name.toLowerCase()}|||${province}`);
    if (!center) continue;
    if (center.email && center.email.trim() !== '') {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`   [DRY] ${name} → ${emailRaw}`);
      updated++;
      continue;
    }
    const { error } = await supabase
      .from('centers')
      .update({
        email: emailRaw,
        email_source: 'csv',
        email_source_url: 'directorio.csv',
        email_confidence: 0.9,
        email_found_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', center.id);
    if (!error) {
      updated++;
      console.log(`   ✓ ${name} → ${emailRaw}`);
    }
  }
  console.log(`   Actualizados: ${updated} | Ya tenían: ${skipped}`);
}

// ──────────────────────────────────────────────────────────────────────────
// Orquestador hunt: recorre centros sin email y aplica cascada
// ──────────────────────────────────────────────────────────────────────────
async function fetchCentersWithoutEmail(supabase, { slug, limit }) {
  let query = supabase
    .from('centers')
    .select('id, name, slug, city, province, website, instagram, facebook');
  if (slug) {
    query = query.eq('slug', slug);
  } else {
    query = query.or('email.is.null,email.eq.');
  }
  query = query.order('name');
  const { data, error } = await query;
  if (error) throw error;
  let rows = data || [];
  if (limit > 0) rows = rows.slice(0, limit);
  return rows;
}

async function huntForCenter(center, opts) {
  const { stages, serpKey, delayMs, verbose, noLlm, noMx } = opts;
  let candidates = [];

  if (stages.includes('web') && center.website) {
    const webCands = await phaseWeb(center, { delayMs, verbose });
    candidates.push(...webCands);
  }

  // Fase Places: opcional, requiere GOOGLE_PLACES_API_KEY y google_place_id
  // No se implementa descarga aquí para no añadir complejidad; si en el futuro
  // se integra, bastará con rellenar candidates con stage:'places'.

  if (stages.includes('serp') && serpKey) {
    let llmQueries = null;
    if (stages.includes('llm') && !noLlm) {
      llmQueries = await llmGenerateQueries(center);
      if (verbose && llmQueries)
        console.log(`    · LLM queries: ${JSON.stringify(llmQueries)}`);
    }
    candidates = await phaseSerp(center, candidates, {
      serpKey,
      llmQueries,
      delayMs,
      verbose,
    });
  }

  candidates = dedupeCandidates(candidates);

  // Validación MX
  if (!noMx && stages.includes('mx')) {
    const filtered = [];
    for (const c of candidates) {
      const d = c.email.split('@')[1];
      const ok = await hasMx(d);
      if (ok) filtered.push(c);
      else if (verbose) console.log(`    · MX KO ${c.email}`);
    }
    candidates = filtered;
  }

  // Ranking
  let choice;
  if (stages.includes('llm') && !noLlm) {
    choice = await llmRank(center, candidates);
    if (!choice) choice = deterministicRank(center, candidates);
  } else {
    choice = deterministicRank(center, candidates);
  }

  // Empareja la URL real del candidato si el LLM la omite
  if (choice && choice.email) {
    const match = candidates.find((c) => c.email === choice.email);
    if (match) {
      if (!choice.source) choice.source = match.stage;
      if (!choice.sourceUrl) choice.sourceUrl = match.sourceUrl;
    }
  }

  return { candidates, choice };
}

async function runHunt(supabase, opts) {
  const {
    stages,
    minConfidence,
    dryRun,
    delayMs,
    slug,
    limit,
    verbose,
  } = opts;
  const serpKey = process.env.SERPAPI_API_KEY;
  if (stages.includes('serp') && !serpKey) {
    console.warn('⚠ SERPAPI_API_KEY no configurada; la fase SERP se saltará.');
  }
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  if (stages.includes('llm') && !hasOpenAI && !opts.noLlm) {
    console.warn('⚠ OPENAI_API_KEY no configurada; usando ranking determinista.');
  }

  const centers = await fetchCentersWithoutEmail(supabase, { slug, limit });
  console.log(`\n🔎 HUNT modo${dryRun ? ' DRY-RUN' : ''} · ${centers.length} centro(s) · fases: ${stages.join(',')}`);
  if (centers.length === 0) {
    console.log('No hay centros sin email (o el slug indicado ya tiene email).');
    return;
  }

  let found = 0;
  let written = 0;
  let lowConf = 0;
  let noCand = 0;

  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    const tag = `[${i + 1}/${centers.length}] ${c.slug}`;
    try {
      const { candidates, choice } = await huntForCenter(c, {
        stages,
        serpKey,
        delayMs,
        verbose,
        noLlm: opts.noLlm || !hasOpenAI,
        noMx: opts.noMx,
      });
      if (!candidates.length) {
        noCand++;
        console.log(`${tag} · sin candidatos`);
      } else if (!choice || !choice.email) {
        lowConf++;
        console.log(`${tag} · ${candidates.length} candidato(s), pero sin elección`);
      } else if (choice.confidence < minConfidence) {
        lowConf++;
        console.log(
          `${tag} · ${choice.email} (conf=${choice.confidence.toFixed(2)}) DESCARTADO <${minConfidence}`,
        );
      } else {
        found++;
        console.log(
          `${tag} · ✓ ${choice.email} · ${choice.source || '—'} · conf=${choice.confidence.toFixed(2)}`,
        );
        if (!dryRun) {
          const { error } = await supabase
            .from('centers')
            .update({
              email: choice.email,
              email_source: choice.source || null,
              email_source_url: choice.sourceUrl || null,
              email_confidence: choice.confidence,
              email_found_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', c.id);
          if (error) console.error(`   ❌ BD: ${error.message}`);
          else written++;
        }
      }
      if (verbose && candidates.length) {
        console.log(`    · candidatos: ${candidates.map((x) => `${x.email}(${x.stage})`).join(', ')}`);
      }
    } catch (e) {
      console.error(`${tag} · ERROR: ${e.message}`);
    }
    if (i < centers.length - 1) await sleep(Math.min(delayMs, 500));
  }

  console.log('\n── Resumen HUNT ──');
  console.log(`Procesados        : ${centers.length}`);
  console.log(`Email encontrado  : ${found}`);
  console.log(`Baja confianza    : ${lowConf}`);
  console.log(`Sin candidatos    : ${noCand}`);
  if (dryRun) console.log('(Ejecuta sin --dry-run para guardar en Supabase)');
  else console.log(`Filas escritas    : ${written}`);
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────
loadEnvLocal();
const opts = parseArgs();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

if (opts.soloCsv) {
  await runCsvSync(supabase, { dryRun: opts.dryRun });
} else if (opts.soloSerp) {
  // Retrocompat: solo SERP + MX + ranking determinista
  await runHunt(supabase, { ...opts, stages: ['serp', 'mx'], noLlm: true });
} else {
  // Modo por defecto (o --hunt explícito): cascada completa
  await runHunt(supabase, opts);
}

console.log('\n✅ Listo.\n');
