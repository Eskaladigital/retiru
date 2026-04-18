import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) {
  readFileSync('.env.local', 'utf8').split('\n').forEach((l) => {
    const t = l.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq <= 0) return;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, eq).trim()] = v;
  });
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: dest } = await sb
  .from('destinations')
  .select('id, slug, name_es, country, region, kind')
  .eq('slug', 'marruecos')
  .single();

console.log('Destino "marruecos" en BD:');
console.log('  id        :', dest?.id);
console.log('  name_es   :', dest?.name_es);
console.log('  country   :', dest?.country);
console.log('  region    :', dest?.region);
console.log('  kind      :', dest?.kind);

if (dest) {
  const { data: rs, count } = await sb
    .from('retreats')
    .select('id, slug, title_es, status, end_date', { count: 'exact' })
    .eq('destination_id', dest.id);
  console.log('\nRetiros que apuntan a este destino:', count);
  for (const r of rs || []) {
    console.log(`  · [${r.status}] ${r.title_es} (end_date=${r.end_date}) → /retiro/${r.slug}`);
  }
}

// Lista general de destinos con sus retiros
console.log('\n─── Todos los destinos hoja con su nº de retiros ───');
const { data: all } = await sb
  .from('destinations')
  .select('id, slug, name_es, kind')
  .eq('is_active', true)
  .order('kind')
  .order('name_es');

for (const d of all || []) {
  const { count } = await sb
    .from('retreats')
    .select('id', { count: 'exact', head: true })
    .eq('destination_id', d.id);
  const k = (d.kind || 'destination').padEnd(11);
  console.log(`  ${k} ${d.slug.padEnd(28)} → ${count ?? 0} retiros`);
}
