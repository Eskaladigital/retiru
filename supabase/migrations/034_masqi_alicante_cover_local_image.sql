-- Portada del centro MasQi Yoga & Wellness - Alicante: asset en public/images/centros
UPDATE centers
SET
  cover_url = '/images/centros/masqi_alicante_ciudad.webp',
  updated_at = now()
WHERE slug = 'masqi-yoga-wellness-alicante';
