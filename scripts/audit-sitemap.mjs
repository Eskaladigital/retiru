#!/usr/bin/env node
// scripts/audit-sitemap.mjs
// Audita TODAS las URLs del sitemap.xml de producción y reporta las que no devuelven 200.
// Uso:
//   node scripts/audit-sitemap.mjs                # https://www.retiru.com
//   node scripts/audit-sitemap.mjs http://localhost:3000

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.argv[2] || 'https://www.retiru.com';
const CONCURRENCY = Number(process.env.CONCURRENCY || 16);
const REPORT_DIR = path.resolve('scripts');
const REPORT_OK = path.join(REPORT_DIR, 'audit-sitemap-ok.txt');
const REPORT_BAD = path.join(REPORT_DIR, 'audit-sitemap-bad.txt');

function pickType(u) {
  const p = new URL(u).pathname;
  if (/^\/(es|en)$/.test(p)) return 'home';
  if (/^\/(es|en)\/centros\/[^/]+$/.test(p)) return 'centros-tipo';
  if (/^\/(es|en)\/centros\/[^/]+\/(estilo|style)\/[^/]+$/.test(p)) return 'centros-estilo';
  if (/^\/(es|en)\/centros\/[^/]+\/(estilo|style)\/[^/]+\/[^/]+$/.test(p)) return 'centros-estilo-prov';
  if (/^\/(es|en)\/centros\/[^/]+\/[^/]+\/[^/]+$/.test(p)) return 'centros-tipo-prov-ciudad';
  if (/^\/(es|en)\/centros\/[^/]+\/[^/]+$/.test(p)) return 'centros-tipo-prov';
  if (/^\/(es|en)\/(provincias|provinces)\/[^/]+$/.test(p)) return 'provincias';
  if (/^\/(es|en)\/(provincias|provinces)$/.test(p)) return 'provincias-root';
  if (/^\/(es|en)\/(centro|center)\/[^/]+$/.test(p)) return 'centro-ficha';
  if (/^\/(es|en)\/(centros-retiru|centers-retiru)$/.test(p)) return 'centros-retiru-root';
  if (/^\/(es|en)\/(centros-retiru|centers-retiru)\/[^/]+$/.test(p)) return 'centros-retiru-slug';
  if (/^\/(es|en)\/(retiros-retiru|retreats-retiru)$/.test(p)) return 'retiros-retiru-root';
  if (/^\/(es|en)\/(retiros-retiru|retreats-retiru)\/[^/]+$/.test(p)) return 'retiros-retiru-slug';
  if (/^\/(es|en)\/(retiros-en|retreats-in)\/[^/]+$/.test(p)) return 'geo-landing';
  if (/^\/(es|en)\/(retiros|retreats)-[^/]+\/[^/]+$/.test(p)) return 'retiros-categoria-destino';
  if (/^\/(es|en)\/(retiros|retreats)-[^/]+$/.test(p)) return 'retiros-categoria';
  if (/^\/(es|en)\/(retiro|retreat)\/[^/]+$/.test(p)) return 'retiro-ficha';
  if (/^\/(es|en)\/(destinos|destinations)\/[^/]+$/.test(p)) return 'destino-ficha';
  if (/^\/(es|en)\/(destinos|destinations)$/.test(p)) return 'destinos-root';
  if (/^\/(es|en)\/blog\/[^/]+$/.test(p)) return 'blog-post';
  if (/^\/(es|en)\/blog$/.test(p)) return 'blog-root';
  if (/^\/(es|en)\/(organizador|organizer)\/[^/]+$/.test(p)) return 'organizador-ficha';
  if (/^\/(es|en)\/(tienda|shop)\/[^/]+$/.test(p)) return 'tienda-ficha';
  if (/^\/(es|en)\/(tienda|shop)$/.test(p)) return 'tienda-root';
  if (/^\/(es|en)\/(buscar|search)$/.test(p)) return 'buscar';
  if (/^\/(es|en)\/(ayuda|help|contacto|contact|sobre-nosotros|about|para-asistentes|for-attendees|para-organizadores|for-organizers|condiciones)$/.test(p)) return 'estatica';
  if (/^\/(es|en)\/legal\/[^/]+$/.test(p)) return 'legal';
  if (/^\/(es|en)\/sitemap$/.test(p)) return 'sitemap-html';
  return 'otra';
}

