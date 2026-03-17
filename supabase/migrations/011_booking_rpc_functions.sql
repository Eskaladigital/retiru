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

-- Generar booking_number único
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    result := 'RT-' || TO_CHAR(NOW(), 'YYMM') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_number = result) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
