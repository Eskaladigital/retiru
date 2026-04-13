#!/usr/bin/env node
/**
 * Convierte descripciones de retiros de Markdown a HTML en Supabase.
 * Solo toca retiros cuyo contenido NO parece HTML (legacy markdown).
 *
 * Uso:
 *   node scripts/convert-retreat-descriptions-to-html.mjs           # dry-run
 *   node scripts/convert-retreat-descriptions-to-html.mjs --update  # actualiza BD
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ─── Env ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Faltan credenciales de Supabase'); process.exit(1); }

const doUpdate = process.argv.includes('--update');

// ─── Conversión: mismo pipeline que el front ────────────────────────────────

function contentLooksLikeHtml(text) {
  const t = (text ?? '').trim();
  if (!t) return false;
  if (/^<[a-zA-Z!?\/]/.test(t)) return true;
  if (/<\/(p|h[1-6]|ul|ol|li|blockquote|div|img|figure|figcaption|pre|code|a)>/i.test(t)) return true;
  if (/<(p|h[1-6]|ul|ol|li|div|blockquote|img|figure|figcaption|pre|code|a|hr)(\s[^>]*)?>/i.test(t)) return true;
  return false;
}

function normalizeInlineMarkdown(raw) {
  let t = raw;
  t = t.replace(/\\(#{1,4}\s)/g, '$1');
  t = t.replace(/\\\*\\\*/g, '**');
  t = t.replace(/([^\n#])[ \t]+(#{1,4})[ \t]+(\S)/g, '$1\n\n$2 $3');
  t = t.replace(/([^\n])[ \t]+•[ \t]+/g, '$1\n• ');
  return t;
}

function inlineFormat(line) {
  let out = line;
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  out = out.replace(
    /(?<!href="|">)(https?:\/\/[^\s<)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

function isUnorderedItem(line) {
  return /^[\s]*[-•*]\s+/.test(line) && !/^\*\*/.test(line.trim());
}
function isOrderedItem(line) {
  return /^[\s]*\d+[.)]\s+/.test(line);
}
function stripBullet(line) { return line.replace(/^[\s]*[-•*]\s+/, ''); }
function stripNumber(line) { return line.replace(/^[\s]*\d+[.)]\s+/, ''); }
function peekNextNonEmpty(lines, from) {
  for (let j = from; j < lines.length; j++) if (lines[j].trim()) return lines[j].trim();
  return '';
}
function collectListItems(lines, startIdx, matcher, stripper) {
  const items = [];
  let i = startIdx;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (matcher(trimmed)) {
      items.push(`<li>${inlineFormat(stripper(lines[i]))}</li>`);
      i++;
    } else if (!trimmed && peekNextNonEmpty(lines, i + 1) && matcher(peekNextNonEmpty(lines, i + 1))) {
      i++;
    } else break;
  }
  return { items, endIdx: i };
}

function markdownToHtml(text) {
  if (!text?.trim()) return '';
  const lines = normalizeInlineMarkdown(text).split('\n');
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }
    if (trimmed.startsWith('#### ')) { result.push(`<h4>${inlineFormat(trimmed.slice(5))}</h4>`); i++; continue; }
    if (trimmed.startsWith('### ') && !trimmed.startsWith('####')) { result.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`); i++; continue; }
    if (trimmed.startsWith('## ') && !trimmed.startsWith('###')) { result.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`); i++; continue; }
    if (trimmed.startsWith('# ') && !trimmed.startsWith('##')) { result.push(`<h2>${inlineFormat(trimmed.slice(2))}</h2>`); i++; continue; }
    if (isUnorderedItem(trimmed)) {
      const { items, endIdx } = collectListItems(lines, i, isUnorderedItem, stripBullet);
      result.push(`<ul>${items.join('')}</ul>`);
      i = endIdx; continue;
    }
    if (isOrderedItem(trimmed)) {
      const { items, endIdx } = collectListItems(lines, i, isOrderedItem, stripNumber);
      result.push(`<ol>${items.join('')}</ol>`);
      i = endIdx; continue;
    }
    const paraLines = [trimmed];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !lines[i].trim().startsWith('####') && !lines[i].trim().startsWith('###') &&
      !lines[i].trim().match(/^##\s/) && !lines[i].trim().match(/^#\s/) &&
      !isUnorderedItem(lines[i].trim()) && !isOrderedItem(lines[i].trim())
    ) { paraLines.push(lines[i].trim()); i++; }
    result.push(`<p>${inlineFormat(paraLines.join(' '))}</p>`);
  }
  return result.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

const supabase = createClient(url, key);

const { data: retreats, error } = await supabase
  .from('retreats')
  .select('id, title_es, slug, description_es, description_en')
  .order('created_at', { ascending: false });

if (error) { console.error('Error:', error.message); process.exit(1); }

console.log(`\n📋 Total retiros: ${retreats.length}`);
console.log(`   Modo: ${doUpdate ? '🔴 ACTUALIZAR BD' : '🟡 DRY-RUN (solo mostrar)'}\n`);
console.log('━'.repeat(70));

let converted = 0;

for (const r of retreats) {
  const needsEs = r.description_es?.trim() && !contentLooksLikeHtml(r.description_es);
  const needsEn = r.description_en?.trim() && !contentLooksLikeHtml(r.description_en);

  if (!needsEs && !needsEn) continue;

  converted++;
  console.log(`\n🔄 ${r.title_es || r.slug}`);
  if (needsEs) console.log('   → description_es: markdown → HTML');
  if (needsEn) console.log('   → description_en: markdown → HTML');

  const updates = {};
  if (needsEs) {
    const html = markdownToHtml(r.description_es);
    updates.description_es = html;
    console.log(`   ES antes (${r.description_es.length} chars) → después (${html.length} chars)`);
    console.log(`   Preview: ${html.slice(0, 120)}...`);
  }
  if (needsEn) {
    const html = markdownToHtml(r.description_en);
    updates.description_en = html;
    console.log(`   EN antes (${r.description_en.length} chars) → después (${html.length} chars)`);
  }

  if (doUpdate) {
    updates.updated_at = new Date().toISOString();
    const { error: upErr } = await supabase
      .from('retreats')
      .update(updates)
      .eq('id', r.id);
    if (upErr) {
      console.error(`   ❌ Error: ${upErr.message}`);
    } else {
      console.log('   ✅ Actualizado en BD');
    }
  }
}

console.log('\n' + '━'.repeat(70));
console.log(`\n📊 Resultado: ${converted} retiro(s) con markdown detectado de ${retreats.length} total.`);
if (!doUpdate && converted > 0) {
  console.log('   Ejecuta con --update para aplicar los cambios en BD.\n');
}
