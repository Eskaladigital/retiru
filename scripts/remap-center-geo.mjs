#!/usr/bin/env node
/**
 * Remapa country / region / province / city / postal_code de centers
 * a partir de la address de Google.
 *
 * - País si la address dice France / Portugal / Andorra / Spain.
 * - Provincia y CCAA por prefijo de CP (ES 01–52; FR 31/64/65/66).
 * - Ciudad = municipio tras el CP, no barrio ni portal.
 * - Rellena postal_code si está vacío y la address lo trae.
 *
 *   node scripts/remap-center-geo.mjs
 *   node scripts/remap-center-geo.mjs --execute
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) {
  console.error('Falta .env.local');
  process.exit(1);
}
readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach((line) => {
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

const execute = process.argv.includes('--execute');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}
const admin = createClient(supabaseUrl, serviceKey);

const ES_BY_PREFIX = {
  '01': ['Álava', 'País Vasco'],
  '02': ['Albacete', 'Castilla-La Mancha'],
  '03': ['Alicante', 'Comunidad Valenciana'],
  '04': ['Almería', 'Andalucía'],
  '05': ['Ávila', 'Castilla y León'],
  '06': ['Badajoz', 'Extremadura'],
  '07': ['Baleares', 'Islas Baleares'],
  '08': ['Barcelona', 'Cataluña'],
  '09': ['Burgos', 'Castilla y León'],
  '10': ['Cáceres', 'Extremadura'],
  '11': ['Cádiz', 'Andalucía'],
  '12': ['Castellón', 'Comunidad Valenciana'],
  '13': ['Ciudad Real', 'Castilla-La Mancha'],
  '14': ['Córdoba', 'Andalucía'],
  '15': ['A Coruña', 'Galicia'],
  '16': ['Cuenca', 'Castilla-La Mancha'],
  '17': ['Girona', 'Cataluña'],
  '18': ['Granada', 'Andalucía'],
  '19': ['Guadalajara', 'Castilla-La Mancha'],
  '20': ['Gipuzkoa', 'País Vasco'],
  '21': ['Huelva', 'Andalucía'],
  '22': ['Huesca', 'Aragón'],
  '23': ['Jaén', 'Andalucía'],
  '24': ['León', 'Castilla y León'],
  '25': ['Lleida', 'Cataluña'],
  '26': ['La Rioja', 'La Rioja'],
  '27': ['Lugo', 'Galicia'],
  '28': ['Madrid', 'Comunidad de Madrid'],
  '29': ['Málaga', 'Andalucía'],
  '30': ['Murcia', 'Región de Murcia'],
  '31': ['Navarra', 'Comunidad Foral de Navarra'],
  '32': ['Ourense', 'Galicia'],
  '33': ['Asturias', 'Asturias'],
  '34': ['Palencia', 'Castilla y León'],
  '35': ['Las Palmas', 'Islas Canarias'],
  '36': ['Pontevedra', 'Galicia'],
  '37': ['Salamanca', 'Castilla y León'],
  '38': ['Santa Cruz de Tenerife', 'Islas Canarias'],
  '39': ['Cantabria', 'Cantabria'],
  '40': ['Segovia', 'Castilla y León'],
  '41': ['Sevilla', 'Andalucía'],
  '42': ['Soria', 'Castilla y León'],
  '43': ['Tarragona', 'Cataluña'],
  '44': ['Teruel', 'Aragón'],
  '45': ['Toledo', 'Castilla-La Mancha'],
  '46': ['Valencia', 'Comunidad Valenciana'],
  '47': ['Valladolid', 'Castilla y León'],
  '48': ['Bizkaia', 'País Vasco'],
  '49': ['Zamora', 'Castilla y León'],
  '50': ['Zaragoza', 'Aragón'],
  '51': ['Ceuta', 'Ceuta'],
  '52': ['Melilla', 'Melilla'],
};

const FR_BY_PREFIX = {
  '31': ['Haute-Garonne', 'Occitanie'],
  '64': ['Pyrénées-Atlantiques', 'Nouvelle-Aquitaine'],
  '65': ['Hautes-Pyrénées', 'Occitanie'],
  '66': ['Pyrénées-Orientales', 'Occitanie'],
};

const PT_BY_PREFIX = {
  '54': ['Vila Real', 'Norte'],
  '81': ['Faro', 'Algarve'],
};

const PROVINCE_ALIASES = new Set([
  'spain', 'españa', 'espana', 'france', 'francia', 'portugal',
  'barcelona', 'madrid', 'valencia', 'sevilla', 'malaga', 'málaga', 'granada',
  'murcia', 'almeria', 'almería', 'cadiz', 'cádiz', 'cordoba', 'córdoba',
  'jaen', 'jaén', 'huelva', 'alava', 'álava', 'araba', 'vizcaya', 'bizkaia',
  'guipuzcoa', 'guipúzcoa', 'gipuzkoa', 'navarra', 'asturias', 'cantabria',
  'illes balears', 'islas baleares', 'baleares', 'girona', 'gerona', 'lleida',
  'lerida', 'lérida', 'tarragona', 'castellon', 'castellón', 'castello',
  'alicante', 'alacant', 'badajoz', 'caceres', 'cáceres', 'caceres',
  'toledo', 'ciudad real', 'cuenca', 'guadalajara', 'albacete',
  'leon', 'león', 'zamora', 'salamanca', 'avila', 'ávila', 'segovia',
  'soria', 'palencia', 'valladolid', 'burgos', 'huesca', 'teruel', 'zaragoza',
  'ourense', 'orense', 'lugo', 'pontevedra', 'a coruña', 'la coruña', 'coruña',
  'las palmas', 'santa cruz de tenerife', 'la rioja',
  'andalucia', 'andalucía', 'cataluña', 'catalunya', 'galicia',
  'castilla y leon', 'castilla y león', 'castilla-la mancha', 'aragon', 'aragón',
  'extremadura', 'comunidad valenciana', 'comunidad de madrid', 'pais vasco',
  'país vasco', 'islas canarias', 'canarias', 'region de murcia', 'región de murcia',
]);

const DISTRICTS = new Set([
  'arganzuela', 'retiro', 'salamanca', 'chamartin', 'chamartín', 'tetuan', 'tetuán',
  'chamberi', 'chamberí', 'fuencarral-el-pardo', 'moncloa-aravaca', 'latina',
  'carabanchel', 'usera', 'puente-de-vallecas', 'moratalaz', 'ciudad-lineal',
  'cdad-lineal', 'hortaleza', 'villaverde', 'villa-de-vallecas', 'vicalvaro',
  'vicálvaro', 'san-blas-canillejas', 'barajas', 'centro', 'distrito-centro',
  'ciutat-vella', 'eixample', 'sants-montjuic', 'sants-montjuïc', 'les-corts',
  'sarria-sant-gervasi', 'sarrià-sant-gervasi', 'gracia', 'gràcia',
  'horta-guinardo', 'nou-barris', 'sant-andreu', 'sant-marti', 'sant-martí',
  'extramurs', 'quatre-carreres', 'l-olivereta', 'poblats-maritims', 'campanar',
  'casco-antiguo', 'nervion', 'nervión', 'triana', 'norte', 'sur', 'este', 'oeste',
  'sureste', 'carretera-de-cadiz', 'carretera-de-cádiz', 'beiro', 'zaidin',
  'zaidín', 'chana', 'genil', 'albaicin', 'albaicín', 'casablanca', 'delicias',
  'abando', 'sant-agusti', 'sant-agustí', 'ponent', 'altell',
]);

const CAPITAL_BY_PROVINCE = {
  Madrid: 'Madrid',
  Barcelona: 'Barcelona',
  Valencia: 'Valencia',
  Sevilla: 'Sevilla',
  Málaga: 'Málaga',
  Granada: 'Granada',
  Murcia: 'Murcia',
  Zaragoza: 'Zaragoza',
  Córdoba: 'Córdoba',
  Bizkaia: 'Bilbao',
  'A Coruña': 'A Coruña',
  'Las Palmas': 'Las Palmas de Gran Canaria',
  'Santa Cruz de Tenerife': 'Santa Cruz de Tenerife',
  Alicante: 'Alicante',
  Cádiz: 'Cádiz',
  Baleares: 'Palma',
  Asturias: 'Oviedo',
  Navarra: 'Pamplona',
  Gipuzkoa: 'Donostia / San Sebastián',
  Álava: 'Vitoria-Gasteiz',
  Burgos: 'Burgos',
  León: 'León',
  Salamanca: 'Salamanca',
  Valladolid: 'Valladolid',
  Palencia: 'Palencia',
  Lugo: 'Lugo',
  Ourense: 'Ourense',
  Pontevedra: 'Pontevedra',
  Lleida: 'Lleida',
  Girona: 'Girona',
  Tarragona: 'Tarragona',
  Almería: 'Almería',
  Huelva: 'Huelva',
  Jaén: 'Jaén',
  Badajoz: 'Badajoz',
  Cáceres: 'Cáceres',
  Toledo: 'Toledo',
  'Ciudad Real': 'Ciudad Real',
  Cuenca: 'Cuenca',
  Guadalajara: 'Guadalajara',
  Albacete: 'Albacete',
  'La Rioja': 'Logroño',
  Cantabria: 'Santander',
  Huesca: 'Huesca',
  Teruel: 'Teruel',
  Soria: 'Soria',
  Zamora: 'Zamora',
  Ávila: 'Ávila',
  Segovia: 'Segovia',
  Castellón: 'Castellón de la Plana',
};

const CITY_CANON = {
  'valència': 'Valencia',
  'alicante (alacant)': 'Alicante',
  'el puerto de sta maría': 'El Puerto de Santa María',
  'el puerto de sta maria': 'El Puerto de Santa María',
  'orense': 'Ourense',
  'buenavista del nte.': 'Buenavista del Norte',
  'buenavista del nte': 'Buenavista del Norte',
  'las americas': 'Las Américas',
  'eivissa': 'Ibiza',
  'donostia / san sebastián': 'Donostia / San Sebastián',
  'san vicente de barakaldo': 'Barakaldo',
  'kurtzea': 'Galdakao',
  'moreaga': 'Sopela',
};

/** CP → municipio cuando la address no trae localidad (o trae isla / basura). */
const CITY_BY_CP = {
  '07010': 'Palma',
  '07800': 'Ibiza',
  '07181': 'Calvià',
  '07015': 'Palma',
  '11203': 'Algeciras',
  '35580': 'Yaiza',
  '36416': 'Vigo',
  '43530': 'Alcanar',
  '46370': 'Chiva',
  '04007': 'Almería',
  '09004': 'Burgos',
  '09007': 'Burgos',
  '09320': 'Villalba de Duero',
  '25005': 'Lleida',
  '27002': 'Lugo',
  '34002': 'Palencia',
  '38001': 'Santa Cruz de Tenerife',
  '38003': 'Santa Cruz de Tenerife',
  '29602': 'Marbella',
  '31195': 'Cizur',
  '35627': 'Pájara',
  '38434': 'La Guancha',
  '38650': 'Arona',
  '38670': 'Adeje',
  '46880': 'Bocairent',
  '07609': 'Llucmajor',
  '07819': 'Santa Eulària des Riu',
  '07850': 'Santa Eulària des Riu',
  '07813': 'Santa Eulària des Riu',
  '48460': 'Galdakao',
  '48600': 'Sopela',
  '48901': 'Barakaldo',
  '35489': 'Agaete',
  '35120': 'Mogán',
  '39600': 'Camargo',
};

