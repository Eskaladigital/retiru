-- ============================================================================
-- RETIRU · Seed: Blog — 3 categorías + 5 artículos de ejemplo
-- Ejecutar desde el SQL Editor de Supabase (service_role, bypassa RLS)
-- Requiere haber ejecutado 002_sample_retreats.sql antes (demo user)
-- ============================================================================

-- 1. Categorías de blog
INSERT INTO blog_categories (name_es, name_en, slug, sort_order)
VALUES
  ('Guías', 'Guides', 'guias', 1),
  ('Bienestar', 'Wellness', 'bienestar', 2),
  ('Destinos', 'Destinations', 'destinos', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. Artículos de blog
DO $$
DECLARE
  author UUID := '00000000-0000-0000-0000-000000000001';
  cat_guias UUID;
  cat_bienestar UUID;
  cat_destinos UUID;
BEGIN
  SELECT id INTO cat_guias FROM blog_categories WHERE slug = 'guias';
  SELECT id INTO cat_bienestar FROM blog_categories WHERE slug = 'bienestar';
  SELECT id INTO cat_destinos FROM blog_categories WHERE slug = 'destinos';

  -- ═══════════════════════════════════════════════════════════════
  -- ARTÍCULO 1: Guía para elegir tu primer retiro de yoga
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO blog_articles (
    title_es, title_en, slug, excerpt_es, excerpt_en,
    content_es, content_en, category_id, author_id,
    cover_image_url, read_time_min, is_published, published_at,
    meta_title_es, meta_description_es, view_count
  ) VALUES (
    'Guía completa: cómo elegir tu primer retiro de yoga en España',
    'Complete guide: how to choose your first yoga retreat in Spain',
    'guia-completa-primer-retiro-yoga',
    'Todo lo que necesitas saber antes de reservar tu primera experiencia de yoga inmersivo: qué esperar, cómo prepararte, qué preguntar al organizador y los mejores destinos para principiantes.',
    'Everything you need to know before booking your first immersive yoga experience: what to expect, how to prepare, what to ask the organizer and the best destinations for beginners.',
    'Si estás leyendo esto, probablemente llevas un tiempo pensando en hacer un retiro de yoga pero no sabes por dónde empezar. Es completamente normal. La oferta es amplia, los precios varían mucho y cada retiro promete algo diferente. En esta guía te ayudamos a tomar la mejor decisión.

¿Qué es exactamente un retiro de yoga?

Un retiro de yoga es una experiencia inmersiva que combina la práctica del yoga con un cambio de entorno. A diferencia de una clase semanal en tu gimnasio, un retiro te permite desconectar de tu rutina y dedicar varios días seguidos a tu práctica, tu cuerpo y tu mente.

La mayoría de retiros incluyen alojamiento, comidas (generalmente vegetarianas o veganas), dos o tres sesiones de yoga al día, meditación y tiempo libre para disfrutar del entorno. Algunos añaden senderismo, spa, talleres de cocina o excursiones culturales.

¿Cuánto dura un retiro?

Los retiros más populares duran entre 3 y 7 días. Para tu primera experiencia, te recomendamos un retiro de fin de semana (3 días) o uno de 5 días. Así puedes probar sin un compromiso demasiado largo. Los retiros de 7 a 14 días son ideales si ya tienes algo de experiencia o quieres una inmersión más profunda.

¿Cuánto cuesta un retiro de yoga en España?

Los precios varían enormemente según la ubicación, la duración, el tipo de alojamiento y lo que incluye. Como referencia:

• Fin de semana (2-3 días): 200€ – 450€
• Semana (5-7 días): 450€ – 1.200€
• Retiros premium (villa privada, spa): 800€ – 2.500€

En Retiru puedes filtrar por precio y ver exactamente cuánto pagas: el 20% es la cuota de gestión que va a Retiru, y el 80% lo pagas directamente al organizador.

Los 5 mejores destinos para un primer retiro

1. Ibiza — No todo es fiesta en Ibiza. La isla tiene una escena de yoga y bienestar increíble, con retiros frente al mar, atardeceres mágicos y una energía especial.

2. Mallorca — Montañas, calas vírgenes y una tradición de retiros consolidada. Perfecto para combinar yoga con naturaleza.

3. Costa Brava — Cerca de Barcelona, con calas espectaculares y retiros que combinan mar y montaña.

4. Las Alpujarras (Granada) — Para quienes buscan silencio y montaña. Retiros más íntimos y auténticos.

5. Lanzarote — Paisajes volcánicos únicos, clima perfecto todo el año y retiros con un toque diferente.

Qué preguntar antes de reservar

Antes de confirmar tu reserva, asegúrate de preguntar:

• ¿Qué nivel de yoga se requiere? La mayoría aceptan todos los niveles, pero es mejor confirmarlo.
• ¿Qué incluye el precio? Alojamiento, comidas, materiales, transporte...
• ¿Cuál es la política de cancelación? En Retiru, cada retiro muestra su política antes de reservar.
• ¿Hay algún formulario pre-retiro? Muchos organizadores envían un cuestionario sobre dieta, alergias o nivel de práctica.
• ¿Necesito llevar mi propia esterilla? Algunos retiros las proporcionan, otros no.

Encuentra tu retiro ideal

En Retiru puedes explorar cientos de retiros en España, filtrar por fecha, destino, precio y tipo de yoga, y reservar de forma segura con total transparencia de precios. ¿Listo para dar el paso?',
    'If you are reading this, you have probably been thinking about doing a yoga retreat but don''t know where to start. That''s completely normal. The offer is wide, prices vary a lot and each retreat promises something different. In this guide we help you make the best decision.',
    cat_guias, author,
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    12, true, NOW(),
    'Guía completa: cómo elegir tu primer retiro de yoga en España | Retiru',
    'Todo lo que necesitas saber antes de reservar tu primera experiencia de yoga inmersivo: destinos, precios, qué esperar y cómo prepararte.',
    134
  ) ON CONFLICT (slug) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ARTÍCULO 2: Los 10 mejores destinos para retiros en España
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO blog_articles (
    title_es, title_en, slug, excerpt_es, excerpt_en,
    content_es, content_en, category_id, author_id,
    cover_image_url, read_time_min, is_published, published_at,
    meta_title_es, meta_description_es, view_count
  ) VALUES (
    'Los 10 mejores destinos para retiros en España en 2026',
    'The 10 best retreat destinations in Spain in 2026',
    '10-destinos-retiros-espana-2026',
    'De Ibiza a Sierra Nevada, pasando por el Priorat y la Costa Brava: los destinos más demandados para desconectar este año.',
    'From Ibiza to Sierra Nevada, through Priorat and the Costa Brava: the most popular destinations to disconnect this year.',
    'España se ha convertido en uno de los destinos europeos más importantes para retiros de bienestar. Su diversidad geográfica, su clima privilegiado y una oferta gastronómica de primer nivel hacen que cada rincón del país ofrezca una experiencia única. Hemos seleccionado los 10 destinos que más demanda están teniendo en 2026.

1. Ibiza, Islas Baleares

Ibiza sigue siendo el destino número uno para retiros de yoga y bienestar en España. Más allá de su fama nocturna, la isla ofrece una energía especial, con fincas rurales convertidas en centros de retiro, atardeceres legendarios y una comunidad internacional de practicantes de yoga. Los retiros más populares combinan yoga con meditación, sound healing y excursiones a calas secretas.

2. Mallorca, Islas Baleares

La Sierra de Tramuntana, declarada Patrimonio de la Humanidad, es el escenario perfecto para retiros que combinan naturaleza y bienestar. Masías restauradas con piscina infinita, rutas de senderismo entre olivos centenarios y una gastronomía mediterránea excepcional.

3. Costa Brava, Cataluña

A menos de dos horas de Barcelona, la Costa Brava ofrece calas de aguas cristalinas, pueblos medievales y una tradición vinícola que la convierten en un destino perfecto para retiros gastronómicos y de yoga frente al mar.

4. Las Alpujarras, Granada

Para quienes buscan autenticidad y silencio, los pueblos blancos de la Alpujarra granadina ofrecen retiros íntimos en cortijos rodeados de almendros. Ideal para retiros de meditación vipassana y desconexión digital.

5. Sierra de Gredos, Ávila

A solo dos horas de Madrid, Gredos ofrece montaña, ríos y bosques de robles. Un destino perfecto para retiros de desarrollo personal y mindfulness en plena naturaleza.

6. Picos de Europa, Asturias

Montañas espectaculares, gastronomía asturiana y una naturaleza salvaje que invita a la aventura. Los retiros aquí combinan senderismo con yoga y experiencias gastronómicas locales.

7. Lanzarote, Islas Canarias

Paisajes volcánicos de otro planeta, clima perfecto todo el año y eco-resorts que apuestan por la sostenibilidad. Lanzarote es el destino emergente para retiros de yoga aéreo y wellness.

8. Valle del Jerte, Cáceres

Famoso por su espectacular floración de cerezos en primavera, el Valle del Jerte ofrece un entorno único para retiros de arte, creatividad y conexión con la naturaleza.

9. Pirineos Aragoneses, Huesca

Para los más aventureros, el Valle de Benasque ofrece retiros que combinan trekking de alta montaña con yoga al atardecer, ibones glaciares y noches de estrellas.

10. Región de Murcia

El interior de Murcia esconde balnearios centenarios con aguas termales mineromedicinales. Un destino perfecto para retiros de wellness, termalismo y descanso total.',
    'Spain has become one of the most important European destinations for wellness retreats. Its geographical diversity, privileged climate and top-level gastronomy make every corner of the country offer a unique experience.',
    cat_destinos, author,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    8, true, NOW(),
    'Los 10 mejores destinos para retiros en España en 2026 | Retiru',
    'Descubre los destinos más demandados para retiros de yoga, meditación y bienestar en España: de Ibiza a los Pirineos.',
    98
  ) ON CONFLICT (slug) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ARTÍCULO 3: Beneficios del retiro detox y el ayuno
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO blog_articles (
    title_es, title_en, slug, excerpt_es, excerpt_en,
    content_es, content_en, category_id, author_id,
    cover_image_url, read_time_min, is_published, published_at,
    meta_title_es, meta_description_es, view_count
  ) VALUES (
    'Beneficios de un retiro detox: qué dice la ciencia sobre el ayuno intermitente',
    'Benefits of a detox retreat: what science says about intermittent fasting',
    'beneficios-retiro-detox-ayuno',
    'Analizamos la evidencia científica detrás de los retiros de detox y ayuno, y cómo pueden mejorar tu salud física y mental.',
    'We analyze the scientific evidence behind detox and fasting retreats, and how they can improve your physical and mental health.',
    'Los retiros de detox se han convertido en una de las tendencias más fuertes del bienestar en los últimos años. Pero más allá de las modas, ¿qué dice realmente la ciencia sobre sus beneficios? En este artículo analizamos la evidencia científica y te explicamos qué puedes esperar de un retiro de este tipo.

¿Qué es un retiro detox?

Un retiro detox es una experiencia inmersiva centrada en la desintoxicación del organismo. Generalmente incluye una combinación de ayuno intermitente guiado, alimentación basada en zumos y caldos, sesiones de yoga, meditación, tratamientos de spa y actividades en la naturaleza. La duración típica es de 5 a 7 días.

La ciencia detrás del ayuno intermitente

El ayuno intermitente ha sido objeto de numerosos estudios científicos en los últimos años. La investigación sugiere que periodos controlados de ayuno pueden activar procesos de autofagia celular (la limpieza natural del organismo), mejorar la sensibilidad a la insulina, reducir la inflamación sistémica y favorecer la regeneración celular.

Un estudio publicado en el New England Journal of Medicine en 2019 concluyó que el ayuno intermitente puede tener beneficios significativos para la salud metabólica, cardiovascular y cerebral. Sin embargo, es importante destacar que estos beneficios se obtienen con ayunos controlados y supervisados.

Beneficios comprobados

Los principales beneficios respaldados por evidencia científica incluyen:

• Mejora de la claridad mental y la concentración
• Reducción de marcadores inflamatorios
• Mejora de la calidad del sueño
• Regulación del sistema digestivo
• Aumento de la energía vital tras el periodo inicial de adaptación
• Mejora del estado de ánimo y reducción del estrés

Precauciones importantes

Un retiro detox no es para todo el mundo. Está contraindicado para embarazadas, personas con trastornos alimentarios, diabéticos tipo 1 y personas con bajo peso. Siempre consulta a tu médico antes de realizar un ayuno prolongado.

Cómo elegir un buen retiro detox

Busca retiros que cuenten con supervisión médica o nutricional profesional, que ofrezcan un programa gradual (no ayunos extremos desde el primer día) y que combinen el ayuno con actividades de bienestar como yoga y meditación. En Retiru puedes filtrar retiros por la categoría "Detox" y ver exactamente qué incluye cada programa.',
    'Detox retreats have become one of the strongest wellness trends in recent years. But beyond trends, what does science really say about their benefits?',
    cat_bienestar, author,
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    10, true, NOW(),
    'Beneficios de un retiro detox: qué dice la ciencia | Retiru',
    'Analizamos la evidencia científica detrás de los retiros de detox y ayuno intermitente: beneficios reales, precauciones y cómo elegir el mejor.',
    76
  ) ON CONFLICT (slug) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ARTÍCULO 4: Meditación guiada para principiantes
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO blog_articles (
    title_es, title_en, slug, excerpt_es, excerpt_en,
    content_es, content_en, category_id, author_id,
    cover_image_url, read_time_min, is_published, published_at,
    meta_title_es, meta_description_es, view_count
  ) VALUES (
    'Meditación guiada para principiantes: 5 técnicas que funcionan',
    'Guided meditation for beginners: 5 techniques that work',
    'meditacion-guiada-principiantes',
    'No necesitas experiencia previa. Estas cinco técnicas de meditación están diseñadas para quienes nunca han meditado.',
    'You don''t need previous experience. These five meditation techniques are designed for those who have never meditated.',
    'La meditación puede parecer intimidante al principio. Sentarse en silencio, no pensar en nada, mantener la mente en blanco... Son ideas preconcebidas que alejan a muchas personas de una práctica que podría cambiar su vida. La realidad es que meditar no consiste en dejar la mente en blanco, sino en aprender a observar tus pensamientos sin juzgarlos.

¿Por qué meditar?

Los beneficios de la meditación regular están ampliamente documentados por la ciencia. Reduce el estrés y la ansiedad, mejora la concentración, favorece el sueño reparador, fortalece el sistema inmune y aumenta la sensación general de bienestar. Y lo mejor: puedes empezar con solo 5 minutos al día.

Técnica 1: Meditación de respiración consciente

La más sencilla y poderosa. Siéntate cómodamente, cierra los ojos y lleva toda tu atención a la respiración. Nota cómo entra el aire por la nariz, cómo se expande tu abdomen, cómo sale el aire lentamente. Cuando tu mente se distraiga (y lo hará), simplemente vuelve a la respiración sin juzgarte. Empieza con 5 minutos y ve aumentando gradualmente.

Técnica 2: Body scan o escáner corporal

Acuéstate boca arriba y lleva tu atención a cada parte del cuerpo, empezando por los pies y subiendo hasta la coronilla. Nota las sensaciones en cada zona: tensión, calor, cosquilleo, pesadez... No intentes cambiar nada, solo observa. Esta técnica es excelente para antes de dormir.

Técnica 3: Meditación de visualización

Cierra los ojos e imagina un lugar que te transmita paz: una playa al atardecer, un bosque en otoño, una montaña nevada. Visualiza cada detalle con todos tus sentidos: los colores, los sonidos, los olores, la temperatura. Permanece en ese lugar mental durante 10-15 minutos.

Técnica 4: Meditación caminando

Perfecta para quienes no pueden estar quietos. Camina lentamente prestando atención a cada paso: cómo se levanta el pie, cómo se mueve hacia adelante, cómo contacta con el suelo. Puedes practicarla en un parque, en la playa o en el pasillo de tu casa.

Técnica 5: Meditación de gratitud

Al despertar o antes de dormir, piensa en tres cosas por las que estés agradecido/a. Pueden ser simples: un café caliente, una conversación con un amigo, un rayo de sol. Siéntelo de verdad, no solo lo pienses. Esta práctica reprograma tu cerebro hacia lo positivo.

El siguiente paso: un retiro de meditación

Si quieres profundizar en tu práctica, un retiro de meditación puede ser una experiencia transformadora. En un entorno sin distracciones, con guía profesional y rodeado de personas con inquietudes similares, la meditación alcanza otro nivel. En Retiru encontrarás retiros de meditación para todos los niveles, desde fin de semana hasta retiros de silencio de una semana.',
    'Meditation may seem intimidating at first. But the reality is that meditating is not about emptying your mind, but learning to observe your thoughts without judging them.',
    cat_bienestar, author,
    'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200&q=80',
    7, true, NOW(),
    'Meditación guiada para principiantes: 5 técnicas | Retiru',
    'Descubre 5 técnicas de meditación para principiantes que puedes empezar a practicar hoy mismo, sin experiencia previa.',
    112
  ) ON CONFLICT (slug) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════
  -- ARTÍCULO 5: Yoga aéreo, la tendencia de 2026
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO blog_articles (
    title_es, title_en, slug, excerpt_es, excerpt_en,
    content_es, content_en, category_id, author_id,
    cover_image_url, read_time_min, is_published, published_at,
    meta_title_es, meta_description_es, view_count
  ) VALUES (
    'Yoga aéreo: la tendencia que está revolucionando los retiros en 2026',
    'Aerial yoga: the trend revolutionizing retreats in 2026',
    'yoga-aereo-tendencia-2026',
    'Cada vez más retiros incorporan el yoga aéreo en sus programas. Te contamos por qué y dónde encontrar los mejores en España.',
    'More and more retreats are incorporating aerial yoga into their programs. We tell you why and where to find the best ones in Spain.',
    'El yoga aéreo, también conocido como antigravity yoga, ha pasado de ser una disciplina de nicho a convertirse en una de las prácticas más demandadas en los retiros de bienestar de 2026. Combinando asanas tradicionales con un columpio de tela suspendido, esta modalidad ofrece una experiencia única que atrae tanto a yoguis experimentados como a principiantes curiosos.

¿Qué es el yoga aéreo?

El yoga aéreo utiliza un columpio o hamaca de tela suspendida del techo para realizar posturas de yoga adaptadas. La tela actúa como soporte, permitiendo realizar inversiones, extensiones y posturas de equilibrio que serían muy difíciles o imposibles en el suelo. La sensación de flotar añade un componente lúdico y liberador a la práctica.

Beneficios del yoga aéreo

Los beneficios del yoga aéreo van más allá de lo físico:

• Descompresión de la columna vertebral gracias a las inversiones asistidas
• Mayor flexibilidad al poder profundizar en las posturas con la ayuda de la tela
• Fortalecimiento del core y la musculatura profunda
• Mejora del equilibrio y la propiocepción
• Reducción del estrés y la ansiedad (la sensación de mecerse tiene un efecto calmante natural)
• Diversión: es imposible no sonreír cuando flotas en el aire

¿Es para principiantes?

Absolutamente sí. De hecho, muchas personas que nunca han practicado yoga descubren la disciplina a través del yoga aéreo, precisamente porque la tela facilita muchas posturas que en el suelo requieren más fuerza o flexibilidad. Los retiros que incluyen yoga aéreo suelen ofrecer sesiones adaptadas a todos los niveles.

Los mejores destinos para yoga aéreo en España

Lanzarote se ha posicionado como el destino estrella para retiros de yoga aéreo, gracias a sus paisajes volcánicos que crean un telón de fondo espectacular para las sesiones al aire libre. Ibiza y Mallorca también cuentan con una oferta creciente de retiros que incluyen esta modalidad.

Qué esperar en un retiro de yoga aéreo

Un retiro típico de yoga aéreo dura entre 4 y 7 días e incluye una o dos sesiones diarias de yoga aéreo, complementadas con yoga en suelo, meditación y actividades al aire libre. El equipamiento siempre lo proporciona el centro, así que solo necesitas ropa cómoda ajustada y muchas ganas de volar.

En Retiru puedes buscar retiros que incluyan yoga aéreo y reservar con total transparencia de precios. ¡Anímate a probar algo diferente!',
    'Aerial yoga has gone from being a niche discipline to becoming one of the most sought-after practices in 2026 wellness retreats.',
    cat_guias, author,
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&q=80',
    5, true, NOW(),
    'Yoga aéreo: la tendencia en retiros de 2026 | Retiru',
    'Descubre por qué el yoga aéreo está revolucionando los retiros de bienestar y dónde encontrar los mejores en España.',
    67
  ) ON CONFLICT (slug) DO NOTHING;

END $$;
