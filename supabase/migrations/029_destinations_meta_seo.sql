-- 029: Añadir campos meta SEO a destinations para landings programáticas
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS meta_title_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
