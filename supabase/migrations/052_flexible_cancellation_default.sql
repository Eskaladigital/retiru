-- 052: política de cancelación por defecto más flexible (lanzamiento)
-- El default pasa de «standard» (100% >30d / 50% >14d / 0% <7d)
-- a «flexible» (100% >7d / 50% >3d / 0% después).
-- Solo afecta a retiros nuevos; los existentes conservan su política.

ALTER TABLE retreats
  ALTER COLUMN cancellation_policy
  SET DEFAULT '{"type":"flexible","refund_tiers":[{"days_before":7,"refund_percent":100},{"days_before":3,"refund_percent":50},{"days_before":0,"refund_percent":0}],"platform_fee_refundable":false}'::jsonb;
