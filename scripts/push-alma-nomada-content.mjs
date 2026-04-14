#!/usr/bin/env node
/**
 * Sincroniza en Supabase (proyecto de .env.local) el contenido de la ficha
 * Alma Nómada según el PDF 1ª edición. No es migración de esquema.
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias');
  process.exit(1);
}

const RETREAT_SLUG = 'alma-nomada-retiro-de-mujeres-en-marruecos-mayo-y-octubre-mnfr24i1';

/** Solo alinea EN + meta con ES y con `total_price` (no toca description_es ni el resto). */
const EN_PARITY = process.argv.includes('--en-parity');

const descriptionEnHtmlParity = `<h2>The origin</h2>
<p>Alma Nómada was born from the meeting of two kindred spirits and an experience that opened a portal of transformation. In a time of deep life transition, Morocco appeared as a mirror for the soul and a land of initiation. The silence of the Sahara, the vast dunes, and the ancestral energy of Marrakech awakened a deeper awareness. What began as an outer journey became an inner awakening.</p>
<h2>Our purpose</h2>
<p>To create a sacred, intimate, conscious space where you can quiet outer noise, hear your inner voice, and remember who you truly are.</p>
<p>This journey weaves together:</p>
<ul>
<li>Moroccan culture and tradition</li>
<li>Nature and stillness in the desert</li>
<li>Group Kundalini activation at sunset in the desert</li>
<li>Group sessions of deep energy clearing and prosperity activation after the activation to integrate the energy</li>
</ul>
<p>An outer journey that sparks an inner one—a shift from doing to being, and a homecoming within.</p>
<h2>Who is it for?</h2>
<p>Women in life transition, open to inner work. <strong>Maximum group size: 6.</strong> <strong>Shared rooms.</strong></p>
<h2>Practical notes</h2>
<ul>
<li>Tips, lunches, entrance fees, and flights are not included</li>
<li>Clothing: light comfortable daytime layers, a light jacket for evenings, hat or cap, sunscreen, and comfortable shoes for walking on dunes</li>
<li>Stay hydrated, avoid prolonged sun exposure, follow your guide's instructions in the desert, and protect yourself from temperature swings</li>
</ul>
<h2>More than a trip</h2>
<p>This is not just sightseeing in Morocco—it is a rite of passage, a conscious pause, and a space held with presence and love. If you feel the desert calling, maybe this experience is already calling you.</p>
<p>For questions or follow-up, contact the organizer from this listing on Retiru (booking or message).</p>`;

