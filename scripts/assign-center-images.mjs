#!/usr/bin/env node
/**
 * RETIRU · Portadas de centros (mismo criterio que MapafurgoCasa)
 *
 * 1. Entra en la web oficial del centro, saca una foto usable, la sube al bucket.
 * 2. Si no hay web o no hay foto, genera con IA (gpt-image-2).
 * No usa Places Photo ni Google Images / SerpAPI.
 *
 *   node scripts/assign-center-images.mjs
 *   node scripts/assign-center-images.mjs --province Murcia --no-ia
 *   node scripts/assign-center-images.mjs --province Murcia --limit 5
 *
 * Flags: --force  --limit N  --province X  --no-ia  --dry-run
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('Falta .env.local');
    process.exit(1);
  }
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const eq = t.indexOf('=');
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  });
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const SOCIAL =
  /instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|wa\.me|canva\.com|linktr\.ee|bit\.ly/i;
const JUNK =
  /logo|logotipo|favicon|sprite|avatar|whatsapp|pixel|1x1|icon[-_]|banner-kit|opengraph-image|twitter-image|elementor\/thumbs|cookie|aviso-legal|politica-de-privacidad/i;
const PHOTO_EXT = /\.(jpe?g|png|webp)(\?|#|$)/i;
const EXTRA_PATHS = [
  '/galeria', '/fotos', '/gallery', '/el-estudio', '/estudio', '/sala',
  '/clases', '/nosotros', '/el-centro', '/instalaciones', '/espacio', '/about',
];
const MIN_BYTES = 28000;
const MIN_W = 480;
const MIN_H = 280;

function argVal(name) {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${name}`);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
  return null;
}
const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry-run');
const NO_IA = process.argv.includes('--no-ia');
const LIMIT = parseInt(argVal('limit') || '0', 10) || 0;
const PROVINCE = argVal('province');

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

function abs(base, raw) {
  const clean = decodeHtml((raw || '').trim());
  if (!clean || clean.startsWith('data:') || clean.startsWith('#')) return null;
  try {
    const url = new URL(clean, base);
    if (url.pathname.includes('/_next/image')) {
      const inner = url.searchParams.get('url');
      if (inner) return abs(`${url.protocol}//${url.host}`, inner);
    }
    return url.href;
  } catch {
    return null;
  }
}

function usableUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  if (JUNK.test(u) || u.includes('.svg') || u.includes('.gif')) return false;
  const cdn =
    u.includes('wixstatic.com') ||
    u.includes('cdn-website.com') ||
    u.includes('wp-content/uploads') ||
    u.includes('/images/') ||
    u.includes('/uploads/');
  return PHOTO_EXT.test(u) || cdn;
}

function extraerFotos(base, html) {
  const found = new Set();
  const push = (raw) => {
    const url = abs(base, raw);
    if (url && usableUrl(url)) found.add(url);
  };
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (og) push(og[1]);
  const tw = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if (tw) push(tw[1]);
  const attrRe = /(?:src|data-src|data-lazy-src|data-original|data-bg)=["']([^"']+)["']/gi;
  let m;
  while ((m = attrRe.exec(html))) push(m[1]);
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html))) {
    for (const part of m[1].split(',')) push(part.trim().split(/\s+/)[0]);
  }
  const cssBg = /url\((['"]?)([^'")]+)\1\)/gi;
  while ((m = cssBg.exec(html))) {
    if (PHOTO_EXT.test(m[2])) push(m[2]);
  }
  return [...found];
}

async function fetchHtml(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const ctype = resp.headers.get('content-type') || '';
    if (ctype && !/html|xml|text/.test(ctype)) return null;
    return { url: resp.url, html: await resp.text() };
  } catch {
    return null;
  }
}

function scoreUrl(url) {
  const u = url.toLowerCase();
  let s = 0;
  if (/yoga|shala|sala|estudio|meditaci|ayurved|clase|asana|esterilla/i.test(u)) s += 20;
  if (u.includes('wp-content/uploads')) s += 10;
  if (u.includes('wixstatic.com')) s += 8;
  if (/\.jpe?g(\?|#|$)/i.test(u)) s += 4;
  if (/logo|icon|avatar|sprite/i.test(u)) s -= 30;
  return s;
}

async function validarFoto(url, referer) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: referer || `${new URL(url).origin}/`,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const ctype = resp.headers.get('content-type') || '';
    if (ctype && !/image\/(jpeg|jpg|png|webp|avif)/i.test(ctype)) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < MIN_BYTES || buf.length > 8_000_000) return null;
    const meta = await sharp(buf).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (w < MIN_W || h < MIN_H) return null;
    const ratio = w / Math.max(h, 1);
    if (ratio > 0.85 && ratio < 1.15 && w < 700) return null;
    return { url, buf, w, h };
  } catch {
    return null;
  }
}

async function scrapeWebOficial(website) {
  if (!website || SOCIAL.test(website)) return null;
  let home = website.trim();
  if (!/^https?:\/\//i.test(home)) home = `https://${home}`;
  const first = await fetchHtml(home);
  if (!first) return null;
  const urls = new Set(extraerFotos(first.url, first.html));
  try {
    const u = new URL(first.url);
    for (const p of EXTRA_PATHS) {
      const extra = await fetchHtml(`${u.protocol}//${u.host}${p}`);
      if (extra) extraerFotos(extra.url, extra.html).forEach((x) => urls.add(x));
    }
  } catch {
    /* ignore */
  }
  const ranked = [...urls].sort((a, b) => scoreUrl(b) - scoreUrl(a)).slice(0, 18);
  for (const url of ranked) {
    const ok = await validarFoto(url, first.url);
    if (ok) return ok;
  }
  return null;
}

