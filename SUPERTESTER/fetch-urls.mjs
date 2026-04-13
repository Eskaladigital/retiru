/**
 * Descarga /sitemap.xml del origen indicado, reescribe <loc> al host local
 * (el sitemap de Retiru usa siempre dominio de producción) y escribe .urls-cache.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTRA_PATHS = ['/es/login', '/es/registro', '/en/login', '/en/register'];

const baseURL = process.env.SUPERTESTER_BASE_URL || 'http://localhost:3000';
const maxUrls = process.env.SUPERTESTER_MAX_URLS
  ? Math.max(1, Number(process.env.SUPERTESTER_MAX_URLS))
  : 600;

function rewriteLocToBase(loc, baseOrigin) {
  try {
    const u = new URL(loc.trim());
    const base = new URL(baseOrigin);
    return `${base.origin}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

async function main() {
  const origin = new URL(baseURL).origin;
  const res = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) {
    console.error(`[fetch-urls] No se pudo leer sitemap.xml (${res.status}). ¿Está el servidor en marcha? (${baseURL})`);
    process.exit(1);
  }
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
  const rewritten = new Set();
  for (const loc of locs) {
    const u = rewriteLocToBase(loc, baseURL);
    if (u) rewritten.add(u);
  }
  for (const p of EXTRA_PATHS) {
    rewritten.add(`${origin}${p}`);
  }
  let list = [...rewritten].sort();
  if (list.length > maxUrls) {
    list = list.slice(0, maxUrls);
  }
  const out = path.join(__dirname, '.urls-cache.json');
  fs.writeFileSync(out, JSON.stringify(list, null, 0), 'utf8');
  console.log(`[fetch-urls] ${list.length} URLs → ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
