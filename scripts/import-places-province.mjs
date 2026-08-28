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
const RAW_PROVINCE = pIdx !== -1 ? args[pIdx + 1] : null;
const PROVINCE_ALIAS = { Jaen: 'Jaén', Almeria: 'Almería', Malaga: 'Málaga' };
const PROVINCE = PROVINCE_ALIAS[RAW_PROVINCE] || RAW_PROVINCE;
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
  Valencia: {
    cp: '46',
    region: 'Comunidad Valenciana',
    nameRe: /Valencia|València/i,
    towns: [
      'Valencia', 'València', 'Torrent', 'Paterna', 'Mislata', 'Xirivella', 'Aldaia',
      'Quart de Poblet', 'Manises', 'Burjassot', 'Godella', 'Rocafort',
      'La Pobla de Vallbona', 'l\'Eliana', 'Riba-roja de Túria', 'Bétera', 'Llíria',
      'Puçol', 'El Puig', 'Massamagrell', 'Meliana', 'Alboraia', 'Alboraya',
      'Tavernes Blanques', 'Almàssera', 'Foios',
      'Paiporta', 'Picanya', 'Benetússer', 'Sedaví', 'Alfafar', 'Massanassa',
      'Catarroja', 'Silla', 'Albal', 'Picassent', 'Alcàsser', 'Beniparrell',
      'Sagunto', 'Sagunt', 'Canet d\'En Berenguer', 'Puçol',
      'Gandia', 'Oliva', 'Tavernes de la Valldigna', 'Xeraco', 'Xeresa',
      'Bellreguard', 'Daimús', 'Piles', 'Guardamar de la Safor', 'Miramar',
      'Cullera', 'Sueca', 'Sollana', 'Albalat de la Ribera', 'Riola',
      'Alzira', 'Algemesí', 'Carcaixent', 'Alginet', 'Carlet', 'l\'Alcúdia',
      'Alberic', 'Benifaió', 'Almussafes', 'Castelló de la Ribera',
      'Xàtiva', 'Canals', 'l\'Olleria', 'Albaida', 'Ontinyent', 'Bocairent',
      'Agullent', 'Montaverner', 'Benigànim', 'Villalonga',
      'Requena', 'Utiel', 'Chiva', 'Buñol', 'Cheste', 'Siete Aguas',
      'Turís', 'Godelleta', 'Monserrat', 'Montserrat',
    ],
  },
  Granada: {
    cp: '18',
    region: 'Andalucía',
    nameRe: /Granada/i,
    towns: [
      'Granada', 'Armilla', 'Maracena', 'Albolote', 'Atarfe', 'Peligros',
      'Pulianas', 'Jun', 'Huétor Vega', 'Cenes de la Vega', 'Monachil',
      'La Zubia', 'Ogíjares', 'Gójar', 'Dílar', 'Cájar', 'Huétor Vega',
      'Churriana de la Vega', 'Las Gabias', 'Cúllar Vega', 'Vegas del Genil',
      'Alhendín', 'Otura', 'Villa de Otura', 'Padul', 'Dúrcal',
      'Santa Fe', 'Chauchina', 'Fuente Vaqueros', 'Pinos Puente', 'Íllora',
      'Loja', 'Alhama de Granada', 'Montefrío',
      'Motril', 'Salobreña', 'Almuñécar', 'Vélez de Benaudalla',
      'Lanjarón', 'Órgiva', 'Cádiar', 'Ugíjar', 'Trevélez',
      'Guadix', 'Baza', 'Huéscar', 'Puebla de Don Fadrique', 'Cúllar',
      'Caniles', 'Benamaurel', 'Freila', 'Zújar',
    ],
  },
  'Málaga': {
    cp: '29',
    region: 'Andalucía',
    nameRe: /Málaga|Malaga/i,
    towns: [
      'Málaga', 'Malaga', 'Torremolinos', 'Benalmádena', 'Fuengirola', 'Mijas',
      'Marbella', 'San Pedro Alcántara', 'Estepona', 'Manilva', 'Casares',
      'Benahavís', 'Ojén', 'Istán',
      'Rincón de la Victoria', 'Vélez-Málaga', 'Torre del Mar', 'Torrox',
      'Nerja', 'Frigiliana', 'Cómpeta', 'Sayalonga', 'Algarrobo',
      'Alhaurín de la Torre', 'Alhaurín el Grande', 'Cártama', 'Pizarra',
      'Álora', 'Coín', 'Guaro', 'Monda', 'Tolox', 'Yunquera',
      'Antequera', 'Archidona', 'Campillos', 'Mollina', 'Humilladero',
      'Fuente de Piedra', 'Sierra de Yeguas', 'Teba', 'Ardales',
      'Villanueva del Rosario', 'Villanueva del Trabuco', 'Villanueva de Algaidas',
      'Ronda', 'Arriate', 'Montejaque', 'Benaoján', 'Cortes de la Frontera',
      'Gaucín', 'El Burgo', 'Cañete la Real',
    ],
  },
  'Jaén': {
    cp: '23',
    region: 'Andalucía',
    nameRe: /Jaén|Jaen/i,
    towns: [
      'Jaén', 'Linares', 'Andújar', 'Úbeda', 'Baeza', 'Martos',
      'Alcalá la Real', 'Torredelcampo', 'Torredonjimeno', 'Mancha Real',
      'Mengíbar', 'Bailén', 'La Carolina', 'Jódar', 'Huelma',
      'Villacarrillo', 'Villanueva del Arzobispo', 'Cazorla', 'Quesada',
      'Peal de Becerro', 'Sabiote', 'Torreperogil', 'Beas de Segura',
      'Segura de la Sierra', 'Orcera', 'Siles', 'Santisteban del Puerto',
      'Alcaudete', 'Porcuna', 'Marmolejo', 'Arjona', 'Arjonilla',
      'Jamilena', 'Fuensanta de Martos', 'Los Villares', 'Valdepeñas de Jaén',
    ],
  },
  'Ciudad Real': {
    cp: '13',
    region: 'Castilla-La Mancha',
    nameRe: /Ciudad Real/i,
    towns: [
      'Ciudad Real', 'Miguelturra', 'Puertollano', 'Tomelloso', 'Alcázar de San Juan',
      'Valdepeñas', 'Manzanares', 'Daimiel', 'Socuéllamos', 'La Solana',
      'Campo de Criptana', 'Herencia', 'Pedro Muñoz', 'Bolaños de Calatrava',
      'Almagro', 'Villarrubia de los Ojos', 'Malagón', 'Porzuna',
      'Piedrabuena', 'Almodóvar del Campo', 'Argamasilla de Calatrava',
      'Moral de Calatrava', 'Santa Cruz de Mudela', 'Viso del Marqués',
      'Almadén', 'Villanueva de los Infantes', 'Montiel', 'Ruidera',
      'Argamasilla de Alba', 'Membrilla', 'Villanueva de los Infantes',
    ],
  },
  Cuenca: {
    cp: '16',
    region: 'Castilla-La Mancha',
    nameRe: /Cuenca/i,
    towns: [
      'Cuenca', 'Tarancón', 'Quintanar del Rey', 'Motilla del Palancar',
      'San Clemente', 'Las Pedroñeras', 'Mota del Cuervo', 'Horcajo de Santiago',
      'Villanueva de la Jara', 'Iniesta', 'Minglanilla', 'Landete',
      'Cañete', 'Priego', 'Huete', 'Sacedón', 'Belmonte',
      'Villalba del Rey', 'Casasimarro', 'El Provencio', 'Casas de Fernando Alonso',
      'Villanueva de los Escuderos', 'Alarcón', 'Valverde de Júcar',
    ],
  },
  Madrid: {
    cp: '28',
    region: 'Comunidad de Madrid',
    nameRe: /Madrid/i,
    towns: [
      'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés',
      'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas',
      'Las Rozas', 'San Sebastián de los Reyes', 'Pozuelo de Alarcón',
      'Coslada', 'Rivas-Vaciamadrid', 'Valdemoro', 'Majadahonda',
      'Collado Villalba', 'Arganda del Rey', 'Boadilla del Monte', 'Pinto',
      'Colmenar Viejo', 'Tres Cantos', 'San Fernando de Henares',
      'Mejorada del Campo', 'Velilla de San Antonio', 'Torrelodones',
      'Galapagar', 'El Escorial', 'San Lorenzo de El Escorial',
      'Villanueva de la Cañada', 'Villanueva del Pardillo', 'Brunete',
      'Navalcarnero', 'Arroyomolinos', 'Humanes de Madrid', 'Griñón',
      'Ciempozuelos', 'San Martín de la Vega', 'Aranjuez',
      'Algete', 'San Agustín del Guadalix', 'Colmenar Viejo',
      'Soto del Real', 'Manzanares el Real', 'Miraflores de la Sierra',
      'Guadarrama', 'Cercedilla', 'Navacerrada', 'Moralzarzal',
      'Hoyo de Manzanares', 'Colmenarejo', 'Valdemorillo',
      'Villaviciosa de Odón', 'Sevilla la Nueva', 'El Álamo',
      'Morata de Tajuña', 'Chinchón', 'Villarejo de Salvanés',
      'Loeches', 'Daganzo de Arriba', 'Ajalvir', 'Paracuellos de Jarama',
      'Fuente el Saz de Jarama', 'Talamanca de Jarama', 'El Molar',
      'Buitrago del Lozoya', 'Torrelaguna', 'Rascafría',
    ],
  },
  Barcelona: {
    cp: '08',
    region: 'Cataluña',
    nameRe: /Barcelona/i,
    towns: [
      'Barcelona', 'L\'Hospitalet de Llobregat', 'Hospitalet', 'Badalona',
      'Terrassa', 'Sabadell', 'Mataró', 'Santa Coloma de Gramenet',
      'Cornellà de Llobregat', 'Sant Cugat del Vallès', 'Sant Boi de Llobregat',
      'El Prat de Llobregat', 'Castelldefels', 'Viladecans', 'Rubí',
      'Cerdanyola del Vallès', 'Granollers', 'Vilanova i la Geltrú',
      'Manresa', 'Vic', 'Igualada', 'Vilafranca del Penedès',
      'Sitges', 'Gavà', 'Esplugues de Llobregat', 'Sant Feliu de Llobregat',
      'Sant Joan Despí', 'Mollet del Vallès', 'Barberà del Vallès',
      'Ripollet', 'Montcada i Reixac', 'Sant Adrià de Besòs',
      'El Masnou', 'Premià de Mar', 'Vilassar de Mar', 'Premià de Dalt',
      'Arenys de Mar', 'Canet de Mar', 'Calella', 'Pineda de Mar',
      'Malgrat de Mar', 'Tordera', 'Cardedeu', 'La Roca del Vallès',
      'Les Franqueses del Vallès', 'La Garriga', 'Granollers',
      'Parets del Vallès', 'Lliçà d\'Amunt', 'Mollet del Vallès',
      'Sant Quirze del Vallès', 'Castellar del Vallès',
      'Martorell', 'Abrera', 'Olesa de Montserrat', 'Esparreguera',
      'Sant Vicenç dels Horts', 'Molins de Rei', 'Sant Just Desvern',
      'Sant Pere de Ribes', 'Cubelles', 'Canyelles', 'Olivella',
      'Berga', 'Manlleu', 'Torelló', 'Roda de Ter', 'Prats de Lluçanès',
      'Sant Sadurní d\'Anoia', 'Gelida', 'Subirats',
    ],
  },
};

if (!PROVINCE || !PROVINCES[PROVINCE]) {
  console.error('Usa --province ' + Object.keys(PROVINCES).join(' | '));
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
          META.nameRe ||
          (PROVINCE === 'Alicante'
            ? /Alicante|Alacant/i
            : PROVINCE === 'Almería'
              ? /Almer[ií]a/i
              : new RegExp(PROVINCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
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
