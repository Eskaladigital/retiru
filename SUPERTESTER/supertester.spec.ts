import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const MAX_NAV_MS = process.env.SUPERTESTER_MAX_NAV_MS
  ? Number(process.env.SUPERTESTER_MAX_NAV_MS)
  : 25_000;

const cacheFile = path.join(process.cwd(), 'SUPERTESTER', '.urls-cache.json');

function loadUrls(): string[] {
  if (!fs.existsSync(cacheFile)) {
    throw new Error(
      `Falta ${cacheFile}. Ejecuta: node SUPERTESTER/fetch-urls.mjs (o npm run supertester).`,
    );
  }
  return JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as string[];
}

const urls = loadUrls();

test.describe.configure({ mode: 'parallel' });

for (const url of urls) {
  test(`OK · SEO · tiempo · ${url}`, async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('baseURL requerido (SUPERTESTER_BASE_URL / playwright.config)');

    const pathLabel = url.replace(baseURL, '') || '/';

    const t0 = Date.now();
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: MAX_NAV_MS,
    });
    const navMs = Date.now() - t0;

    expect(response, `sin respuesta HTTP (${pathLabel})`).toBeTruthy();
    const status = response!.status();
    expect(status, `HTTP ${status} en ${pathLabel}`).toBeLessThan(400);

    const html = await page.content();
    const isCrashPage =
      html.includes('Application error: a client-side exception') ||
      html.includes('Internal Server Error');
    expect(isCrashPage, `página de error en ${pathLabel}`).toBe(false);

    const { bodyH, lang, title, desc, ogTitle, ogDesc, canonical } = await page.evaluate(() => {
      const descEl = document.querySelector('meta[name="description"]');
      const ogT = document.querySelector('meta[property="og:title"]');
      const ogD = document.querySelector('meta[property="og:description"]');
      const can = document.querySelector('link[rel="canonical"]');
      return {
        bodyH: document.body?.clientHeight ?? 0,
        lang: document.documentElement.getAttribute('lang') || '',
        title: document.title || '',
        desc: (descEl as HTMLMetaElement | null)?.getAttribute('content')?.trim() || '',
        ogTitle: (ogT as HTMLMetaElement | null)?.getAttribute('content')?.trim() || '',
        ogDesc: (ogD as HTMLMetaElement | null)?.getAttribute('content')?.trim() || '',
        canonical: (can as HTMLLinkElement | null)?.getAttribute('href')?.trim() || '',
      };
    });

    expect.soft(bodyH, `contenido muy bajo (¿layout roto?) en ${pathLabel}`).toBeGreaterThan(120);
    expect.soft(navMs, `navegación lenta (${navMs} ms > ${MAX_NAV_MS}) en ${pathLabel}`).toBeLessThanOrEqual(
      MAX_NAV_MS,
    );

    const esEn = lang === 'es' || lang === 'en' || lang.startsWith('es-') || lang.startsWith('en-');
    expect.soft(esEn, `<html lang> inválido "${lang}" en ${pathLabel}`).toBe(true);

    expect.soft(title.trim().length, `<title> vacío en ${pathLabel}`).toBeGreaterThan(0);

    const descOk = desc.length >= 30 || ogDesc.length >= 30;
    expect.soft(descOk, `meta description u og:description cortos en ${pathLabel}`).toBe(true);

    const ogOk = ogTitle.length >= 3 || title.trim().length >= 3;
    expect.soft(ogOk, `falta og:title (y title dudoso) en ${pathLabel}`).toBe(true);

    const canOk = canonical.startsWith('http');
    expect.soft(canOk, `falta <link rel="canonical"> absoluto en ${pathLabel}`).toBe(true);
  });
}
