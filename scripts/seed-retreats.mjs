#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('No .env.local'); process.exit(1); }
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

/* ── helpers ── */
async function getCat(slug) {
  const { data } = await supabase.from('categories').select('id').eq('slug', slug).single();
  return data?.id;
}
async function getDest(slug) {
  const { data } = await supabase.from('destinations').select('id').eq('slug', slug).single();
  return data?.id;
}

/* ── 1. usuario demo organizador ── */
const demoUserId = '00000000-0000-0000-0000-000000000001';
const demoOrgId  = '00000000-0000-0000-0000-000000000010';

// Crear usuario en auth.users vía admin API
const { data: existingUser } = await supabase.auth.admin.getUserById(demoUserId);
if (!existingUser?.user) {
  const { error: userErr } = await supabase.auth.admin.createUser({
    id: demoUserId,
    email: 'demo-organizer@retiru.com',
    password: 'DemoPass123!',
    email_confirm: true,
    user_metadata: { full_name: 'Retiru Demo Organizer' },
  });
  if (userErr) console.error('Error creando usuario demo:', userErr.message);
  else console.log('✓ Usuario demo creado');
} else {
  console.log('✓ Usuario demo ya existe');
}

// Perfil
const { error: profErr } = await supabase.from('profiles').upsert({
  id: demoUserId,
  email: 'demo-organizer@retiru.com',
  full_name: 'Retiru Demo Organizer',
  role: 'organizer',
  preferred_locale: 'es',
}, { onConflict: 'id' });
if (profErr) console.error('Error perfil:', profErr.message);
else console.log('✓ Perfil creado/actualizado');

// Roles (tabla user_roles)
for (const role of ['attendee', 'organizer']) {
  await supabase.from('user_roles').upsert(
    { user_id: demoUserId, role },
    { onConflict: 'user_id,role' },
  );
}
console.log('✓ Roles asignados (attendee + organizer)');

// Organizador
const { error: orgErr } = await supabase.from('organizer_profiles').upsert({
  id: demoOrgId,
  user_id: demoUserId,
  business_name: 'Retiru Experiences',
  slug: 'retiru-experiences',
  description_es: 'Organizador de retiros y experiencias de bienestar en los mejores destinos de España.',
  description_en: 'Retreat organizer and wellness experiences in the best destinations in Spain.',
  location: 'España',
  languages: ['es', 'en'],
  status: 'verified',
  verified_at: new Date().toISOString(),
  avg_rating: 4.8,
  review_count: 42,
}, { onConflict: 'id' });
if (orgErr) console.error('Error organizador:', orgErr.message);
else console.log('✓ Organizador creado/actualizado');

