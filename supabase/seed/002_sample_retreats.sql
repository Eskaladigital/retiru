-- ============================================================================
-- RETIRU · Seed: 10 retiros de ejemplo
-- Ejecutar desde el SQL Editor de Supabase (service_role, bypassa RLS)
-- Requiere haber ejecutado 001_categories_destinations.sql antes
-- ============================================================================

-- 1. Crear un usuario demo en auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo-organizer@retiru.com',
  crypt('DemoPass123!', gen_salt('bf')),
  NOW(),
  '{"full_name":"Retiru Demo Organizer"}'::jsonb,
  NOW(), NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear perfil
INSERT INTO profiles (id, email, full_name, role, preferred_locale)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo-organizer@retiru.com',
  'Retiru Demo Organizer',
  'organizer',
  'es'
) ON CONFLICT (id) DO NOTHING;

-- 3. Crear perfil de organizador
INSERT INTO organizer_profiles (id, user_id, business_name, slug, description_es, description_en, location, languages, status, verified_at, avg_rating, review_count)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Retiru Experiences',
  'retiru-experiences',
  'Organizador de retiros y experiencias de bienestar en los mejores destinos de España.',
  'Retreat organizer and wellness experiences in the best destinations in Spain.',
  'España',
  ARRAY['es','en'],
  'verified',
  NOW(),
  4.8,
  42
) ON CONFLICT (id) DO NOTHING;

-- 4. Variables para IDs de categorías y destinos
DO $$
DECLARE
  org_id UUID := '00000000-0000-0000-0000-000000000010';
  cat_yoga UUID;
  cat_meditacion UUID;
  cat_detox UUID;
  cat_naturaleza UUID;
  cat_gastronomia UUID;
  cat_wellness UUID;
  cat_aventura UUID;
  cat_silencio UUID;
  cat_arte UUID;
  cat_desarrollo UUID;
  dest_ibiza UUID;
  dest_mallorca UUID;
  dest_costa_brava UUID;
  dest_gredos UUID;
  dest_alpujarra UUID;
  dest_picos UUID;
  dest_jerte UUID;
  dest_lanzarote UUID;
  dest_pirineos UUID;
  dest_murcia UUID;
  r_id UUID;
