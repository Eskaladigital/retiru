#!/usr/bin/env node
/**
 * RETIRU · Sincronizar emails desde directorio.csv y buscar con SerpAPI los que faltan
 * Uso: node scripts/sync-and-fetch-emails.mjs [--solo-csv] [--solo-serp] [--limit N]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local no encontrado');
  process.exit(1);
}
const content = readFileSync(envPath, 'utf8');
content.split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const serpKey = process.env.SERPAPI_API_KEY;

// ─── Parse CSV (mismo que import-directorio) ────────────────────────────────
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
    header.forEach((h, j) => { row[h] = values[j] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeSlug(name, province) {
  let base = slugify(name);
  if (base.length > 40) base = base.slice(0, 40);
  return base;
}

function isValidEmail(s) {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim();
  return t.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

const BAD_EMAIL_DOMAINS = ['example.com', 'retiru.com', 'yoursite.com', 'email.com', 'domain.com', 'myrealfood.app'];

function extractEmailsFromText(text, centerWebsite = null) {
  if (!text) return [];
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(regex) || [];
  let filtered = [...new Set(matches)].filter((e) => {
    const lower = e.toLowerCase();
    const domain = lower.split('@')[1] || '';
    if (BAD_EMAIL_DOMAINS.some((d) => domain.includes(d))) return false;
    return true;
  });
  if (centerWebsite && filtered.length > 1) {
    const siteDomain = centerWebsite.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const match = filtered.find((e) => e.toLowerCase().includes(siteDomain.replace('www.', '')));
    if (match) return [match];
  }
  return filtered;
}

async function main() {
  const soloCsv = process.argv.includes('--solo-csv');
  const soloSerp = process.argv.includes('--solo-serp');
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) || 0 : 0;

  // ─── 1. Sincronizar desde directorio.csv ───────────────────────────────────
  if (!soloSerp) {
    const csvPath = join(root, 'directorio.csv');
    if (!existsSync(csvPath)) {
      console.error('❌ directorio.csv no encontrado');
    } else {
      console.log('\n📂 Sincronizando emails desde directorio.csv...');
      const csvContent = readFileSync(csvPath, 'utf8');
      const rows = parseCSV(csvContent);

      let csvConEmail = 0;
      let updated = 0;
      let notFound = 0;

      // Cargar todos los centros para matchear por nombre+provincia
      const { data: allCenters } = await supabase.from('centers').select('id, name, province, email');
      const centerByKey = new Map();
      for (const c of allCenters || []) {
        const key = `${(c.name || '').trim().toLowerCase()}|||${(c.province || '').trim()}`;
        if (!centerByKey.has(key)) centerByKey.set(key, c);
      }

      for (const r of rows) {
        const name = (r.Nombre || '').trim();
        const province = (r.Provincia || '').trim() || 'España';
        const emailRaw = (r.Email || '').trim();
        if (!name || !isValidEmail(emailRaw)) continue;

        csvConEmail++;
        const key = `${name.toLowerCase()}|||${province}`;
        const center = centerByKey.get(key);
        if (!center) {
          notFound++;
          continue;
        }

        if (!center.email || center.email.trim() === '') {
          const { error } = await supabase.from('centers').update({ email: emailRaw }).eq('id', center.id);
          if (!error) {
            updated++;
            console.log(`   ✓ ${name} → ${emailRaw}`);
          }
        }
      }

      console.log(`   CSV con email: ${csvConEmail} | Actualizados en BD: ${updated} | No encontrados: ${notFound}`);
    }
  }

  // ─── 2. Buscar emails con SerpAPI para centros sin email ───────────────────
  if (!soloCsv && serpKey) {
    console.log('\n🔍 Buscando emails con SerpAPI para centros sin email...');

    let offset = 0;
    const pageSize = 100;
    let sinEmail = [];
    while (true) {
      const { data } = await supabase
        .from('centers')
        .select('id, name, slug, city, province, website')
        .or('email.is.null,email.eq.')
        .range(offset, offset + pageSize - 1);
      if (!data?.length) break;
      sinEmail = sinEmail.concat(data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    if (limit > 0) sinEmail = sinEmail.slice(0, limit);
    console.log(`   ${sinEmail.length} centros sin email a procesar`);

    let found = 0;
    for (let i = 0; i < sinEmail.length; i++) {
      const c = sinEmail[i];
      let emails = [];

      if (c.website) {
        const domain = c.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split('/')[0];
        if (domain) {
          try {
            const siteRes = await fetch(
              `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent('site:' + domain + ' email contacto')}&api_key=${serpKey}&hl=es&num=5`
            );
            const siteData = await siteRes.json();
            const siteSnippets = (siteData.organic_results || []).map((r) => (r.snippet || '') + ' ' + (r.title || '')).join(' ');
            emails = extractEmailsFromText(siteSnippets, c.website);
          } catch {}
        }
      }

      if (emails.length === 0) {
        const query = `"${c.name}" ${c.city || ''} ${c.province || ''} email contacto`;
        try {
          const res = await fetch(
            `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&num=10`
          );
          const data = await res.json();
          const snippets = (data.organic_results || []).map((r) => r.snippet || '').join(' ');
          emails = extractEmailsFromText(snippets, c.website);
        } catch (err) {
          console.error(`   ❌ ${c.name}:`, err.message);
        }
      }

      if (emails.length > 0) {
        const email = emails[0];
        const { error } = await supabase.from('centers').update({ email }).eq('id', c.id);
        if (!error) {
          found++;
          console.log(`   ✓ [${i + 1}/${sinEmail.length}] ${c.name} → ${email}`);
        }
      }

      if ((i + 1) % 20 === 0) console.log(`   ... ${i + 1}/${sinEmail.length} procesados`);
      await new Promise((r) => setTimeout(r, 600));
    }

    console.log(`  Encontrados con SerpAPI: ${found}`);
  } else if (!soloCsv && !serpKey) {
    console.log('\n⚠️ SERPAPI_API_KEY no configurada. No se buscarán emails con SerpAPI.');
  }

  console.log('\n✅ Listo.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
