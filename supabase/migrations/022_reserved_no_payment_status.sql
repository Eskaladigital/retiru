-- ============================================================================
-- RETIRU · Migración 022 — Flujo "reserva sin pago" hasta mínimo viable
-- Añade status reserved_no_payment, columnas de deadline y reminder en bookings.
-- ============================================================================

-- 1. Nuevo valor en el enum booking_status
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'reserved_no_payment' BEFORE 'pending_payment';

-- 2. Columna para la fecha límite de pago (se rellena cuando se alcanza min_attendees)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- 3. Flag para controlar si ya se envió el recordatorio de gracia (+24h)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN NOT NULL DEFAULT false;

-- 4. Índice parcial para contar rápidamente reservas sin pago por retiro
CREATE INDEX IF NOT EXISTS idx_bk_reserved
  ON bookings(retreat_id) WHERE status = 'reserved_no_payment';