function slug(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function looksGarbage(t) {
  if (!t) return true;
  const s = t.trim();
  if (s.length < 3) return true;
  if (/^[0-9]+$/.test(s)) return true;
  if (/^\d+o\d+a$/i.test(s)) return true;
  if (/^(nº|n°|no)\s*\d+$/i.test(s)) return true;
  if (/^(entresuelo|entreplanta|bajo|planta|local|piso|s\/n|lieu dit|ofic|prol)\b/i.test(s)) return true;
  if (/^(av\.|c\.|carr\.|calle|carrer|rue |chemin|rúa |carretera|cta\.|ctra\.)/i.test(s)) return true;
  if (/lacal/i.test(s)) return true;
  if (/^local(\s|$)/i.test(s)) return true;
  if (/^(mallorca|baleares|illes balears|lanzarote|canarias)$/i.test(s)) return true;
  return false;
}

function isDistrict(token, province) {
  const s = slug(token);
  if (!s) return false;
  if (s === 'ronda') return province === 'Granada';
  if (s === 'salamanca') return province === 'Madrid';
  if (s === 'jesus' || s === 'jesus') return false;
  return DISTRICTS.has(s);
}

function isProvinceAlias(token) {
  return PROVINCE_ALIASES.has(slug(token).replace(/-/g, ' ')) || PROVINCE_ALIASES.has(token.trim().toLowerCase());
}

function detectCountry(address, fallback) {
  if (!address) return fallback;
  const tail = address.match(/,\s*(Spain|España|France|Portugal|Andorra)\s*$/i);
  if (!tail) return fallback;
  const c = tail[1].toLowerCase();
  if (c === 'france') return 'Francia';
  if (c === 'portugal') return 'Portugal';
  if (c === 'andorra') return 'Andorra';
  return 'España';
}

function extractCp(address, country) {
  if (!address) return null;
  if (country === 'Andorra') {
    const m = address.match(/\bAD\d{3}\b/i);
    return m ? m[0].toUpperCase() : null;
  }
  if (country === 'Portugal') {
    const m = address.match(/\b(\d{4}-\d{3})\b/);
    return m ? m[1] : null;
  }
  const m = address.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

function tokensAfterCp(address, cp) {
  if (!address || !cp) return [];
  const idx = address.indexOf(cp);
  if (idx < 0) return [];
  const rest = address
    .slice(idx + cp.length)
    .replace(/,?\s*(Spain|España|France|Portugal|Andorra)\s*$/i, '');
  return rest
    .split(',')
    .map((p) => p.replace(/\s+/g, ' ').trim().replace(/^\d{5}\s+/, '').trim())
    .filter((p) => p && !/^\d{5}$/.test(p));
}

function canonicalizeCity(city) {
  if (!city) return city;
  const key = city.trim().toLowerCase();
  if (CITY_CANON[key]) return CITY_CANON[key];
  return city.trim();
}

function pickCity(tokens, province, cp) {
  if (CITY_BY_CP[cp]) return CITY_BY_CP[cp];

  const cleaned = [...tokens];
  while (cleaned.length && isProvinceAlias(cleaned[cleaned.length - 1])) cleaned.pop();

  for (const t of cleaned) {
    if (looksGarbage(t)) continue;
    if (isDistrict(t, province)) continue;
    return canonicalizeCity(t);
  }

  return CAPITAL_BY_PROVINCE[province] || null;
}

function propose(row) {
  const address = row.address || '';
  const country = detectCountry(address, row.country);
  const cp = extractCp(address, country) || row.postal_code || null;

  let province = row.province;
  let region = row.region;
  let city = row.city;

  if (country === 'España' && cp && /^\d{5}$/.test(cp)) {
    const mapped = ES_BY_PREFIX[cp.slice(0, 2)];
    if (mapped) {
      province = mapped[0];
      region = mapped[1];
    }
    const tokens = tokensAfterCp(address, cp);
    city = pickCity(tokens, province, cp) || city;
  } else if (country === 'Francia' && cp && /^\d{5}$/.test(cp)) {
    const mapped = FR_BY_PREFIX[cp.slice(0, 2)];
    if (mapped) {
      province = mapped[0];
      region = mapped[1];
    }
    const tokens = tokensAfterCp(address, cp);
    city = pickCity(tokens, province, cp) || city;
  } else if (country === 'Portugal' && cp) {
    const pref = cp.replace('-', '').slice(0, 2);
    const mapped = PT_BY_PREFIX[pref];
    if (mapped) {
      province = mapped[0];
      region = mapped[1];
    }
    const tokens = tokensAfterCp(address, cp);
    city = pickCity(tokens, province, cp) || city;
  } else if (country === 'Andorra') {
    province = 'Andorra';
    region = 'Andorra';
    city = 'Andorra la Vella';
  }

  city = canonicalizeCity(city);

  const next = {
    country,
    region,
    province,
    city,
    postal_code: cp || row.postal_code,
  };

  const changed = ['country', 'region', 'province', 'city', 'postal_code'].filter(
    (k) => (row[k] || '') !== (next[k] || ''),
  );
  return { next, changed };
}

function same(a, b) {
  return (a || '') === (b || '');
}

const { data, error } = await admin
  .from('centers')
  .select('id, name, city, province, region, country, postal_code, address, status')
  .order('country')
  .order('province')
  .order('name');

if (error) {
  console.error(error.message);
  process.exit(1);
}

const diffs = [];
for (const row of data) {
  const { next, changed } = propose(row);
  if (changed.length === 0) continue;
  diffs.push({
    id: row.id,
    name: row.name,
    status: row.status,
    from: {
      country: row.country,
      region: row.region,
      province: row.province,
      city: row.city,
      postal_code: row.postal_code,
    },
    to: next,
    changed,
    address: row.address,
  });
}

const byKind = {};
for (const d of diffs) {
  for (const k of d.changed) byKind[k] = (byKind[k] || 0) + 1;
}

console.log(`Centros leídos: ${data.length}`);
console.log(`A cambiar: ${diffs.length}`);
console.log('Campos:', byKind);
console.log('');

for (const d of diffs) {
  const bits = d.changed.map((k) => `${k}: ${d.from[k] || '∅'} → ${d.to[k] || '∅'}`).join(' | ');
  console.log(`- ${d.name}`);
  console.log(`  ${bits}`);
}

const weird = diffs.filter((d) =>
  d.changed.includes('city') && (
    /^\d/.test(d.to.city || '') ||
    looksGarbage(d.to.city) ||
    isDistrict(d.to.city, d.to.province)
  ),
);
if (weird.length) {
  console.log(`\n⚠️ Ciudades raras: ${weird.length}`);
  for (const d of weird) console.log(`  ${d.name}: ${d.to.city}`);
}

if (!execute) {
  console.log('\nDry-run. Para aplicar: node scripts/remap-center-geo.mjs --execute');
  process.exit(0);
}

let ok = 0;
let fail = 0;
for (const d of diffs) {
  const { error: upErr } = await admin.from('centers').update(d.to).eq('id', d.id);
  if (upErr) {
    fail += 1;
    console.error(`FAIL ${d.name}: ${upErr.message}`);
  } else {
    ok += 1;
  }
}
console.log(`\nActualizados ${ok}. Fallos ${fail}.`);
