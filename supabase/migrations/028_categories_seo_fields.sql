-- 028: Añadir campos SEO y contenido a categories para landings programáticas
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS intro_es TEXT,
  ADD COLUMN IF NOT EXISTS intro_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
