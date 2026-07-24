-- ============================================================================
-- RETIRU · Migración 011 — Funciones RPC para gestión de bookings
-- ============================================================================

-- Incrementar confirmed_bookings de un retiro (al confirmar reserva)
CREATE OR REPLACE FUNCTION increment_confirmed_bookings(retreat_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET confirmed_bookings = confirmed_bookings + 1,
      updated_at = NOW()
  WHERE id = retreat_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrementar confirmed_bookings de un retiro (al cancelar/reembolsar)
CREATE OR REPLACE FUNCTION decrement_confirmed_bookings(retreat_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE retreats
  SET confirmed_bookings = GREATEST(confirmed_bookings - 1, 0),
      updated_at = NOW()
  WHERE id = retreat_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTA (2026-07-24): esta migración incluía una redefinición de
-- generate_booking_number() como RETURNS TEXT, que chocaba con la función de
-- trigger del mismo nombre creada en 001 (RETURNS TRIGGER, usada por tr_bk_num).
-- Postgres rechazaba el cambio de tipo de retorno y la transacción entera se
-- revertía, dejando también sin crear las dos funciones de arriba.
-- La versión TEXT no la usa ningún código (el booking_number se genera en la
-- app y el trigger de 001 sigue vigente), así que se elimina de la migración.