async function getSitemapUrls() {
  const res = await fetch(`${ROOT}/sitemap.xml`, { headers: { 'user-agent': 'retiru-sitemap-audit/1.0' } });
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
  // Si el sitemap es índice de sitemaps, expandir
  if (urls.length && urls[0].endsWith('.xml')) {
    const expanded = [];
    for (const sm of urls) {
      const r2 = await fetch(sm);
      if (r2.ok) {
        const x2 = await r2.text();
        for (const m of x2.matchAll(/<loc>([^<]+)<\/loc>/g)) expanded.push(m[1]);
      }
    }
    return expanded;
  }
  return urls;
}

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': 'retiru-sitemap-audit/1.0 (+contact contacto@retiru.com)',
        'accept': 'text/html,*/*;q=0.5',
      },
    });
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    return { status: 0, error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function bar(done, total, w = 30) {
  const pct = Math.floor((done / total) * 100);
  const filled = Math.floor((done / total) * w);
  return `[${'#'.repeat(filled)}${'.'.repeat(w - filled)}] ${pct}% ${done}/${total}`;
}

async function main() {
  process.stdout.write(`Descargando sitemap de ${ROOT}/sitemap.xml ...\n`);
  const urls = await getSitemapUrls();
  process.stdout.write(`URLs encontradas: ${urls.length}\n`);

  const byType = {};
  urls.forEach(u => {
    const t = pickType(u);
    byType[t] = (byType[t] || 0) + 1;
  });
  console.log('Distribución por tipo:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const results = [];
  let i = 0;
  let done = 0;
  const t0 = Date.now();

  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      const url = urls[idx];
      const r = await probe(url);
      results[idx] = { url, type: pickType(url), ...r };
      done++;
      if (done % 25 === 0 || done === urls.length) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
        process.stdout.write(`\r${bar(done, urls.length)} · ${elapsed}s`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write('\n');

  const ok = results.filter(r => r.status >= 200 && r.status < 400);
  const bad = results.filter(r => !(r.status >= 200 && r.status < 400));

  // Resumen por tipo
  console.log('\n=== Resumen por tipo (status != 2xx/3xx) ===');
  const groups = {};
  for (const r of bad) {
    const k = r.type;
    groups[k] = groups[k] || { total: 0, byStatus: {} };
    groups[k].total++;
    groups[k].byStatus[r.status] = (groups[k].byStatus[r.status] || 0) + 1;
  }
  for (const [t, info] of Object.entries(groups).sort((a, b) => b[1].total - a[1].total)) {
    const detail = Object.entries(info.byStatus).map(([s, n]) => `${s}=${n}`).join(' ');
    console.log(`  ${t}: ${info.total} (${detail})`);
  }

  await fs.writeFile(REPORT_OK, ok.map(r => `${r.status} ${r.url}`).join('\n'), 'utf8');
  await fs.writeFile(REPORT_BAD, bad.map(r => `${r.status} ${r.type} ${r.url}${r.error ? ' :: ' + r.error : ''}`).join('\n'), 'utf8');

  console.log(`\nOK : ${ok.length}`);
  console.log(`BAD: ${bad.length}`);
  console.log(`Reportes:\n  ${REPORT_OK}\n  ${REPORT_BAD}`);

  if (bad.length > 0) {
    console.log('\n=== Primeras 30 URLs con problemas ===');
    bad.slice(0, 30).forEach(r => console.log(`  ${r.status} [${r.type}] ${r.url}${r.error ? ' :: ' + r.error : ''}`));
    process.exit(1);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