/* ── 2. Retiros ── */
const retreats = [
  {
    title_es: 'Retiro de Yoga y Meditación frente al Mar',
    title_en: 'Yoga & Meditation Retreat by the Sea',
    slug: 'yoga-meditacion-ibiza-verano-2026',
    summary_es: '6 días de yoga, meditación y conexión con la naturaleza en la costa norte de Ibiza.',
    summary_en: '6 days of yoga, meditation and nature connection on the north coast of Ibiza.',
    description_es: 'Sumérgete en una experiencia transformadora en una finca tradicional ibicenca rodeada de pinos y vistas al Mediterráneo. Cada día incluye dos sesiones de yoga (Hatha y Vinyasa), meditación guiada al amanecer, talleres de pranayama y tiempo libre para explorar calas secretas. La alimentación es 100% ecológica y vegetariana, preparada por un chef especializado en cocina consciente.',
    description_en: 'Immerse yourself in a transformative experience at a traditional Ibicencan finca surrounded by pines and Mediterranean views. Each day includes two yoga sessions (Hatha and Vinyasa), guided sunrise meditation, pranayama workshops and free time to explore secret coves.',
    includes_es: ['Alojamiento 5 noches','Pensión completa ecológica','2 sesiones yoga/día','Meditación guiada','Material de yoga','Transfer aeropuerto'],
    includes_en: ['5 nights accommodation','Full board organic meals','2 yoga sessions/day','Guided meditation','Yoga equipment','Airport transfer'],
    dest: 'ibiza', address: 'Finca Can Lluc, Sant Llorenç de Balàfia',
    start_date: '2026-06-15', end_date: '2026-06-20', max_attendees: 16, confirmed_bookings: 13,
    total_price: 790, languages: ['es','en'], avg_rating: 4.9, review_count: 23,
    cats: ['yoga', 'meditacion'],
    images: [
      { url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80', alt: 'Yoga frente al mar en Ibiza', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', alt: 'Meditación al amanecer', is_cover: false },
    ],
  },
  {
    title_es: 'Retiro Detox & Wellness en la Sierra de Tramuntana',
    title_en: 'Detox & Wellness Retreat in Sierra de Tramuntana',
    slug: 'detox-wellness-mallorca-julio-2026',
    summary_es: '7 días de desintoxicación integral con yoga, nutrición consciente y naturaleza en Mallorca.',
    summary_en: '7 days of integral detox with yoga, conscious nutrition and nature in Mallorca.',
    description_es: 'Un retiro diseñado para resetear cuerpo y mente en plena Sierra de Tramuntana. Incluye ayuno intermitente guiado, zumos cold press, sesiones de yoga restaurativo, caminatas por la montaña, tratamientos de spa y talleres de alimentación saludable. El alojamiento es en una masía del siglo XVIII restaurada con piscina infinita y vistas al valle.',
    description_en: 'A retreat designed to reset body and mind in the heart of Sierra de Tramuntana. Includes guided intermittent fasting, cold press juices, restorative yoga, mountain walks, spa treatments and healthy eating workshops.',
    includes_es: ['Alojamiento 6 noches','Menú detox completo','Yoga restaurativo','Tratamiento spa','Excursión Tramuntana','Taller nutrición'],
    includes_en: ['6 nights accommodation','Full detox menu','Restorative yoga','Spa treatment','Tramuntana excursion','Nutrition workshop'],
    dest: 'mallorca', address: 'Masía Son Brull, Pollença',
    start_date: '2026-07-04', end_date: '2026-07-10', max_attendees: 12, confirmed_bookings: 9,
    total_price: 1250, languages: ['es','en'], avg_rating: 4.8, review_count: 31,
    cats: ['detox', 'wellness'],
    images: [
      { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', alt: 'Spa y wellness en Mallorca', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80', alt: 'Sierra de Tramuntana', is_cover: false },
    ],
  },
  {
    title_es: 'Retiro de Silencio en la Alpujarra Granadina',
    title_en: 'Silent Retreat in the Alpujarra',
    slug: 'silencio-meditacion-alpujarra-2026',
    summary_es: '5 días de silencio, meditación vipassana y conexión interior en los pueblos blancos de Granada.',
    summary_en: '5 days of silence, vipassana meditation and inner connection in the white villages of Granada.',
    description_es: 'Un retiro profundo de silencio en un cortijo andaluz rodeado de almendros y montañas. La práctica incluye meditación vipassana, caminatas meditativas, yoga suave y sesiones de journaling. Sin teléfonos, sin conversación, solo tú y el presente. Ideal para quienes buscan una experiencia contemplativa auténtica.',
    description_en: 'A deep silence retreat in an Andalusian farmhouse surrounded by almond trees and mountains. Practice includes vipassana meditation, walking meditation, gentle yoga and journaling sessions.',
    includes_es: ['Alojamiento 4 noches','Pensión completa vegetariana','Meditación vipassana','Yoga suave','Caminatas meditativas','Diario de reflexión'],
    includes_en: ['4 nights accommodation','Full board vegetarian','Vipassana meditation','Gentle yoga','Walking meditation','Reflection journal'],
    dest: 'alpujarra', address: 'Cortijo Los Almendros, Bubión',
    start_date: '2026-05-20', end_date: '2026-05-24', max_attendees: 10, confirmed_bookings: 7,
    total_price: 595, confirmation_type: 'manual', languages: ['es'], avg_rating: 4.9, review_count: 18,
    cats: ['silencio', 'meditacion'],
    images: [
      { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', alt: 'Naturaleza en la Alpujarra', is_cover: true },
    ],
  },
  {
    title_es: 'Aventura y Yoga en Picos de Europa',
    title_en: 'Adventure & Yoga in Picos de Europa',
    slug: 'aventura-yoga-picos-europa-2026',
    summary_es: '5 días combinando senderismo de montaña, yoga al aire libre y gastronomía asturiana.',
    summary_en: '5 days combining mountain hiking, outdoor yoga and Asturian gastronomy.',
    description_es: 'Un retiro para los amantes de la montaña y el bienestar. Cada mañana comienza con yoga al aire libre con vistas a los Picos, seguido de rutas de senderismo guiadas por un experto local. Las tardes son para relajarse con yoga restaurativo y disfrutar de la gastronomía asturiana: fabada, quesos, sidra natural. Alojamiento en hotel rural con encanto.',
    description_en: 'A retreat for mountain and wellness lovers. Each morning starts with outdoor yoga overlooking the Picos, followed by guided hiking routes. Afternoons are for restorative yoga and Asturian gastronomy.',
    includes_es: ['Alojamiento 4 noches','Media pensión','Yoga matinal','3 rutas de senderismo guiadas','Yoga restaurativo','Cata de sidra y quesos'],
    includes_en: ['4 nights accommodation','Half board','Morning yoga','3 guided hiking routes','Restorative yoga','Cider and cheese tasting'],
    dest: 'picos-europa', address: 'Hotel Rural El Caserío, Cangas de Onís',
    start_date: '2026-09-10', end_date: '2026-09-14', max_attendees: 14, confirmed_bookings: 6,
    total_price: 685, languages: ['es'], avg_rating: 4.7, review_count: 15,
    cats: ['aventura', 'naturaleza', 'yoga'],
    images: [
      { url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', alt: 'Senderismo en Picos de Europa', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80', alt: 'Paisaje montañoso', is_cover: false },
    ],
  },
  {
    title_es: 'Gastronomía Consciente y Yoga en la Costa Brava',
    title_en: 'Conscious Gastronomy & Yoga on the Costa Brava',
    slug: 'gastronomia-yoga-costa-brava-2026',
    summary_es: '4 días donde la cocina de temporada se une al yoga y el mar Mediterráneo.',
    summary_en: '4 days where seasonal cuisine meets yoga and the Mediterranean sea.',
    description_es: 'Un retiro único que combina talleres de cocina mediterránea con un chef estrella Michelin, sesiones de yoga frente al mar y excursiones por los pueblos medievales de la Costa Brava. Aprende a cocinar con productos de temporada, practica yoga al amanecer sobre acantilados y descubre el vino del Empordà.',
    description_en: 'A unique retreat combining Mediterranean cooking workshops with a Michelin-starred chef, seaside yoga sessions and excursions through medieval Costa Brava villages.',
    includes_es: ['Alojamiento 3 noches','Pensión completa gourmet','2 talleres de cocina','Yoga frente al mar','Excursión pueblo medieval','Cata de vinos Empordà'],
    includes_en: ['3 nights accommodation','Full gourmet board','2 cooking workshops','Seaside yoga','Medieval village excursion','Empordà wine tasting'],
    dest: 'costa-brava', address: 'Mas Albereda, Begur',
    start_date: '2026-10-08', end_date: '2026-10-11', max_attendees: 12, confirmed_bookings: 4,
    total_price: 980, languages: ['es','en'], avg_rating: 4.8, review_count: 12,
    cats: ['gastronomia', 'yoga'],
    images: [
      { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', alt: 'Gastronomía mediterránea', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', alt: 'Costa Brava', is_cover: false },
    ],
  },
  {
    title_es: 'Yoga Aéreo y Wellness en Paisaje Volcánico',
    title_en: 'Aerial Yoga & Wellness in Volcanic Landscape',
    slug: 'yoga-aereo-wellness-lanzarote-2026',
    summary_es: '6 días de yoga aéreo, spa termal y exploración volcánica en Lanzarote.',
    summary_en: '6 days of aerial yoga, thermal spa and volcanic exploration in Lanzarote.',
    description_es: 'Lanzarote te espera con sus paisajes de otro planeta. Este retiro combina yoga aéreo (antigravity), sesiones de spa volcánico, caminatas por el Parque Nacional de Timanfaya y cenas bajo las estrellas. Alojamiento en eco-resort con piscina natural de agua salada y vistas al océano.',
    description_en: 'Lanzarote awaits with its otherworldly landscapes. This retreat combines aerial yoga, volcanic spa sessions, Timanfaya National Park hikes and dinners under the stars.',
    includes_es: ['Alojamiento 5 noches','Pensión completa','Yoga aéreo diario','Circuito spa volcánico','Excursión Timanfaya','Cena bajo las estrellas'],
    includes_en: ['5 nights accommodation','Full board','Daily aerial yoga','Volcanic spa circuit','Timanfaya excursion','Starlit dinner'],
    dest: 'lanzarote', address: 'Eco-Resort Volcánico, Yaiza',
    start_date: '2026-11-05', end_date: '2026-11-10', max_attendees: 10, confirmed_bookings: 3,
    total_price: 1100, languages: ['es','en'], avg_rating: 4.6, review_count: 8,
    cats: ['yoga', 'wellness'],
    images: [
      { url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80', alt: 'Paisaje volcánico Lanzarote', is_cover: true },
    ],
  },
  {
    title_es: 'Reinvéntate: Desarrollo Personal en Gredos',
    title_en: 'Reinvent Yourself: Personal Growth in Gredos',
    slug: 'desarrollo-personal-gredos-2026',
    summary_es: '4 días de coaching grupal, mindfulness y naturaleza en la Sierra de Gredos.',
    summary_en: '4 days of group coaching, mindfulness and nature in Sierra de Gredos.',
    description_es: 'Un retiro intensivo de autoconocimiento facilitado por coaches certificados ICF. Incluye dinámicas grupales, sesiones de mindfulness, caminatas por la sierra, trabajo con diario personal y una ceremonia de cierre con intenciones. Perfecto para momentos de transición vital o cuando necesitas parar y escucharte.',
    description_en: 'An intensive self-discovery retreat facilitated by ICF-certified coaches. Includes group dynamics, mindfulness sessions, mountain walks, journaling and a closing ceremony.',
    includes_es: ['Alojamiento 3 noches','Pensión completa','Sesiones de coaching grupal','Mindfulness','Caminata guiada','Material de trabajo'],
    includes_en: ['3 nights accommodation','Full board','Group coaching sessions','Mindfulness','Guided walk','Workshop materials'],
    dest: 'sierra-gredos', address: 'Casa Rural El Nogal, Arenas de San Pedro',
    start_date: '2026-04-16', end_date: '2026-04-19', max_attendees: 12, confirmed_bookings: 8,
    total_price: 550, confirmation_type: 'manual', languages: ['es'], avg_rating: 4.7, review_count: 19,
    cats: ['desarrollo-personal', 'naturaleza'],
    images: [
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', alt: 'Sierra de Gredos', is_cover: true },
    ],
  },
  {
    title_es: 'Arte y Cerezos en Flor en el Valle del Jerte',
    title_en: 'Art & Cherry Blossoms in Jerte Valley',
    slug: 'arte-creatividad-valle-jerte-2026',
    summary_es: '5 días de pintura, fotografía y creatividad durante la floración de los cerezos.',
    summary_en: '5 days of painting, photography and creativity during cherry blossom season.',
    description_es: 'Aprovecha la espectacular floración de los cerezos del Valle del Jerte para despertar tu creatividad. Talleres de acuarela al aire libre, fotografía de paisaje, escritura creativa y sesiones de yoga entre cerezos en flor. Un retiro para artistas, creativos y cualquier persona que quiera reconectar con su lado más expresivo.',
    description_en: 'Take advantage of the spectacular cherry blossom season in Jerte Valley to awaken your creativity. Outdoor watercolor workshops, landscape photography, creative writing and yoga among cherry blossoms.',
    includes_es: ['Alojamiento 4 noches','Pensión completa','Taller acuarela','Taller fotografía','Escritura creativa','Yoga entre cerezos','Material artístico incluido'],
    includes_en: ['4 nights accommodation','Full board','Watercolor workshop','Photography workshop','Creative writing','Yoga among blossoms','Art materials included'],
    dest: 'valle-jerte', address: 'Posada del Valle, Jerte',
    start_date: '2026-03-28', end_date: '2026-04-01', max_attendees: 10, confirmed_bookings: 10,
    total_price: 720, languages: ['es'], avg_rating: 4.9, review_count: 14,
    cats: ['arte-creatividad', 'naturaleza'],
    images: [
      { url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&q=80', alt: 'Cerezos en flor Valle del Jerte', is_cover: true },
    ],
  },
  {
    title_es: 'Yoga y Senderismo en el Pirineo Aragonés',
    title_en: 'Yoga & Hiking in the Aragonese Pyrenees',
    slug: 'yoga-senderismo-pirineos-2026',
    summary_es: '6 días de trekking, yoga y naturaleza salvaje en el Valle de Benasque.',
    summary_en: '6 days of trekking, yoga and wild nature in the Benasque Valley.',
    description_es: 'Para quienes aman caminar y practicar yoga. Cada día incluye una ruta de senderismo diferente por el Valle de Benasque, ibones glaciares y bosques centenarios, seguida de una sesión de yoga restaurativo al atardecer. Noches en refugio de montaña con chimenea, comida casera de montaña y cielos estrellados sin contaminación lumínica.',
    description_en: 'For those who love hiking and yoga. Each day includes a different hiking route through the Benasque Valley, glacial lakes and ancient forests, followed by sunset restorative yoga.',
    includes_es: ['Alojamiento 5 noches en refugio','Pensión completa de montaña','Yoga al atardecer','5 rutas de senderismo guiadas','Mapa y bastones','Noche de estrellas'],
    includes_en: ['5 nights mountain lodge','Full mountain board','Sunset yoga','5 guided hiking routes','Map and poles','Stargazing night'],
    dest: 'pirineos', address: 'Refugio de Estós, Valle de Benasque',
    start_date: '2026-08-20', end_date: '2026-08-25', max_attendees: 12, confirmed_bookings: 5,
    total_price: 750, languages: ['es'], avg_rating: 4.8, review_count: 11,
    cats: ['yoga', 'aventura', 'naturaleza'],
    images: [
      { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', alt: 'Pirineos aragoneses', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', alt: 'Yoga al aire libre', is_cover: false },
    ],
  },
  {
    title_es: 'Wellness y Aguas Termales en la Región de Murcia',
    title_en: 'Wellness & Thermal Waters in the Region of Murcia',
    slug: 'wellness-termal-murcia-2026',
    summary_es: '4 días de relax total con aguas termales, masajes y yoga en el interior de Murcia.',
    summary_en: '4 days of total relaxation with thermal waters, massages and yoga in inland Murcia.',
    description_es: 'Escapa a un balneario centenario en el interior de la Región de Murcia. Aguas termales mineromedicinales, masajes relajantes, sesiones de yoga nidra, caminatas suaves por el paisaje murciano y gastronomía local. Un retiro perfecto para quienes necesitan parar, soltar y recuperar energía. Sin prisas, sin agenda apretada, solo bienestar.',
    description_en: 'Escape to a century-old spa in the Murcia countryside. Thermal mineral waters, relaxing massages, yoga nidra sessions, gentle walks and local cuisine. Perfect for those who need to stop, let go and recharge.',
    includes_es: ['Alojamiento 3 noches','Pensión completa','Circuito termal diario','1 masaje relajante','Yoga nidra','Caminata guiada','Taller de relajación'],
    includes_en: ['3 nights accommodation','Full board','Daily thermal circuit','1 relaxing massage','Yoga nidra','Guided walk','Relaxation workshop'],
    dest: 'murcia', address: 'Balneario de Archena, Archena',
    start_date: '2026-05-07', end_date: '2026-05-10', max_attendees: 20, confirmed_bookings: 11,
    total_price: 480, languages: ['es'], avg_rating: 4.6, review_count: 27,
    cats: ['wellness', 'detox'],
    images: [
      { url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80', alt: 'Aguas termales', is_cover: true },
      { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80', alt: 'Paisaje de Murcia', is_cover: false },
    ],
  },
];

let ok = 0;
let fail = 0;

for (const r of retreats) {
  const destId = await getDest(r.dest);
  if (!destId) { console.error(`✗ Destino no encontrado: ${r.dest}`); fail++; continue; }

  const row = {
    organizer_id: demoOrgId,
    title_es: r.title_es,
    title_en: r.title_en,
    slug: r.slug,
    summary_es: r.summary_es,
    summary_en: r.summary_en,
    description_es: r.description_es,
    description_en: r.description_en,
    includes_es: r.includes_es,
    includes_en: r.includes_en,
    destination_id: destId,
    address: r.address,
    start_date: r.start_date,
    end_date: r.end_date,
    max_attendees: r.max_attendees,
    confirmed_bookings: r.confirmed_bookings,
    total_price: r.total_price,
    confirmation_type: r.confirmation_type || 'automatic',
    languages: r.languages,
    status: 'published',
    published_at: new Date().toISOString(),
    avg_rating: r.avg_rating,
    review_count: r.review_count,
  };

  const { data: inserted, error: insErr } = await supabase
    .from('retreats')
    .upsert(row, { onConflict: 'slug' })
    .select('id')
    .single();

  if (insErr) {
    console.error(`✗ ${r.slug}: ${insErr.message}`);
    fail++;
    continue;
  }

  const retreatId = inserted.id;

  // Categorías
  for (const catSlug of r.cats) {
    const catId = await getCat(catSlug);
    if (catId) {
      await supabase.from('retreat_categories').upsert(
        { retreat_id: retreatId, category_id: catId },
        { onConflict: 'retreat_id,category_id' }
      );
    }
  }

  // Imágenes
  for (let i = 0; i < r.images.length; i++) {
    const img = r.images[i];
    await supabase.from('retreat_images').upsert({
      retreat_id: retreatId,
      image_url: img.url,
      alt_text: img.alt,
      sort_order: i,
      is_cover: img.is_cover,
    }, { onConflict: 'retreat_id,sort_order' });
  }

  console.log(`✓ ${r.title_es}`);
  ok++;
}

console.log(`\n═══ Resultado: ${ok} retiros insertados, ${fail} fallos ═══`);

// Verificación final
const { count } = await supabase.from('retreats').select('*', { count: 'exact', head: true });
console.log(`Total retiros en BD: ${count}`);
