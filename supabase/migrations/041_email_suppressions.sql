-- ============================================================================
-- 041 · email_suppressions (lista de bajas de marketing por email)
-- ============================================================================
-- Motivación: /api/unsubscribe admite ahora baja manual introduciendo un
-- email. Además de marcar los `centers` que coincidan con ese email como
-- `marketing_opt_out_at = now()`, guardamos el email en una tabla global de
-- bajas. Así, si más adelante se da de alta un nuevo centro con ese mismo
-- email, el mailing lo descartará sin necesidad de volver a solicitar la baja.
--
-- Operación exclusivamente con service_role (igual que mailing_campaigns y
-- mailing_recipients). Sin políticas RLS => anon/auth no pueden leer ni
-- escribir.

CREATE TABLE IF NOT EXISTS email_suppressions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  reason      TEXT,
  source      TEXT        NOT NULL DEFAULT 'self',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_suppressions_source_chk'
  ) THEN
    ALTER TABLE email_suppressions
      ADD CONSTRAINT email_suppressions_source_chk
      CHECK (source IN ('self', 'admin', 'bounce', 'complaint'));
  END IF;
END $$;

-- Índice único case-insensitive para que la comparación con centers.email no
-- dependa de mayúsculas/minúsculas ni espacios sobrantes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_suppressions_email_lower
  ON email_suppressions (LOWER(TRIM(email)));

ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_suppressions IS
  'Emails dados de baja de marketing. El selector de destinatarios del mailing '
  'descarta cualquier center.email que aparezca aquí (comparación en LOWER/TRIM).';