BEGIN
  SELECT id INTO cat_yoga FROM categories WHERE slug = 'yoga';
  SELECT id INTO cat_meditacion FROM categories WHERE slug = 'meditacion';
  SELECT id INTO cat_detox FROM categories WHERE slug = 'detox';
  SELECT id INTO cat_naturaleza FROM categories WHERE slug = 'naturaleza';
  SELECT id INTO cat_gastronomia FROM categories WHERE slug = 'gastronomia';
  SELECT id INTO cat_wellness FROM categories WHERE slug = 'wellness';
  SELECT id INTO cat_aventura FROM categories WHERE slug = 'aventura';
  SELECT id INTO cat_silencio FROM categories WHERE slug = 'silencio';
  SELECT id INTO cat_arte FROM categories WHERE slug = 'arte-creatividad';
  SELECT id INTO cat_desarrollo FROM categories WHERE slug = 'desarrollo-personal';

  SELECT id INTO dest_ibiza FROM destinations WHERE slug = 'ibiza';
  SELECT id INTO dest_mallorca FROM destinations WHERE slug = 'mallorca';
  SELECT id INTO dest_costa_brava FROM destinations WHERE slug = 'costa-brava';
  SELECT id INTO dest_gredos FROM destinations WHERE slug = 'sierra-gredos';
  SELECT id INTO dest_alpujarra FROM destinations WHERE slug = 'alpujarra';
  SELECT id INTO dest_picos FROM destinations WHERE slug = 'picos-europa';
  SELECT id INTO dest_jerte FROM destinations WHERE slug = 'valle-jerte';
  SELECT id INTO dest_lanzarote FROM destinations WHERE slug = 'lanzarote';
  SELECT id INTO dest_pirineos FROM destinations WHERE slug = 'pirineos';
  SELECT id INTO dest_murcia FROM destinations WHERE slug = 'murcia';

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 1: Yoga y Meditación en Ibiza
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Retiro de Yoga y Meditación frente al Mar',
    'Yoga & Meditation Retreat by the Sea',
    'yoga-meditacion-ibiza-verano-2026',
    '6 días de yoga, meditación y conexión con la naturaleza en la costa norte de Ibiza.',
    '6 days of yoga, meditation and nature connection on the north coast of Ibiza.',
    'Sumérgete en una experiencia transformadora en una finca tradicional ibicenca rodeada de pinos y vistas al Mediterráneo. Cada día incluye dos sesiones de yoga (Hatha y Vinyasa), meditación guiada al amanecer, talleres de pranayama y tiempo libre para explorar calas secretas. La alimentación es 100% ecológica y vegetariana, preparada por un chef especializado en cocina consciente.',
    'Immerse yourself in a transformative experience at a traditional Ibicencan finca surrounded by pines and Mediterranean views. Each day includes two yoga sessions (Hatha and Vinyasa), guided sunrise meditation, pranayama workshops and free time to explore secret coves.',
    ARRAY['Alojamiento 5 noches','Pensión completa ecológica','2 sesiones yoga/día','Meditación guiada','Material de yoga','Transfer aeropuerto'],
    ARRAY['5 nights accommodation','Full board organic meals','2 yoga sessions/day','Guided meditation','Yoga equipment','Airport transfer'],
    dest_ibiza, 'Finca Can Lluc, Sant Llorenç de Balàfia',
    '2026-06-15', '2026-06-20', 16, 13,
    790.00, 'automatic', ARRAY['es','en'], 'published', NOW(),
    4.9, 23
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_yoga);
  INSERT INTO retreat_categories VALUES (r_id, cat_meditacion);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80', 'Yoga frente al mar en Ibiza', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', 'Meditación al amanecer', 1, false);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 2: Detox y Wellness en Mallorca
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Retiro Detox & Wellness en la Sierra de Tramuntana',
    'Detox & Wellness Retreat in Sierra de Tramuntana',
    'detox-wellness-mallorca-julio-2026',
    '7 días de desintoxicación integral con yoga, nutrición consciente y naturaleza en Mallorca.',
    '7 days of integral detox with yoga, conscious nutrition and nature in Mallorca.',
    'Un retiro diseñado para resetear cuerpo y mente en plena Sierra de Tramuntana. Incluye ayuno intermitente guiado, zumos cold press, sesiones de yoga restaurativo, caminatas por la montaña, tratamientos de spa y talleres de alimentación saludable. El alojamiento es en una masía del siglo XVIII restaurada con piscina infinita y vistas al valle.',
    'A retreat designed to reset body and mind in the heart of Sierra de Tramuntana. Includes guided intermittent fasting, cold press juices, restorative yoga, mountain walks, spa treatments and healthy eating workshops.',
    ARRAY['Alojamiento 6 noches','Menú detox completo','Yoga restaurativo','Tratamiento spa','Excursión Tramuntana','Taller nutrición'],
    ARRAY['6 nights accommodation','Full detox menu','Restorative yoga','Spa treatment','Tramuntana excursion','Nutrition workshop'],
    dest_mallorca, 'Masía Son Brull, Pollença',
    '2026-07-04', '2026-07-10', 12, 9,
    1250.00, 'automatic', ARRAY['es','en'], 'published', NOW(),
    4.8, 31
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_detox);
  INSERT INTO retreat_categories VALUES (r_id, cat_wellness);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', 'Spa y wellness en Mallorca', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80', 'Sierra de Tramuntana', 1, false);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 3: Silencio y Meditación en la Alpujarra
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Retiro de Silencio en la Alpujarra Granadina',
    'Silent Retreat in the Alpujarra',
    'silencio-meditacion-alpujarra-2026',
    '5 días de silencio, meditación vipassana y conexión interior en los pueblos blancos de Granada.',
    '5 days of silence, vipassana meditation and inner connection in the white villages of Granada.',
    'Un retiro profundo de silencio en un cortijo andaluz rodeado de almendros y montañas. La práctica incluye meditación vipassana, caminatas meditativas, yoga suave y sesiones de journaling. Sin teléfonos, sin conversación, solo tú y el presente. Ideal para quienes buscan una experiencia contemplativa auténtica.',
    'A deep silence retreat in an Andalusian farmhouse surrounded by almond trees and mountains. Practice includes vipassana meditation, walking meditation, gentle yoga and journaling sessions.',
    ARRAY['Alojamiento 4 noches','Pensión completa vegetariana','Meditación vipassana','Yoga suave','Caminatas meditativas','Diario de reflexión'],
    ARRAY['4 nights accommodation','Full board vegetarian','Vipassana meditation','Gentle yoga','Walking meditation','Reflection journal'],
    dest_alpujarra, 'Cortijo Los Almendros, Bubión',
    '2026-05-20', '2026-05-24', 10, 7,
    595.00, 'manual', ARRAY['es'], 'published', NOW(),
    4.9, 18
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_silencio);
  INSERT INTO retreat_categories VALUES (r_id, cat_meditacion);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 'Naturaleza en la Alpujarra', 0, true);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 4: Aventura y Naturaleza en Picos de Europa
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Aventura y Yoga en Picos de Europa',
    'Adventure & Yoga in Picos de Europa',
    'aventura-yoga-picos-europa-2026',
    '5 días combinando senderismo de montaña, yoga al aire libre y gastronomía asturiana.',
    '5 days combining mountain hiking, outdoor yoga and Asturian gastronomy.',
    'Un retiro para los amantes de la montaña y el bienestar. Cada mañana comienza con yoga al aire libre con vistas a los Picos, seguido de rutas de senderismo guiadas por un experto local. Las tardes son para relajarse con yoga restaurativo y disfrutar de la gastronomía asturiana: fabada, quesos, sidra natural. Alojamiento en hotel rural con encanto.',
    'A retreat for mountain and wellness lovers. Each morning starts with outdoor yoga overlooking the Picos, followed by guided hiking routes. Afternoons are for restorative yoga and Asturian gastronomy.',
    ARRAY['Alojamiento 4 noches','Media pensión','Yoga matinal','3 rutas de senderismo guiadas','Yoga restaurativo','Cata de sidra y quesos'],
    ARRAY['4 nights accommodation','Half board','Morning yoga','3 guided hiking routes','Restorative yoga','Cider and cheese tasting'],
    dest_picos, 'Hotel Rural El Caserío, Cangas de Onís',
    '2026-09-10', '2026-09-14', 14, 6,
    685.00, 'automatic', ARRAY['es'], 'published', NOW(),
    4.7, 15
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_aventura);
  INSERT INTO retreat_categories VALUES (r_id, cat_naturaleza);
  INSERT INTO retreat_categories VALUES (r_id, cat_yoga);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 'Senderismo en Picos de Europa', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80', 'Paisaje montañoso', 1, false);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 5: Gastronomía y Bienestar en Costa Brava
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Gastronomía Consciente y Yoga en la Costa Brava',
    'Conscious Gastronomy & Yoga on the Costa Brava',
    'gastronomia-yoga-costa-brava-2026',
    '4 días donde la cocina de temporada se une al yoga y el mar Mediterráneo.',
    '4 days where seasonal cuisine meets yoga and the Mediterranean sea.',
    'Un retiro único que combina talleres de cocina mediterránea con un chef estrella Michelin, sesiones de yoga frente al mar y excursiones por los pueblos medievales de la Costa Brava. Aprende a cocinar con productos de temporada, practica yoga al amanecer sobre acantilados y descubre el vino del Empordà.',
    'A unique retreat combining Mediterranean cooking workshops with a Michelin-starred chef, seaside yoga sessions and excursions through medieval Costa Brava villages.',
    ARRAY['Alojamiento 3 noches','Pensión completa gourmet','2 talleres de cocina','Yoga frente al mar','Excursión pueblo medieval','Cata de vinos Empordà'],
    ARRAY['3 nights accommodation','Full gourmet board','2 cooking workshops','Seaside yoga','Medieval village excursion','Empordà wine tasting'],
    dest_costa_brava, 'Mas Albereda, Begur',
    '2026-10-08', '2026-10-11', 12, 4,
    980.00, 'automatic', ARRAY['es','en'], 'published', NOW(),
    4.8, 12
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_gastronomia);
  INSERT INTO retreat_categories VALUES (r_id, cat_yoga);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', 'Gastronomía mediterránea', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', 'Costa Brava', 1, false);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 6: Yoga Aéreo y Wellness en Lanzarote
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Yoga Aéreo y Wellness en Paisaje Volcánico',
    'Aerial Yoga & Wellness in Volcanic Landscape',
    'yoga-aereo-wellness-lanzarote-2026',
    '6 días de yoga aéreo, spa termal y exploración volcánica en Lanzarote.',
    '6 days of aerial yoga, thermal spa and volcanic exploration in Lanzarote.',
    'Lanzarote te espera con sus paisajes de otro planeta. Este retiro combina yoga aéreo (antigravity), sesiones de spa volcánico, caminatas por el Parque Nacional de Timanfaya y cenas bajo las estrellas. Alojamiento en eco-resort con piscina natural de agua salada y vistas al océano.',
    'Lanzarote awaits with its otherworldly landscapes. This retreat combines aerial yoga, volcanic spa sessions, Timanfaya National Park hikes and dinners under the stars.',
    ARRAY['Alojamiento 5 noches','Pensión completa','Yoga aéreo diario','Circuito spa volcánico','Excursión Timanfaya','Cena bajo las estrellas'],
    ARRAY['5 nights accommodation','Full board','Daily aerial yoga','Volcanic spa circuit','Timanfaya excursion','Starlit dinner'],
    dest_lanzarote, 'Eco-Resort Volcánico, Yaiza',
    '2026-11-05', '2026-11-10', 10, 3,
    1100.00, 'automatic', ARRAY['es','en'], 'published', NOW(),
    4.6, 8
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_yoga);
  INSERT INTO retreat_categories VALUES (r_id, cat_wellness);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80', 'Paisaje volcánico Lanzarote', 0, true);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 7: Desarrollo Personal en Sierra de Gredos
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Reinvéntate: Desarrollo Personal en Gredos',
    'Reinvent Yourself: Personal Growth in Gredos',
    'desarrollo-personal-gredos-2026',
    '4 días de coaching grupal, mindfulness y naturaleza en la Sierra de Gredos.',
    '4 days of group coaching, mindfulness and nature in Sierra de Gredos.',
    'Un retiro intensivo de autoconocimiento facilitado por coaches certificados ICF. Incluye dinámicas grupales, sesiones de mindfulness, caminatas por la sierra, trabajo con diario personal y una ceremonia de cierre con intenciones. Perfecto para momentos de transición vital o cuando necesitas parar y escucharte.',
    'An intensive self-discovery retreat facilitated by ICF-certified coaches. Includes group dynamics, mindfulness sessions, mountain walks, journaling and a closing ceremony.',
    ARRAY['Alojamiento 3 noches','Pensión completa','Sesiones de coaching grupal','Mindfulness','Caminata guiada','Material de trabajo'],
    ARRAY['3 nights accommodation','Full board','Group coaching sessions','Mindfulness','Guided walk','Workshop materials'],
    dest_gredos, 'Casa Rural El Nogal, Arenas de San Pedro',
    '2026-04-16', '2026-04-19', 12, 8,
    550.00, 'manual', ARRAY['es'], 'published', NOW(),
    4.7, 19
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_desarrollo);
  INSERT INTO retreat_categories VALUES (r_id, cat_naturaleza);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', 'Sierra de Gredos', 0, true);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 8: Arte y Creatividad en el Valle del Jerte
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Arte y Cerezos en Flor en el Valle del Jerte',
    'Art & Cherry Blossoms in Jerte Valley',
    'arte-creatividad-valle-jerte-2026',
    '5 días de pintura, fotografía y creatividad durante la floración de los cerezos.',
    '5 days of painting, photography and creativity during cherry blossom season.',
    'Aprovecha la espectacular floración de los cerezos del Valle del Jerte para despertar tu creatividad. Talleres de acuarela al aire libre, fotografía de paisaje, escritura creativa y sesiones de yoga entre cerezos en flor. Un retiro para artistas, creativos y cualquier persona que quiera reconectar con su lado más expresivo.',
    'Take advantage of the spectacular cherry blossom season in Jerte Valley to awaken your creativity. Outdoor watercolor workshops, landscape photography, creative writing and yoga among cherry blossoms.',
    ARRAY['Alojamiento 4 noches','Pensión completa','Taller acuarela','Taller fotografía','Escritura creativa','Yoga entre cerezos','Material artístico incluido'],
    ARRAY['4 nights accommodation','Full board','Watercolor workshop','Photography workshop','Creative writing','Yoga among blossoms','Art materials included'],
    dest_jerte, 'Posada del Valle, Jerte',
    '2026-03-28', '2026-04-01', 10, 10,
    720.00, 'automatic', ARRAY['es'], 'published', NOW(),
    4.9, 14
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_arte);
  INSERT INTO retreat_categories VALUES (r_id, cat_naturaleza);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=800&q=80', 'Cerezos en flor Valle del Jerte', 0, true);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 9: Yoga y Senderismo en Pirineos
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Yoga y Senderismo en el Pirineo Aragonés',
    'Yoga & Hiking in the Aragonese Pyrenees',
    'yoga-senderismo-pirineos-2026',
    '6 días de trekking, yoga y naturaleza salvaje en el Valle de Benasque.',
    '6 days of trekking, yoga and wild nature in the Benasque Valley.',
    'Para quienes aman caminar y practicar yoga. Cada día incluye una ruta de senderismo diferente por el Valle de Benasque, ibones glaciares y bosques centenarios, seguida de una sesión de yoga restaurativo al atardecer. Noches en refugio de montaña con chimenea, comida casera de montaña y cielos estrellados sin contaminación lumínica.',
    'For those who love hiking and yoga. Each day includes a different hiking route through the Benasque Valley, glacial lakes and ancient forests, followed by sunset restorative yoga.',
    ARRAY['Alojamiento 5 noches en refugio','Pensión completa de montaña','Yoga al atardecer','5 rutas de senderismo guiadas','Mapa y bastones','Noche de estrellas'],
    ARRAY['5 nights mountain lodge','Full mountain board','Sunset yoga','5 guided hiking routes','Map and poles','Stargazing night'],
    dest_pirineos, 'Refugio de Estós, Valle de Benasque',
    '2026-08-20', '2026-08-25', 12, 5,
    750.00, 'automatic', ARRAY['es'], 'published', NOW(),
    4.8, 11
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_yoga);
  INSERT INTO retreat_categories VALUES (r_id, cat_aventura);
  INSERT INTO retreat_categories VALUES (r_id, cat_naturaleza);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 'Pirineos aragoneses', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', 'Yoga al aire libre', 1, false);

  -- ═══════════════════════════════════════════════════════════════
  -- RETIRO 10: Wellness y Termalismo en Murcia
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO retreats (organizer_id, title_es, title_en, slug, summary_es, summary_en, description_es, description_en, includes_es, includes_en, destination_id, address, start_date, end_date, max_attendees, confirmed_bookings, total_price, confirmation_type, languages, status, published_at, avg_rating, review_count)
  VALUES (
    org_id,
    'Wellness y Aguas Termales en la Región de Murcia',
    'Wellness & Thermal Waters in the Region of Murcia',
    'wellness-termal-murcia-2026',
    '4 días de relax total con aguas termales, masajes y yoga en el interior de Murcia.',
    '4 days of total relaxation with thermal waters, massages and yoga in inland Murcia.',
    'Escapa a un balneario centenario en el interior de la Región de Murcia. Aguas termales mineromedicinales, masajes relajantes, sesiones de yoga nidra, caminatas suaves por el paisaje murciano y gastronomía local. Un retiro perfecto para quienes necesitan parar, soltar y recuperar energía. Sin prisas, sin agenda apretada, solo bienestar.',
    'Escape to a century-old spa in the Murcia countryside. Thermal mineral waters, relaxing massages, yoga nidra sessions, gentle walks and local cuisine. Perfect for those who need to stop, let go and recharge.',
    ARRAY['Alojamiento 3 noches','Pensión completa','Circuito termal diario','1 masaje relajante','Yoga nidra','Caminata guiada','Taller de relajación'],
    ARRAY['3 nights accommodation','Full board','Daily thermal circuit','1 relaxing massage','Yoga nidra','Guided walk','Relaxation workshop'],
    dest_murcia, 'Balneario de Archena, Archena',
    '2026-05-07', '2026-05-10', 20, 11,
    480.00, 'automatic', ARRAY['es'], 'published', NOW(),
    4.6, 27
  ) RETURNING id INTO r_id;
  INSERT INTO retreat_categories VALUES (r_id, cat_wellness);
  INSERT INTO retreat_categories VALUES (r_id, cat_detox);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80', 'Aguas termales', 0, true);
  INSERT INTO retreat_images VALUES (uuid_generate_v4(), r_id, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80', 'Paisaje de Murcia', 1, false);

END $$;
