#!/usr/bin/env node
/**
 * Barrido Places → yoga / meditación / ayurveda en una provincia.
 * Dedupe por google_place_id. Fuera gyms, fisios, tiendas, pilates-only.
 *
 *   node scripts/import-places-province.mjs --province Alicante
 *   node scripts/import-places-province.mjs --province Almería --execute
 *   node scripts/import-places-province.mjs --province Albacete --execute
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
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error('Falta GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const pIdx = args.indexOf('--province');
const PROVINCE = pIdx !== -1 ? args[pIdx + 1] : null;
const EXECUTE = args.includes('--execute');

const PROVINCES = {
  Alicante: {
    cp: '03',
    region: 'Comunidad Valenciana',
    towns: [
      'Alicante', 'Elche', 'Elx', 'Torrevieja', 'Orihuela', 'Pilar de la Horadada',
      'San Miguel de Salinas', 'Almoradí', 'Rojales', 'Guardamar del Segura',
      'Callosa de Segura', 'Cox', 'Granja de Rocamora', 'Redován', 'Benferri',
      'Albatera', 'Catral', 'Dolores', 'San Fulgencio', 'Benejúzar', 'Bigastro',
      'Rafal', 'Formentera del Segura', 'Benijófar', 'Jacarilla',
      'Santa Pola', 'Crevillent', 'Aspe', 'Novelda', 'Monforte del Cid',
      'Elda', 'Petrer', 'Sax', 'Villena', 'Biar', 'Banyeres de Mariola',
      'Onil', 'Castalla', 'Ibi', 'Jijona', 'Xixona', 'San Vicente del Raspeig',
      'Sant Joan d\'Alacant', 'Mutxamel', 'El Campello', 'Agost',
      'Benidorm', 'Villajoyosa', 'La Vila Joiosa', 'Finestrat', 'l\'Alfàs del Pi',
      'Altea', 'Calpe', 'Calp', 'Benissa', 'Teulada', 'Moraira',
      'Dénia', 'Jávea', 'Xàbia', 'Pedreguer', 'Gata de Gorgos', 'Ondara',
      'Pego', 'Orba', 'El Verger', 'Els Poblets',
      'Alcoy', 'Alcoi', 'Cocentaina', 'Muro de Alcoy', 'Ibi',
      'Pinoso', 'Monóvar', 'La Romana', 'Hondón de las Nieves',
      'La Nucía', 'Polop', 'Callosa d\'en Sarrià',
    ],
  },
  'Almería': {
    cp: '04',
    region: 'Andalucía',
    towns: [
      'Almería', 'Huércal de Almería', 'Viator', 'Benahadux', 'Gádor',
      'Roquetas de Mar', 'Vícar', 'El Ejido', 'La Mojonera', 'Adra', 'Berja',
      'Dalías', 'Felix', 'Enix',
      'Níjar', 'Carboneras', 'Sorbas', 'Tabernas',
      'Vera', 'Garrucha', 'Mojácar', 'Turre', 'Los Gallardos', 'Antas',
      'Cuevas del Almanzora', 'Pulpí', 'Huércal-Overa',
      'Albox', 'Arboleas', 'Zurgena', 'Taberno', 'Cantoria', 'Oria',
      'Olula del Río', 'Macael', 'Fines',
      'Vélez-Rubio', 'Vélez-Blanco', 'María', 'Chirivel',
      'Tíjola', 'Serón', 'Purchena', 'Alhama de Almería',
      'Laujar de Andarax', 'Canjáyar', 'Fiñana',
    ],
  },
  Albacete: {
    cp: '02',
    region: 'Castilla-La Mancha',
    towns: [
      'Albacete', 'Hellín', 'Almansa', 'Villarrobledo', 'La Roda',
      'Caudete', 'Tobarra', 'Casas-Ibáñez', 'Madrigueras', 'Tarazona de la Mancha',
      'La Gineta', 'Chinchilla de Monte-Aragón', 'Pozo Cañada', 'Balazote',
      'Elche de la Sierra', 'Yeste', 'Alcaraz', 'Munera',
      'Montealegre del Castillo', 'Alpera', 'Bonete', 'Higueruela',
      'Ontur', 'Albatana', 'Fuente-Álamo', 'Socovos', 'Liétor',
      'Aýna', 'Peñas de San Pedro', 'Pozohondo', 'San Pedro',
    ],
  },
};

if (!PROVINCE || !PROVINCES[PROVINCE]) {
  console.error('Usa --province Alicante | Almería | Albacete');
  process.exit(1);
}

const META = PROVINCES[PROVINCE];
const TERMS = ['yoga', 'meditación', 'ayurveda'];
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.rating,places.userRatingCount,places.addressComponents';

const REJECT_TYPE = new Set([
  'gym', 'fitness_center', 'physiotherapist', 'doctor', 'hospital', 'dentist',
  'clothing_store', 'store', 'shopping_mall', 'supermarket', 'pharmacy',
  'preschool', 'primary_school', 'secondary_school', 'child_care_agency',
  'hair_care', 'barber_shop', 'plumber', 'electrician', 'car_repair',
  'lodging', 'hotel', 'restaurant', 'cafe', 'bar',
]);
const REJECT_NAME =
  /\b(fisio|fisioterap|quiromasaj|gimnasio|\bgym\b|crossfit|pádel|padel|tenis|guarder[ií]a|peluquer|tienda de|entrenamiento personal|personal trainer|boxeo|kickboxing|spinning)\b/i;
const PILATES_ONLY = /\bpilates\b/i;
const HAS_YOGA = /\b(yoga|yogui|yogin|shala|ashtanga|kundalini|vinyasa|iyengar|yin yoga|bikram|jivamukti)\b/i;
const HAS_MED = /\b(meditaci[oó]n|meditation|mindfulness|vipassana|kadampa|dharma|zen\b|soto zen|gnosis)\b/i;
const HAS_AYU = /\bayurved/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function placeId(p) {
  const id = p.id || '';
  return id.startsWith('places/') ? id.slice(7) : id;
}

function cpOf(p) {
  const comps = p.addressComponents || [];
  const postal = comps.find((c) => (c.types || []).includes('postal_code'));
  const fromComp = postal?.longText || postal?.shortText || '';
  if (/^\d{5}$/.test(fromComp)) return fromComp;
  const m = String(p.formattedAddress || '').match(/\b(\d{5})\b/);
  return m ? m[1] : '';
}

function cityOf(p, fallbackTown) {
  const comps = p.addressComponents || [];
  const loc = comps.find((c) => (c.types || []).includes('locality'));
  if (loc?.longText) return loc.longText;
  const addr = p.formattedAddress || '';
  const m = addr.match(/\b\d{5}\s+([^,]+)/);
  if (m) return m[1].trim();
  return fallbackTown;
}

function classify(p) {
  const name = p.displayName?.text || '';
  const types = p.types || [];
  const primary = p.primaryType || '';
  const blob = `${name} ${types.join(' ')} ${primary}`;

  if (REJECT_NAME.test(name)) return null;
  if (REJECT_TYPE.has(primary) && !HAS_YOGA.test(name) && !HAS_MED.test(name) && !HAS_AYU.test(name)) {
    return null;
  }
  if (types.some((t) => REJECT_TYPE.has(t)) && !HAS_YOGA.test(blob) && !HAS_MED.test(blob) && !HAS_AYU.test(blob)) {
    return null;
  }
  if (PILATES_ONLY.test(name) && !HAS_YOGA.test(name) && !HAS_MED.test(name) && !HAS_AYU.test(name)) {
    return null;
  }
  if (HAS_AYU.test(blob)) return 'ayurveda';
  if (HAS_MED.test(blob) && !HAS_YOGA.test(name)) return 'meditation';
  if (HAS_YOGA.test(blob) || types.includes('yoga_studio') || primary === 'yoga_studio') return 'yoga';
  return null;
}

async function searchText(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'es',
      regionCode: 'ES',
      pageSize: 10,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Places ${res.status} ${query}: ${body.slice(0, 160)}`);
  }
  const data = await res.json();
  return data.places || [];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: existing, error: exErr } = await supabase
  .from('centers')
  .select('id, google_place_id, slug, name, city');
if (exErr) {
  console.error(exErr.message);
  process.exit(1);
}

const knownIds = new Set((existing || []).map((c) => c.google_place_id).filter(Boolean));
const usedSlugs = new Set((existing || []).map((c) => c.slug).filter(Boolean));

const found = new Map();
const towns = [...new Set(META.towns)];
let queries = 0;

console.log(`\n═══ Places · ${PROVINCE} · ${towns.length} municipios × ${TERMS.length} ═══\n`);

for (const town of towns) {
  for (const term of TERMS) {
    const q = `${term} ${town}`;
    queries++;
    process.stdout.write(`  [${queries}] ${q}… `);
    try {
      const places = await searchText(q);
      let kept = 0;
      for (const p of places) {
        const pid = placeId(p);
        if (!pid || found.has(pid) || knownIds.has(pid)) continue;
        const cp = cpOf(p);
        if (cp && !cp.startsWith(META.cp)) continue;
        const addr = `${p.formattedAddress || ''} ${(p.addressComponents || []).map((c) => c.longText).join(' ')}`;
        const provRe =
          PROVINCE === 'Alicante'
            ? /Alicante|Alacant/i
            : PROVINCE === 'Almería'
              ? /Almer[ií]a/i
              : /Albacete/i;
        if (!cp && !provRe.test(addr)) continue;
        const type = classify(p);
        if (!type) continue;
        const name = p.displayName?.text || '';
        if (!name) continue;
        found.set(pid, {
          google_place_id: pid,
          name,
          type,
          city: cityOf(p, town),
          address: p.formattedAddress || null,
          postal_code: cp || null,
          latitude: p.location?.latitude ?? null,
          longitude: p.location?.longitude ?? null,
          website: p.websiteUri || null,
          phone: p.nationalPhoneNumber || null,
          google_maps_url: p.googleMapsUri || null,
          google_types: (p.types || []).join(', ') || null,
          avg_rating: p.rating ?? null,
          review_count: p.userRatingCount ?? 0,
        });
        kept++;
      }
      console.log(`${places.length} → +${kept}`);
    } catch (e) {
      console.log(`✗ ${e.message}`);
      await sleep(1500);
    }
    await sleep(120);
  }
}

const rows = [...found.values()];
const byType = rows.reduce((acc, r) => {
  acc[r.type] = (acc[r.type] || 0) + 1;
  return acc;
}, {});

console.log(`\nCandidatos nuevos: ${rows.length}`, byType);
for (const r of rows.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))) {
  console.log(`  · ${r.city} · ${r.type} · ${r.name}`);
}

if (!EXECUTE) {
  console.log('\nDry-run. Relanza con --execute para insertar.');
  process.exit(0);
}

function uniqueSlug(name, city) {
  let base = slugify(`${name}-${city}`) || slugify(name) || 'centro';
  let s = base;
  let i = 2;
  while (usedSlugs.has(s)) {
    s = `${base}-${i++}`;
  }
  usedSlugs.add(s);
  return s;
}

const now = new Date().toISOString();
const payload = rows.map((r) => ({
  name: r.name,
  slug: uniqueSlug(r.name, r.city),
  type: r.type,
  city: r.city,
  province: PROVINCE,
  region: META.region,
  country: 'España',
  address: r.address,
  postal_code: r.postal_code,
  latitude: r.latitude,
  longitude: r.longitude,
  website: r.website,
  phone: r.phone,
  google_place_id: r.google_place_id,
  google_maps_url: r.google_maps_url,
  google_types: r.google_types,
  avg_rating: r.avg_rating,
  review_count: r.review_count,
  status: 'active',
  plan: 'basic',
  description_es: `Centro de ${r.type === 'meditation' ? 'meditación' : r.type} en ${r.city} (${PROVINCE}).`,
  search_terms: `import-places-${slugify(PROVINCE)}-2026-08`,
  created_at: now,
  updated_at: now,
}));

let inserted = 0;
for (let i = 0; i < payload.length; i += 40) {
  const batch = payload.slice(i, i + 40);
  const { error } = await supabase.from('centers').insert(batch);
  if (error) {
    console.error(`Insert batch ${i}: ${error.message}`);
  } else {
    inserted += batch.length;
  }
}
console.log(`\nInsertados ${inserted} / ${payload.length} en ${PROVINCE}.`);