if (EN_PARITY) {
  const supabaseParity = createClient(url, key);
  const summaryEn =
    "Women's retreat in Morocco: from Marrakech to the Sahara desert. 7 days / 6 nights, max 6 guests, shared rooms. Sunset Kundalini, sunrise manifestation dance, deep energy-clearing session, and culture with a Spanish-speaking guide. €900.";
  const metaEs =
    'Retiro de mujeres en Marruecos: Marrakech, Atlas y Sahara. 7 días / 6 noches, máx. 6 plazas, habitaciones compartidas. Kundalini, limpieza energética y cultura. Desde 900 € en Retiru.';
  const metaEn =
    "Women's retreat in Morocco: Marrakech, Atlas & Sahara. 7 days / 6 nights, max 6 guests, shared rooms. Kundalini, energy work & culture. From €900 on Retiru.";
  const { data: updated, error: upErr } = await supabaseParity
    .from('retreats')
    .update({
      description_en: descriptionEnHtmlParity,
      summary_en: summaryEn,
      meta_description_es: metaEs,
      meta_description_en: metaEn,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', RETREAT_SLUG)
    .select('id, title_es');
  if (upErr) {
    console.error('retreats update (--en-parity):', upErr.message);
    process.exit(1);
  }
  if (!updated?.length) {
    console.error(`No hay retiro con slug: ${RETREAT_SLUG}`);
    process.exit(1);
  }
  console.log('✓ Paridad EN + meta (900 €) aplicada:', updated[0].title_es, `(${updated[0].id})`);
  process.exit(0);
}

const descriptionEs = `## El origen

Alma Nómada nace del encuentro entre dos almas amigas y una experiencia que abrió un portal de transformación. En un momento de profunda transición vital, Marruecos apareció como espejo del alma y territorio de iniciación. El silencio del Sahara, la inmensidad de las dunas y la energía ancestral de Marrakech despertaron una conciencia más profunda. Lo que comenzó como un viaje exterior se transformó en un despertar interior.

## Nuestro propósito

Crear un espacio sagrado, íntimo y consciente donde cada persona pueda detener el ruido externo, escuchar su voz interior y recordar quién es realmente.

Este viaje fusiona:
• Cultura y tradición marroquí
• Naturaleza y silencio del desierto
• Activación Kundalini al atardecer en el desierto
• Sesiones grupales de limpieza energética profunda y activación de prosperidad, tras la activación, para integrar la energía

Un viaje exterior que activa un viaje interior. Un tránsito entre el hacer y el ser. Un regreso a casa dentro de ti.

## ¿Para quién es?

Para mujeres en transición vital, abiertas a trabajo interior. **Grupo máximo 6 personas.** **Habitaciones compartidas.**

## Notas prácticas

• Propinas, almuerzos, entradas y vuelos no incluidos
• Ropa recomendable: prendas ligeras y cómodas de día, chaqueta ligera por la noche, gorra o sombrero, protector solar y calzado cómodo para caminar en las dunas
• Hidratación constante, evitar exposición prolongada al sol, seguir las indicaciones del guía en el desierto y protegerte ante cambios de temperatura

## Más que un viaje

No es solo un viaje turístico por Marruecos: es un rito de paso, una pausa consciente y un espacio sostenido con presencia y amor. Si sientes el llamado del desierto, quizá esta experiencia ya te está llamando.

Para dudas o seguimiento, contacta con el organizador desde esta ficha en Retiru (reserva o mensaje).`;

const descriptionEn = `## The origin

Alma Nómada was born from the meeting of two kindred spirits and an experience that opened a portal of transformation. In a time of deep life transition, Morocco appeared as a mirror for the soul and a land of initiation. The silence of the Sahara, the vast dunes, and the ancestral energy of Marrakech awakened a deeper awareness. What began as an outer journey became an inner awakening.

## Our purpose

To create a sacred, intimate, conscious space where you can quiet outer noise, hear your inner voice, and remember who you truly are.

This journey weaves together:
• Moroccan culture and tradition
• Nature and stillness in the desert
• Group Kundalini activation at sunset in the desert
• Group sessions of deep energy clearing and prosperity activation after the activation to integrate the energy

An outer journey that sparks an inner one—a shift from doing to being, and a homecoming within.

## Who is it for?

Women in life transition, open to inner work. **Maximum group size: 6.** **Shared rooms.**

## Practical notes

• Tips, lunches, entrance fees, and flights are not included
• Clothing: light comfortable daytime layers, a light jacket for evenings, hat or cap, sunscreen, and comfortable shoes for walking on dunes
• Stay hydrated, avoid prolonged sun exposure, follow your guide's instructions in the desert, and protect yourself from temperature swings

## More than a trip

This is not just sightseeing in Morocco—it is a rite of passage, a conscious pause, and a space held with presence and love. If you feel the desert calling, maybe this experience is already calling you.

For questions or follow-up, contact the organizer from this listing on Retiru (booking or message).`;

const schedule = [
  {
    day: 1,
    title_es: 'Bienvenidas a Marrakech',
    title_en: 'Welcome to Marrakech',
    items: [
      {
        time: '',
        title_es: 'Recepción en el aeropuerto y traslado privado al riad en el corazón de la Medina.',
        title_en: 'Airport welcome and private transfer to the riad in the heart of the Medina.',
      },
      {
        time: '',
        title_es: 'Primer contacto con Marruecos: aromas, sonidos de la llamada a la oración y callejuelas. Tiempo libre para descansar o explorar.',
        title_en: 'First contact with Morocco: scents, call to prayer, and alleys. Free time to rest or explore.',
      },
      {
        time: '',
        title_es: 'Alojamiento: Riad Jolie (o similar) — https://www.riad-jolie.com',
        title_en: 'Stay: Riad Jolie (or similar) — https://www.riad-jolie.com',
      },
    ],
  },
  {
    day: 2,
    title_es: 'La esencia de Marrakech',
    title_en: 'The essence of Marrakech',
    items: [
      {
        time: '',
        title_es:
          'Visita guiada con guía oficial de habla hispana por la Medina: Palacio Bahía, Madrasa Ben Youssef, mezquita Koutoubia, zocos y plaza Jemaa el-Fna.',
        title_en:
          'Guided tour with a Spanish-speaking official guide: Bahia Palace, Ben Youssef Madrasa, Koutoubia, souks, and Jemaa el-Fna.',
      },
      {
        time: '',
        title_es: 'Tarde libre: hammam, jardines o gastronomía local.',
        title_en: 'Free afternoon: hammam, gardens, or local food.',
      },
      {
        time: '',
        title_es: 'Alojamiento: Riad Jolie (o similar) — https://www.riad-jolie.com',
        title_en: 'Stay: Riad Jolie (or similar) — https://www.riad-jolie.com',
      },
    ],
  },
  {
    day: 3,
    title_es: 'Cruzando el Alto Atlas',
    title_en: 'Crossing the High Atlas',
    items: [
      {
        time: '',
        title_es: "Salida al sur por el puerto Tizi n'Tichka (2.260 m) con paradas panorámicas.",
        title_en: "Drive south via Tizi n'Tichka pass (2,260 m) with scenic stops.",
      },
      {
        time: '',
        title_es:
          'Visita a la Kasbah de Ait Ben Haddou (Patrimonio UNESCO). Continuación a Ouarzazate y Valle del Dadès. Cena tradicional.',
        title_en: 'Visit Ait Ben Haddou kasbah (UNESCO). Continue to Ouarzazate and Dadès Valley. Traditional dinner.',
      },
      {
        time: '',
        title_es: 'Alojamiento: Riad Tumast (o similar) — https://www.riadtumast.com',
        title_en: 'Stay: Riad Tumast (or similar) — https://www.riadtumast.com',
      },
    ],
  },
  {
    day: 4,
    title_es: 'Camino al desierto',
    title_en: 'On the way to the desert',
    items: [
      {
        time: '',
        title_es: 'Gargantas del Todra: cañón con paredes de hasta 300 m.',
        title_en: 'Todra Gorges: canyon walls up to 300 m.',
      },
      {
        time: '',
        title_es: 'Llegada a Merzouga y paseo en dromedario por Erg Chebbi al atardecer.',
        title_en: 'Arrival in Merzouga and camel ride on Erg Chebbi at sunset.',
      },
      {
        time: '',
        title_es: 'En el campamento: activación de Kundalini. Cena bereber y música bajo las estrellas.',
        title_en: 'At camp: Kundalini activation. Berber dinner and music under the stars.',
      },
      {
        time: '',
        title_es:
          'Alojamiento: Caravanserai Luxury Desert Camp (o similar) — https://caravanserai-luxurydesertcamp.com/en/gallery/',
        title_en:
          'Stay: Caravanserai Luxury Desert Camp (or similar) — https://caravanserai-luxurydesertcamp.com/en/gallery/',
      },
    ],
  },
  {
    day: 5,
    title_es: 'Inmersión en el Sahara',
    title_en: 'Immersion in the Sahara',
    items: [
      {
        time: '',
        title_es: 'Amanecer en las dunas y danza de la manifestación a través de los cuatro elementos.',
        title_en: 'Sunrise on the dunes and manifestation dance through the four elements.',
      },
      {
        time: '',
        title_es:
          'Desayuno y tour en 4x4 por el desierto con guía local: Khamlia, minas de kohl, oasis y asentamientos nómadas. Tiempo libre (quads o sandboarding opcionales).',
        title_en:
          'Breakfast and 4x4 desert tour with a local guide: Khamlia, kohl mines, oases, and nomad settlements. Free time (optional quads or sandboarding).',
      },
      {
        time: '',
        title_es:
          'Al atardecer: sesión grupal de limpieza energética profunda y activación de prosperidad para integrar la energía.',
        title_en: 'At sunset: group deep energy clearing and prosperity activation to integrate.',
      },
      {
        time: '',
        title_es: 'Alojamiento: Caravanserai Luxury Desert Camp (o similar).',
        title_en: 'Stay: Caravanserai Luxury Desert Camp (or similar).',
      },
    ],
  },
  {
    day: 6,
    title_es: 'Regreso transformador',
    title_en: 'The return journey',
    items: [
      {
        time: '',
        title_es:
          'Regreso a Marrakech atravesando oasis, montañas y desiertos rocosos, con paradas para descansar y almorzar.',
        title_en: 'Return to Marrakech through oases, mountains, and rocky desert, with stops to rest and lunch.',
      },
      {
        time: '',
        title_es: 'Llegada al riad por la tarde o noche. Alojamiento: Riad Jolie (o similar).',
        title_en: 'Arrival at the riad in the late afternoon or evening. Stay: Riad Jolie (or similar).',
      },
    ],
  },
  {
    day: 7,
    title_es: 'Hasta pronto, Marruecos',
    title_en: 'Farewell, Morocco',
    items: [
      {
        time: '',
        title_es: 'Desayuno en el riad. Tiempo libre según vuelo para compras o visitas.',
        title_en: 'Breakfast at the riad. Free time depending on your flight for shopping or visits.',
      },
      {
        time: '',
        title_es: 'Traslado privado al aeropuerto de Marrakech. Fin de la experiencia.',
        title_en: 'Private transfer to Marrakech airport. End of the experience.',
      },
    ],
  },
];

const supabase = createClient(url, key);

const { error: upDestErr } = await supabase.from('destinations').upsert(
  {
    name_es: 'Marruecos',
    name_en: 'Morocco',
    slug: 'marruecos',
    country: 'MA',
    region: 'Marrakech, Alto Atlas y Sahara',
    latitude: 31.6295,
    longitude: -7.9811,
    sort_order: 50,
  },
  { onConflict: 'slug' }
);
if (upDestErr) {
  console.error('destinations upsert:', upDestErr.message);
  process.exit(1);
}

const { data: destRow, error: selDestErr } = await supabase
  .from('destinations')
  .select('id')
  .eq('slug', 'marruecos')
  .single();
if (selDestErr || !destRow) {
  console.error('No se pudo leer destino marruecos:', selDestErr?.message);
  process.exit(1);
}

const payload = {
  destination_id: destRow.id,
  address: null,
  summary_es:
    'Retiro de mujeres en Marruecos: de Marrakech al desierto del Sahara. 7 días / 6 noches, grupo máximo 6, habitaciones compartidas. Kundalini al atardecer, danza de la manifestación al amanecer, sesión de limpieza energética y cultura con guía hispanohablante. 900 €.',
  summary_en:
    "Women's retreat in Morocco: from Marrakech to the Sahara desert. 7 days / 6 nights, max 6 guests, shared rooms. Sunset Kundalini, sunrise manifestation dance, deep energy-clearing session, and culture with a Spanish-speaking guide. €900.",
  description_es: descriptionEs,
  description_en: descriptionEn,
  includes_es: [
    'Transporte privado exclusivo para el grupo (aire acondicionado, combustible y recogidas en aeropuerto)',
    'Guía local oficial en Marrakech (habla hispana)',
    '6 noches en alojamientos con encanto (habitaciones compartidas)',
    'Todos los desayunos incluidos',
    'Media pensión en Valle del Dadès y campamento del desierto (cena y desayuno)',
    'Paseo en dromedario por las dunas de Erg Chebbi',
    'Activación grupal de Kundalini al atardecer en el desierto',
    'Sesión grupal de limpieza energética profunda y activación de prosperidad',
    'Visita cultural guiada en Marrakech',
    'Recomendaciones de seguridad y salud para el desierto',
  ],
  includes_en: [
    'Private group transport (A/C, fuel, and airport transfers)',
    'Official local guide in Marrakech (Spanish-speaking)',
    '6 nights in charming accommodation (shared rooms)',
    'All breakfasts included',
    'Half board in Dadès Valley and desert camp (dinner and breakfast)',
    'Camel ride on the Erg Chebbi dunes',
    'Group Kundalini activation at sunset in the desert',
    'Group deep energy clearing and prosperity activation session',
    'Guided cultural visit in Marrakech',
    'Safety and health recommendations for the desert',
  ],
  excludes_es: [
    'Vuelos internacionales',
    'Almuerzos',
    '3 cenas en Marrakech',
    'Entradas a monumentos',
    'Hammam opcional',
    'Propinas',
    'Seguro de viaje (opcional y personal)',
  ],
  excludes_en: [
    'International flights',
    'Lunches',
    '3 dinners in Marrakech',
    'Monument entrance fees',
    'Optional hammam',
    'Tips',
    'Travel insurance (optional, personal)',
  ],
  meta_description_es:
    'Retiro de mujeres en Marruecos: Marrakech, Atlas y Sahara. 7 días / 6 noches, máx. 6 plazas, habitaciones compartidas. Kundalini, limpieza energética y cultura. Desde 900 € en Retiru.',
  meta_description_en:
    "Women's retreat in Morocco: Marrakech, Atlas & Sahara. 7 days / 6 nights, max 6 guests, shared rooms. Kundalini, energy work & culture. From €900 on Retiru.",
  schedule,
  updated_at: new Date().toISOString(),
};

const { data: updated, error: upRetErr } = await supabase
  .from('retreats')
  .update(payload)
  .eq('slug', RETREAT_SLUG)
  .select('id, title_es');

if (upRetErr) {
  console.error('retreats update:', upRetErr.message);
  process.exit(1);
}
if (!updated?.length) {
  console.error(`No hay retiro con slug: ${RETREAT_SLUG}`);
  process.exit(1);
}

console.log('✓ Contenido actualizado:', updated[0].title_es, `(${updated[0].id})`);
