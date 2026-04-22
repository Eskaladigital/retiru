-- 045_seo_sections.sql
--
-- Contenido SEO rico por secciones (§8 de docs/SEO-LANDINGS.md).
--
-- Propósito: cada landing programática (Cap. 1 a 5) tendrá ahora un array
-- JSONB `sections_es` / `sections_en` con bloques editoriales diferenciados
-- (why_here, what_to_expect, how_to_choose, history) cada uno con H2 + HTML,
-- más un `faq_expanded` ampliado a 7-10 preguntas. El contenido rico se
-- genera con GPT-4o + SerpApi (PAA + related) a partir de un dossier real de
-- los centros de la combinación.
--
-- Tablas tocadas:
--   · categories                   — Cap. 1 Nacional por tipo
--   · destinations                 — destinos + legado de hub provincial
--   · center_type_province_seo     — Cap. 3 y Cap. 5 (provincial y ciudad)
--   · styles                       — Cap. 2 Nacional por estilo
--   · style_province_seo (nueva)   — Cap. 4 Estilo × Provincia
--
-- Reglas anti-canibalización (§8.4):
--   suppress_reason ∈ (
--     'duplicate_of_parent',               -- ciudad >= 60% provincia (R1)
--     'thin_content',                      -- < umbral mínimo (R2, R4)
--     'dominant_style_educational_only',   -- hatha, abhyanga (R3)
--     'duplicate_province_slug'            -- lerida/lleida, tenerife/santa-cruz (R5)
--   )
--
-- Formato de sections_*:
--   [
--     {"key":"why_here","heading":"Por qué ...","html":"<p>...</p>"},
--     {"key":"what_to_expect","heading":"Qué esperar ...","html":"..."},
--     {"key":"how_to_choose","heading":"Cómo elegir ...","html":"..."},
--     {"key":"history","heading":"Tradición ...","html":"..."}
--   ]
--
-- Formato de serp_data (cache de SerpApi por landing, TTL ~30 días):
--   {
--     "paa": [{"question":"...","snippet":"..."}, ...],
--     "related": ["...", ...],
--     "local_pack": [{"name":"...","rating":4.9}, ...],
--     "featured_snippet": "...",
--     "fetched_at": "2026-04-22T...",
--     "query": "centros de ayurveda Álava",
--     "gl": "es", "hl": "es"
--   }

BEGIN;

-- ── Capa 1 (categories) ─────────────────────────────────────────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sections_es     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_en     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS serp_data       JSONB,
  ADD COLUMN IF NOT EXISTS suppress_reason TEXT;

-- ── Capa 3 y 5 (center_type_province_seo) ───────────────────────────────
ALTER TABLE center_type_province_seo
  ADD COLUMN IF NOT EXISTS sections_es     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_en     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS serp_data       JSONB,
  ADD COLUMN IF NOT EXISTS suppress_reason TEXT;

-- ── Capa 2 (styles) ─────────────────────────────────────────────────────
ALTER TABLE styles
  ADD COLUMN IF NOT EXISTS sections_es     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_en     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS serp_data       JSONB,
  ADD COLUMN IF NOT EXISTS suppress_reason TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_es   TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_en   TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
  ADD COLUMN IF NOT EXISTS faq_es          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq_en          JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── destinations (legado de hub provincial + destinos) ─────────────────
-- La Capa Hub Prov se descarta (§8.1), pero mantenemos los campos por si
-- en el futuro reusamos la tabla para otra landing multi-disciplina.
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS sections_es     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_en     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS serp_data       JSONB,
  ADD COLUMN IF NOT EXISTS suppress_reason TEXT;

-- ── Capa 4 (style_province_seo — TABLA NUEVA) ───────────────────────────
CREATE TABLE IF NOT EXISTS style_province_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_type   TEXT NOT NULL CHECK (center_type IN ('yoga', 'meditation', 'ayurveda')),
  style_slug    TEXT NOT NULL,
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
  sections_es JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  serp_data JSONB,
  suppress_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT style_province_seo_unique UNIQUE (center_type, style_slug, province_slug)
);

CREATE INDEX IF NOT EXISTS idx_style_province_seo_lookup
  ON style_province_seo (center_type, style_slug, province_slug);

-- Trigger: mantener updated_at fresco.
CREATE OR REPLACE FUNCTION style_province_seo_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_style_province_seo_touch ON style_province_seo;
CREATE TRIGGER trg_style_province_seo_touch
  BEFORE UPDATE ON style_province_seo
  FOR EACH ROW EXECUTE FUNCTION style_province_seo_touch_updated_at();

-- RLS: lectura pública; escritura solo desde service role.
ALTER TABLE style_province_seo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "style_province_seo_public_read" ON style_province_seo;
CREATE POLICY "style_province_seo_public_read"
  ON style_province_seo FOR SELECT
  USING (true);

-- ── CHECK de valores admitidos para suppress_reason ─────────────────────
-- (idempotente: usa un DO block para no petar si ya existe).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_suppress_reason_chk'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_suppress_reason_chk
      CHECK (suppress_reason IS NULL OR suppress_reason IN (
        'duplicate_of_parent',
        'thin_content',
        'dominant_style_educational_only',
        'duplicate_province_slug'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'center_type_province_seo_suppress_reason_chk'
  ) THEN
    ALTER TABLE center_type_province_seo
      ADD CONSTRAINT center_type_province_seo_suppress_reason_chk
      CHECK (suppress_reason IS NULL OR suppress_reason IN (
        'duplicate_of_parent',
        'thin_content',
        'dominant_style_educational_only',
        'duplicate_province_slug'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'styles_suppress_reason_chk'
  ) THEN
    ALTER TABLE styles
      ADD CONSTRAINT styles_suppress_reason_chk
      CHECK (suppress_reason IS NULL OR suppress_reason IN (
        'duplicate_of_parent',
        'thin_content',
        'dominant_style_educational_only',
        'duplicate_province_slug'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'destinations_suppress_reason_chk'
  ) THEN
    ALTER TABLE destinations
      ADD CONSTRAINT destinations_suppress_reason_chk
      CHECK (suppress_reason IS NULL OR suppress_reason IN (
        'duplicate_of_parent',
        'thin_content',
        'dominant_style_educational_only',
        'duplicate_province_slug'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'style_province_seo_suppress_reason_chk'
  ) THEN
    ALTER TABLE style_province_seo
      ADD CONSTRAINT style_province_seo_suppress_reason_chk
      CHECK (suppress_reason IS NULL OR suppress_reason IN (
        'duplicate_of_parent',
        'thin_content',
        'dominant_style_educational_only',
        'duplicate_province_slug'
      ));
  END IF;
END $$;

COMMIT;
