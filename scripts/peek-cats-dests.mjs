import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const ENV = fs.readFileSync(path.resolve('.env.local'), 'utf8');
function pick(k) { const m = ENV.match(new RegExp(`^${k}=(.*)$`, 'm')); return m ? m[1].replace(/^['"]|['"]$/g, '') : ''; }

const URL = pick('NEXT_PUBLIC_SUPABASE_URL') || pick('SUPABASE_URL');
const KEY = pick('SUPABASE_SERVICE_ROLE_KEY') || pick('SUPABASE_ANON_KEY') || pick('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);

async function main() {
  console.log('--- categories activas ---');
  const { data: cats } = await sb.from('categories').select('slug, name_es, name_en, is_active').eq('is_active', true).order('slug');
  console.log((cats || []).map(c => `${c.slug.padEnd(20)} ES:${c.name_es?.padEnd(20)} EN:${c.name_en}`).join('\n'));

  console.log('\n--- destinations activas (kind=destination) ---');
  const { data: dests } = await sb.from('destinations').select('slug, name_es, kind').eq('is_active', true).eq('kind', 'destination').order('slug').limit(80);
  console.log((dests || []).map(d => `${d.slug.padEnd(30)} ${d.name_es}`).join('\n'));

  console.log('\n--- destinations province/region/country ---');
  const { data: hubs } = await sb.from('destinations').select('slug, name_es, kind').eq('is_active', true).in('kind', ['country','region','province']).order('kind').order('slug');
  console.log((hubs || []).map(d => `${d.kind.padEnd(10)} ${d.slug.padEnd(25)} ${d.name_es}`).join('\n'));

  console.log('\n--- categorías con retiros publicados futuros ---');
  const { data: rs } = await sb.from('retreats')
    .select('id, category_id, destination_id, categories!category_id(slug,name_es), destinations!destination_id(slug,name_es)')
    .eq('status', 'published')
    .gte('end_date', today)
    .gt('start_date', today)
    .limit(500);
  const pairs = new Set(); const catSet = new Set();
  for (const r of rs || []) {
    if (r.categories?.slug) catSet.add(r.categories.slug);
    if (r.categories?.slug && r.destinations?.slug) pairs.add(`${r.categories.slug} | ${r.destinations.slug}`);
  }
  console.log('cats con retiros futuros:', [...catSet].sort().join(', '));
  console.log('\npairs cat|dest con retiros futuros:');
  console.log([...pairs].sort().join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
