-- 042: Contenido SEO editorial por par (tipo de centro, provincia).
--
-- Permite que cada landing /es/centros/[tipo]/[provincia] (y espejo EN) tenga
-- un intro único, FAQ propio y metadatos SEO diferenciados del nivel nacional
-- (categories.intro_*), evitando duplicación de contenido entre
-- /es/centros/yoga y /es/centros/yoga/madrid.
--
-- El contenido se genera con IA (scripts/generate-center-type-province-seo.mjs)
-- a partir del dossier de centros reales de cada par (nombres, ciudades, estilos)
-- y se puede editar manualmente después.
CREATE TABLE IF NOT EXISTS center_type_province_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  province_slug TEXT NOT NULL,
  province_name TEXT NOT NULL,
  intro_es TEXT,
  intro_en TEXT,
  meta_title_es TEXT,
  meta_title_en TEXT,
  meta_description_es TEXT,
  meta_description_en TEXT,
  faq_es JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT center_type_province_seo_type_check CHECK (type IN ('yoga', 'meditation', 'ayurveda')),
  CONSTRAINT center_type_province_seo_unique UNIQUE (type, province_slug)
);

CREATE INDEX IF NOT EXISTS idx_center_type_province_seo_lookup
  ON center_type_province_seo (type, province_slug);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION center_type_province_seo_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_center_type_province_seo_touch ON center_type_province_seo;
CREATE TRIGGER trg_center_type_province_seo_touch
  BEFORE UPDATE ON center_type_province_seo
  FOR EACH ROW EXECUTE FUNCTION center_type_province_seo_touch_updated_at();

-- RLS: lectura pública (contenido SEO se sirve en páginas públicas).
-- Escritura solo desde el service role (scripts) / admin (cuando se añada UI).
ALTER TABLE center_type_province_seo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "center_type_province_seo_public_read" ON center_type_province_seo;
CREATE POLICY "center_type_province_seo_public_read"
  ON center_type_province_seo FOR SELECT
  USING (true);
