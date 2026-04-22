import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
readFileSync('.env.local','utf8').split('\n').forEach(l=>{const t=l.trim();if(t&&!t.startsWith('#')){const i=t.indexOf('=');if(i>0){let v=t.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[t.slice(0,i).trim()]=v;}}});
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const [type, prov, city] = process.argv.slice(2);
let q = c.from('center_type_province_seo').select('*').eq('type', type).eq('province_slug', prov);
q = city ? q.eq('city_slug', city) : q.is('city_slug', null);
const { data, error } = await q.maybeSingle();
if (error) { console.error(error); process.exit(1); }
if (!data) { console.log('No row.'); process.exit(0); }
console.log('─── META ───');
console.log('meta_title_es:', data.meta_title_es);
console.log('meta_description_es:', data.meta_description_es);
console.log('\n─── INTRO ES ───');
console.log(data.intro_es);
console.log('\n─── SECTIONS ES ───');
(data.sections_es || []).forEach((s, i) => {
  console.log(`\n[${i + 1}] key="${s.key}" heading="${s.heading}"`);
  console.log(s.html);
});
console.log('\n─── FAQ ES (' + (data.faq_es || []).length + ') ───');
(data.faq_es || []).forEach((q, i) => console.log(`${i + 1}. ${q.question}\n   ${q.answer}\n`));
console.log('\n─── SERP DATA PAA ───');
((data.serp_data?.paa) || []).forEach((q, i) => console.log(`${i + 1}. ${q.question}`));
console.log('\nsuppress_reason:', data.suppress_reason);
