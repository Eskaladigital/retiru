-- 048 · Datos de Google Places en centros (SEO fichas de centro)
-- Reseñas reales y horario estructurado para enriquecer la ficha pública
-- (sección «Opiniones de Google», horario visible y JSON-LD LocalBusiness
-- con openingHoursSpecification + review). Se rellenan con el script
-- `npm run centers:places-sync` (Places API v1, GOOGLE_PLACES_API_KEY).
--
-- google_reviews: array de objetos
--   { author, rating, text, relative_time, publish_time }
-- google_opening_hours: objeto
--   { weekday_descriptions: string[], periods: [{ open: {day,hour,minute}, close: {day,hour,minute} }] }

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS google_reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_opening_hours JSONB,
  ADD COLUMN IF NOT EXISTS google_data_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN centers.google_reviews IS 'Reseñas de Google Places (hasta 5) mostradas en la ficha pública';
COMMENT ON COLUMN centers.google_opening_hours IS 'Horario regular de Google Places: weekday_descriptions + periods (para openingHoursSpecification)';
COMMENT ON COLUMN centers.google_data_synced_at IS 'Última sincronización con Places API (centers:places-sync)';
