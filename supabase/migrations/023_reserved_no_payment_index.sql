-- ============================================================================
-- RETIRU · Migración 023 — Índice parcial para reservas sin pago
-- Separada de 022 porque PostgreSQL requiere que el enum value esté committed
-- antes de poder usarlo en una cláusula WHERE.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bk_reserved
  ON bookings(retreat_id) WHERE status = 'reserved_no_payment';
