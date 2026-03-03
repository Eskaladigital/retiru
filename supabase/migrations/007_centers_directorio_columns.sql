-- Añadir columnas del directorio CSV a centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS google_types TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS google_status TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS web_valid_ia TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS quality_ia TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS search_terms TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS price_level TEXT;

CREATE INDEX IF NOT EXISTS idx_centers_google_place_id ON centers(google_place_id) WHERE google_place_id IS NOT NULL;
