-- 036 · Trazabilidad del email de los centros
-- Añade columnas para registrar cómo se obtuvo cada email:
--   email_source: origen ('web' | 'places' | 'serp' | 'llm' | 'csv' | 'manual' | 'ig' | 'fb')
--   email_source_url: URL exacta donde apareció (prueba/auditoría y RGPD)
--   email_confidence: 0.00–1.00 (ranking del agente)
--   email_found_at: cuándo se localizó

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS email_source TEXT,
  ADD COLUMN IF NOT EXISTS email_source_url TEXT,
  ADD COLUMN IF NOT EXISTS email_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS email_found_at TIMESTAMPTZ;

-- Restringe los posibles valores de email_source (solo cuando hay valor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'centers_email_source_chk'
  ) THEN
    ALTER TABLE centers
      ADD CONSTRAINT centers_email_source_chk
      CHECK (
        email_source IS NULL OR email_source IN (
          'web', 'places', 'serp', 'llm', 'csv', 'manual', 'ig', 'fb'
        )
      );
  END IF;
END $$;

-- Rango de confianza 0–1 si hay valor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'centers_email_confidence_chk'
  ) THEN
    ALTER TABLE centers
      ADD CONSTRAINT centers_email_confidence_chk
      CHECK (
        email_confidence IS NULL OR (email_confidence >= 0 AND email_confidence <= 1)
      );
  END IF;
END $$;

-- Índice útil para reprocesar: centros sin email (o con baja confianza)
CREATE INDEX IF NOT EXISTS idx_centers_no_email
  ON centers ((COALESCE(NULLIF(email, ''), NULL)))
  WHERE email IS NULL OR email = '';

CREATE INDEX IF NOT EXISTS idx_centers_email_low_conf
  ON centers (email_confidence)
  WHERE email_confidence IS NOT NULL AND email_confidence < 0.7;
