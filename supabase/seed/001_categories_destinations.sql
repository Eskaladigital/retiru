-- ============================================================================
-- RETIRU · Seed: Categorías, Destinos, Datos demo
-- ============================================================================

-- Categorías
INSERT INTO categories (name_es, name_en, slug, icon, sort_order) VALUES
  ('Yoga', 'Yoga', 'yoga', '🧘', 1),
  ('Meditación', 'Meditation', 'meditacion', '🙏', 2),
  ('Ayurveda', 'Ayurveda', 'ayurveda', '🪷', 11),
  ('Detox', 'Detox', 'detox', '🌿', 3),
  ('Naturaleza', 'Nature', 'naturaleza', '🏔️', 4),
  ('Gastronomía', 'Gastronomy', 'gastronomia', '🍷', 5),
  ('Wellness', 'Wellness', 'wellness', '💆', 6),
  ('Aventura', 'Adventure', 'aventura', '🏄', 7),
  ('Silencio', 'Silent Retreat', 'silencio', '🤫', 8),
  ('Arte y Creatividad', 'Art & Creativity', 'arte-creatividad', '🎨', 9),
  ('Desarrollo Personal', 'Personal Growth', 'desarrollo-personal', '✨', 10);

-- Destinos
INSERT INTO destinations (name_es, name_en, slug, country, region, latitude, longitude, sort_order) VALUES
  ('Ibiza', 'Ibiza', 'ibiza', 'ES', 'Islas Baleares', 38.9067, 1.4206, 1),
  ('Mallorca', 'Mallorca', 'mallorca', 'ES', 'Islas Baleares', 39.6953, 3.0176, 2),
  ('Costa Brava', 'Costa Brava', 'costa-brava', 'ES', 'Cataluña', 41.8520, 3.1209, 3),
  ('Sierra de Gredos', 'Sierra de Gredos', 'sierra-gredos', 'ES', 'Castilla y León', 40.2596, -5.2377, 4),
  ('Alpujarra', 'Alpujarra', 'alpujarra', 'ES', 'Andalucía', 36.9256, -3.3562, 5),
  ('Picos de Europa', 'Picos de Europa', 'picos-europa', 'ES', 'Asturias', 43.1959, -4.8437, 6),
  ('Valle del Jerte', 'Jerte Valley', 'valle-jerte', 'ES', 'Extremadura', 40.2218, -5.7628, 7),
  ('Lanzarote', 'Lanzarote', 'lanzarote', 'ES', 'Islas Canarias', 29.0469, -13.5899, 8),
  ('Pirineos', 'Pyrenees', 'pirineos', 'ES', 'Aragón', 42.6320, 0.0100, 9),
  ('Murcia', 'Murcia', 'murcia', 'ES', 'Región de Murcia', 37.9922, -1.1307, 10),
  ('Formentera', 'Formentera', 'formentera', 'ES', 'Islas Baleares', 38.7083, 1.4368, 11),
  ('Cabo de Gata', 'Cabo de Gata', 'cabo-de-gata', 'ES', 'Andalucía', 36.7645, -2.2288, 12);
