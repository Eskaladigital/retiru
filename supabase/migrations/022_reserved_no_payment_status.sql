-- ============================================================================
-- RETIRU · Migración 022 — Flujo "reserva sin pago" hasta mínimo viable
-- Añade status reserved_no_payment, columnas de deadline y reminder en bookings.
-- NOTA: El índice parcial que usa el nuevo enum value va en la migración 023
-- porque PostgreSQL no permite usar un enum value recién añadido en la misma TX.
-- ============================================================================

-- 1. Nuevo valor en el enum booking_status
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'reserved_no_payment' BEFORE 'pending_payment';

-- 2. Columna para la fecha límite de pago (se rellena cuando se alcanza min_attendees)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- 3. Flag para controlar si ya se envió el recordatorio de gracia (+24h)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN NOT NULL DEFAULT false;
