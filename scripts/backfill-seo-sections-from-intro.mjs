#!/usr/bin/env node
/**
 * Reparación: filas SEO con intro pero sections_es vacías → materializa 1 sección
 * a partir del intro (las generaciones Cap.2/4/5 a veces omitían sections_*).
 *
 * Uso: node scripts/backfill-seo-sections-from-intro.mjs
 *      node scripts/backfill-seo-sections-from-intro.mjs --dry-run
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
readFileSync(join(root, '.env.local'), 'utf8').split('\n').forEach((line) => {
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

const DRY = process.argv.includes('--dry-run');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function asHtml(s) {
  const t = (s || '').trim();
  if (!t) return '';
  return t.startsWith('<') ? t : `<p>${t}</p>`;
}

function needsSections(sections) {
  return !Array.isArray(sections) || sections.length === 0;
}

let fixed = 0;

// Cap. 5 (y Cap. 3 si faltara): center_type_province_seo
const { data: seoRows } = await sb
  .from('center_type_province_seo')
  .select('id, type, province_slug, city_slug, city_name, province_name, intro_es, intro_en, sections_es, sections_en');
for (const r of seoRows || []) {
  if (!needsSections(r.sections_es) || !(r.intro_es || '').trim()) continue;
  const isCity = !!r.city_slug;
  const key = isCity ? 'access_transport_character' : 'why_here';
  const place = r.city_name || r.province_name || r.province_slug;
  const payload = {
    sections_es: [{
      key,
      heading: isCity ? `${place}: acceso, transporte y carácter` : `Por qué practicar aquí`,
      html: asHtml(r.intro_es),
    }],
    sections_en: (r.intro_en || '').trim()
      ? [{
          key,
          heading: isCity ? `${place}: access, transport & character` : `Why practice here`,
          html: asHtml(r.intro_en),
        }]
      : [],
  };
  console.log(`${DRY ? 'DRY' : 'FIX'} seo ${r.type}/${r.province_slug}${r.city_slug ? '/' + r.city_slug : ''}`);
  if (!DRY) {
    const { error } = await sb.from('center_type_province_seo').update(payload).eq('id', r.id);
    if (error) console.error('  ✗', error.message);
    else fixed++;
  } else fixed++;
}

// Cap. 2: styles
const { data: styles } = await sb.from('styles').select('id, slug, name_es, intro_es, intro_en, sections_es, sections_en');
for (const r of styles || []) {
  if (!needsSections(r.sections_es) || !(r.intro_es || '').trim()) continue;
  const name = r.name_es || r.slug;
  const payload = {
    sections_es: [{
      key: 'what_to_expect',
      heading: `¿Qué caracteriza a ${name}?`,
      html: asHtml(r.intro_es),
    }],
    sections_en: (r.intro_en || '').trim()
      ? [{ key: 'what_to_expect', heading: `What defines ${name}?`, html: asHtml(r.intro_en) }]
      : [],
  };
  console.log(`${DRY ? 'DRY' : 'FIX'} style ${r.slug}`);
  if (!DRY) {
    const { error } = await sb.from('styles').update(payload).eq('id', r.id);
    if (error) console.error('  ✗', error.message);
    else fixed++;
  } else fixed++;
}

// Cap. 4: style_province_seo
const { data: sp } = await sb
  .from('style_province_seo')
  .select('id, style_slug, province_slug, province_name, intro_es, intro_en, sections_es, sections_en');
for (const r of sp || []) {
  if (!needsSections(r.sections_es) || !(r.intro_es || '').trim()) continue;
  const payload = {
    sections_es: [{
      key: 'why_here_for_style',
      heading: `Por qué ${r.style_slug} en ${r.province_name || r.province_slug}`,
      html: asHtml(r.intro_es),
    }],
    sections_en: (r.intro_en || '').trim()
      ? [{
          key: 'why_here_for_style',
          heading: `Why ${r.style_slug} in ${r.province_name || r.province_slug}`,
          html: asHtml(r.intro_en),
        }]
      : [],
  };
  console.log(`${DRY ? 'DRY' : 'FIX'} style×prov ${r.style_slug}/${r.province_slug}`);
  if (!DRY) {
    const { error } = await sb.from('style_province_seo').update(payload).eq('id', r.id);
    if (error) console.error('  ✗', error.message);
    else fixed++;
  } else fixed++;
}

console.log(`\n${DRY ? 'Simuladas' : 'Reparadas'}: ${fixed} filas`);
