-- 039 · Extensión de mailing_campaigns para el CRM de mails en /administrator
--
-- Motivación: el panel /administrator/mails necesita poder
--   · guardar el HTML de cada campaña EN BD (la carpeta mailing/ está en
--     .gitignore y el cron en Vercel no tiene acceso al filesystem del repo),
--   · pausar/reanudar una campaña desde la UI,
--   · configurar el tope horario y el tamaño de lote por tick del cron,
--   · registrar lo que se pidió a la IA para reproducir la generación.

-- ──────────────────────────────────────────────────────────────────────────
-- 1) Nuevas columnas
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE mailing_campaigns
  ADD COLUMN IF NOT EXISTS html_content           TEXT,
  ADD COLUMN IF NOT EXISTS is_paused              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_per_hour           INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS batch_size_per_tick    INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS generation_prompt      TEXT,
  ADD COLUMN IF NOT EXISTS generation_reference_ids UUID[],
  ADD COLUMN IF NOT EXISTS last_tick_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_tick_note         TEXT;

-- Sanos por defecto y checks defensivos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mailing_campaigns_max_per_hour_chk'
  ) THEN
    ALTER TABLE mailing_campaigns
      ADD CONSTRAINT mailing_campaigns_max_per_hour_chk
      CHECK (max_per_hour BETWEEN 1 AND 5000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mailing_campaigns_batch_size_chk'
  ) THEN
    ALTER TABLE mailing_campaigns
      ADD CONSTRAINT mailing_campaigns_batch_size_chk
      CHECK (batch_size_per_tick BETWEEN 1 AND 50);
  END IF;
END $$;

-- Hacer template_file opcional: las campañas creadas desde el panel pueden no
-- tener archivo físico (viven solo en BD). Las antiguas lo conservan.
ALTER TABLE mailing_campaigns
  ALTER COLUMN template_file DROP NOT NULL;

-- Índice para que el cron encuentre rápido las campañas activas.
CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_sending_active
  ON mailing_campaigns (status)
  WHERE status = 'sending' AND is_paused = FALSE;

-- ──────────────────────────────────────────────────────────────────────────
-- 2) Rehacer la vista de stats para exponer todos los campos que usa el panel
-- ──────────────────────────────────────────────────────────────────────────
--
-- OJO: PostgreSQL solo permite CREATE OR REPLACE VIEW si añadimos columnas al
-- final, sin renombrar ni reordenar. La vista de la 038 tenía
-- (id, slug, number, template_file, subject, status, …) y aquí queremos
-- intercalar 'description', 'is_paused', etc. Por eso hay que dropearla y
-- recrearla. Ningún código persistente depende de su definición exacta: el
-- panel y el cron la consultan por nombre de columna.

DROP VIEW IF EXISTS mailing_campaigns_stats;

CREATE VIEW mailing_campaigns_stats AS
SELECT
  c.id,
  c.slug,
  c.number,
  c.template_file,
  c.subject,
  c.description,
  c.status,
  c.is_paused,
  c.max_per_hour,
  c.batch_size_per_tick,
  c.audience_filter,
  c.total_recipients,
  c.sent_count,
  c.failed_count,
  c.skipped_count,
  c.generation_prompt,
  c.generation_reference_ids,
  c.last_tick_at,
  c.last_tick_note,
  c.created_at,
  c.started_at,
  c.completed_at,
  c.archived_at,
  (c.html_content IS NOT NULL AND length(c.html_content) > 0) AS has_html,
  COUNT(r.*)                                                   AS recipients,
  COUNT(*) FILTER (WHERE r.status = 'pending')                 AS pending,
  COUNT(*) FILTER (WHERE r.status = 'sent')                    AS sent,
  COUNT(*) FILTER (WHERE r.status = 'failed')                  AS failed,
  COUNT(*) FILTER (WHERE r.status = 'skipped_opt_out')         AS skipped_opt_out,
  COUNT(*) FILTER (WHERE r.status = 'skipped_no_email')        AS skipped_no_email,
  COUNT(*) FILTER (WHERE r.status = 'bounced')                 AS bounced
FROM mailing_campaigns c
LEFT JOIN mailing_recipients r ON r.campaign_id = c.id
GROUP BY c.id;
