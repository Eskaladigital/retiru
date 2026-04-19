-- 038 · Sistema de envíos de mailings con trazabilidad y opt-out
--
-- Motivación: llevar control de cada oleada de mailing (plantilla HTML) y de
-- cada destinatario (centro). Registrar quién recibió qué, cuándo, con qué
-- estado, y permitir que un centro se dé de baja.
--
-- Contiene:
--   · mailing_campaigns     → una fila por campaña/oleada
--   · mailing_recipients    → una fila por (campaña, centro)
--   · centers.marketing_opt_out_at / _token / _reason  → RGPD
--
-- Lo operan exclusivamente los scripts locales (service_role). El enlace de
-- baja llama al endpoint /api/unsubscribe que también usa service_role.

-- ──────────────────────────────────────────────────────────────────────────
-- 1) Opt-out de marketing en centers
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS marketing_opt_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_out_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS marketing_opt_out_reason TEXT;

-- Backfill de token para filas existentes (DEFAULT solo aplica a inserts).
UPDATE centers
   SET marketing_opt_out_token = gen_random_uuid()
 WHERE marketing_opt_out_token IS NULL;

ALTER TABLE centers
  ALTER COLUMN marketing_opt_out_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_centers_marketing_opt_out_token
  ON centers (marketing_opt_out_token);

CREATE INDEX IF NOT EXISTS idx_centers_marketing_opt_out_at
  ON centers (marketing_opt_out_at)
  WHERE marketing_opt_out_at IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- 2) Campañas de mailing
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mailing_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  number           INTEGER,                         -- 1, 2, 3… (para nombrar el archivo)
  template_file    TEXT NOT NULL,                   -- p. ej. retiru-crea-tu-evento.html
  subject          TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',   -- draft|sending|sent|archived
  audience_filter  JSONB DEFAULT '{}'::jsonb,       -- p. ej. {"only_claimed":true}
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count       INTEGER NOT NULL DEFAULT 0,
  failed_count     INTEGER NOT NULL DEFAULT 0,
  skipped_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  archived_at      TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mailing_campaigns_status_chk'
  ) THEN
    ALTER TABLE mailing_campaigns
      ADD CONSTRAINT mailing_campaigns_status_chk
      CHECK (status IN ('draft', 'sending', 'sent', 'archived'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_status
  ON mailing_campaigns (status);

CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_created_at
  ON mailing_campaigns (created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- 3) Destinatarios por campaña
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mailing_recipients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES mailing_campaigns(id) ON DELETE CASCADE,
  center_id      UUID REFERENCES centers(id) ON DELETE SET NULL,
  email          TEXT NOT NULL,                    -- snapshot del email en el momento
  nombre_centro  TEXT,                             -- snapshot del nombre
  location       TEXT,                             -- snapshot de city/province
  fin_membresia  TEXT,                             -- snapshot usado en el render
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending|sent|failed|skipped_opt_out|skipped_no_email|bounced
  message_id     TEXT,                             -- id SMTP devuelto por nodemailer
  failed_reason  TEXT,
  sent_at        TIMESTAMPTZ,
  opened_at      TIMESTAMPTZ,                      -- reservado (pixel tracking, fase 2)
  clicked_at     TIMESTAMPTZ,                      -- reservado (link tracking, fase 2)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mailing_recipients_status_chk'
  ) THEN
    ALTER TABLE mailing_recipients
      ADD CONSTRAINT mailing_recipients_status_chk
      CHECK (status IN (
        'pending', 'sent', 'failed',
        'skipped_opt_out', 'skipped_no_email', 'bounced'
      ));
  END IF;
END $$;

-- No reenviar a un mismo centro dentro de la misma campaña.
CREATE UNIQUE INDEX IF NOT EXISTS idx_mailing_recipients_campaign_center
  ON mailing_recipients (campaign_id, center_id)
  WHERE center_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mailing_recipients_status
  ON mailing_recipients (campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_mailing_recipients_email
  ON mailing_recipients (email);

-- Trigger para mantener updated_at fresco.
CREATE OR REPLACE FUNCTION tg_mailing_recipients_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON mailing_recipients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON mailing_recipients
  FOR EACH ROW
  EXECUTE FUNCTION tg_mailing_recipients_set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 4) RLS — sólo service_role; anon/authenticated no acceden
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE mailing_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_recipients ENABLE ROW LEVEL SECURITY;

-- Service role ignora RLS por construcción, así que basta con denegar por
-- defecto al resto (no creamos ninguna policy de lectura para anon/auth).

-- ──────────────────────────────────────────────────────────────────────────
-- 5) Vista resumen cómoda para status
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW mailing_campaigns_stats AS
SELECT
  c.id,
  c.slug,
  c.number,
  c.template_file,
  c.subject,
  c.status,
  c.created_at,
  c.started_at,
  c.completed_at,
  c.archived_at,
  c.total_recipients,
  COUNT(r.*)                                                   AS recipients,
  COUNT(*) FILTER (WHERE r.status = 'pending')                  AS pending,
  COUNT(*) FILTER (WHERE r.status = 'sent')                     AS sent,
  COUNT(*) FILTER (WHERE r.status = 'failed')                   AS failed,
  COUNT(*) FILTER (WHERE r.status = 'skipped_opt_out')          AS skipped_opt_out,
  COUNT(*) FILTER (WHERE r.status = 'skipped_no_email')         AS skipped_no_email,
  COUNT(*) FILTER (WHERE r.status = 'bounced')                  AS bounced
FROM mailing_campaigns c
LEFT JOIN mailing_recipients r ON r.campaign_id = c.id
GROUP BY c.id;
