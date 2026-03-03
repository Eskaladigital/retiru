-- ============================================================================
-- RETIRU · Rastrear descripciones generadas por IA en centros
-- ============================================================================

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS description_ai_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN centers.description_ai_generated_at IS 'Fecha en que se generó la descripción con IA (API generate-center-descriptions)';