async function uploadBuffer(supabase, centerId, buffer, tag) {
  const webp = await sharp(buffer).webp({ quality: 82, effort: 5 }).toBuffer();
  const path = `${centerId}/${tag}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from('centers').upload(path, webp, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from('centers').getPublicUrl(path).data.publicUrl;
}

async function generateAiCover(openaiKey, center) {
  const tipo = center.type === 'ayurveda' ? 'ayurveda' : center.type === 'meditation' ? 'meditación' : 'yoga';
  const city = center.city || center.province || 'España';
  const prompt =
    `Fotografía hiperrealista y cinematográfica del interior de un centro de ${tipo} en ${city}, ` +
    `Región de Murcia: sala con luz natural de día, madera, lino y plantas, ambiente real de estudio, ` +
    `sin texto ni logos, composición editorial horizontal, realismo fotográfico absoluto, portada web. ` +
    `Tomada como fotografía real con cámara full frame, luz existente, color natural, de día, sin HDR, sin render 3D.`;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1536x1024',
      quality: 'high',
      output_format: 'png',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `OpenAI ${res.status}`);
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;
  if (b64) return Buffer.from(b64, 'base64');
  if (url) {
    const img = await fetch(url);
    if (!img.ok) throw new Error('No se pudo bajar la imagen IA');
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error('Respuesta IA vacía');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvLocal();
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan claves Supabase');
    process.exit(1);
  }
  if (!NO_IA && !openaiKey) {
    console.error('Falta OPENAI_API_KEY (o usa --no-ia)');
    process.exit(1);
  }

  let q = supabase
    .from('centers')
    .select('id, name, city, province, type, website, cover_url, description_es')
    .eq('status', 'active')
    .order('name');
  if (PROVINCE) q = q.eq('province', PROVINCE);
  const { data, error } = await q;
  if (error) throw error;
  let centers = data || [];
  if (!FORCE) centers = centers.filter((c) => !c.cover_url);
  if (LIMIT) centers = centers.slice(0, LIMIT);

  console.log(`Portadas Retiru · ${centers.length} centros${PROVINCE ? ` · ${PROVINCE}` : ''}${NO_IA ? ' · sin IA' : ''}`);
  if (DRY) {
    centers.forEach((c) => console.log(` - ${c.name} | ${c.website || 'sin web'}`));
    return;
  }

  let webOk = 0;
  let iaOk = 0;
  let miss = 0;

  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    process.stdout.write(`[${i + 1}/${centers.length}] ${c.name}… `);
    try {
      const scraped = await scrapeWebOficial(c.website);
      if (scraped) {
        if (!DRY) {
          const publicUrl = await uploadBuffer(supabase, c.id, scraped.buf, 'web-cover');
          const { error: up } = await supabase.from('centers').update({ cover_url: publicUrl }).eq('id', c.id);
          if (up) throw new Error(up.message);
        }
        webOk++;
        console.log(`web ${scraped.w}x${scraped.h}`);
        await sleep(200);
        continue;
      }
      if (NO_IA) {
        miss++;
        console.log(`sin foto (${c.website || 'sin web'})`);
        continue;
      }
      const buf = await generateAiCover(openaiKey, c);
      const publicUrl = await uploadBuffer(supabase, c.id, buf, 'ai-cover');
      const { error: up } = await supabase.from('centers').update({ cover_url: publicUrl }).eq('id', c.id);
      if (up) throw new Error(up.message);
      iaOk++;
      console.log('IA');
      await sleep(400);
    } catch (e) {
      miss++;
      console.log(`error ${e.message}`);
    }
  }

  console.log(`\nWeb oficial: ${webOk} · IA: ${iaOk} · sin foto: ${miss}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
