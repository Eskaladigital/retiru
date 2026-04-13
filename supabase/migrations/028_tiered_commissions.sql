-- ============================================================================
-- 028 · Comisiones escalonadas por retiro del organizador
--
-- Modelo:
--   1.er retiro con reserva pagada →  0 % comisión (100 % organizador)
--   2.º retiro con reserva pagada → 10 % comisión  (90 % organizador)
--   3.er retiro en adelante        → 20 % comisión  (80 % organizador)
--
-- Cada retiro mantiene de forma permanente su nivel de comisión.
-- ============================================================================

-- 1. Añadir columna commission_percent ANTES de tocar las generadas
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(4,2) NOT NULL DEFAULT 20;

-- 2. Guardar valores actuales en columnas temporales
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS _tmp_pf NUMERIC(10,2);
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS _tmp_oa NUMERIC(10,2);
UPDATE retreats SET _tmp_pf = platform_fee, _tmp_oa = organizer_amount;

-- 3. Eliminar columnas GENERATED y recrear como normales
ALTER TABLE retreats DROP COLUMN platform_fee;
ALTER TABLE retreats DROP COLUMN organizer_amount;
ALTER TABLE retreats ADD COLUMN platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE retreats ADD COLUMN organizer_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 4. Restaurar valores y eliminar temporales
UPDATE retreats SET platform_fee = COALESCE(_tmp_pf, ROUND(total_price * 0.20, 2)),
                    organizer_amount = COALESCE(_tmp_oa, ROUND(total_price * 0.80, 2));
ALTER TABLE retreats DROP COLUMN _tmp_pf;
ALTER TABLE retreats DROP COLUMN _tmp_oa;

-- 5. Función helper: porcentaje de comisión según retiros previos con reservas pagadas
CREATE OR REPLACE FUNCTION get_organizer_commission_percent(p_organizer_id UUID, p_exclude_retreat_id UUID DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
  paid_count INT;
BEGIN
  SELECT COUNT(DISTINCT r.id) INTO paid_count
  FROM retreats r
  WHERE r.organizer_id = p_organizer_id
    AND r.status IN ('published', 'archived', 'cancelled')
    AND r.confirmed_bookings > 0
    AND (p_exclude_retreat_id IS NULL OR r.id != p_exclude_retreat_id);

  IF paid_count = 0 THEN RETURN 0;
  ELSIF paid_count = 1 THEN RETURN 10;
  ELSE RETURN 20;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Trigger: al cambiar total_price o commission_percent, recalcular platform_fee y organizer_amount
CREATE OR REPLACE FUNCTION recalc_retreat_fees() RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee := ROUND(NEW.total_price * (NEW.commission_percent / 100), 2);
  NEW.organizer_amount := ROUND(NEW.total_price * (1 - NEW.commission_percent / 100), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalc_retreat_fees ON retreats;
CREATE TRIGGER tr_recalc_retreat_fees
  BEFORE INSERT OR UPDATE OF total_price, commission_percent ON retreats
  FOR EACH ROW EXECUTE FUNCTION recalc_retreat_fees();

-- 7. Forzar recálculo de todos los retiros existentes para que el trigger rellene bien
UPDATE retreats SET commission_percent = 20;

-- 8. Documentar los tiers en admin_config
UPDATE admin_config SET value = '{"tiers":[{"min_paid_retreats":0,"percent":0},{"min_paid_retreats":1,"percent":10},{"min_paid_retreats":2,"percent":20}]}'::jsonb WHERE key = 'platform_fee_percent';
