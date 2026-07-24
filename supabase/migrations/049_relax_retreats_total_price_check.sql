-- 049: Relajar el mínimo de PVP en retreats.
-- El CHECK original (total_price >= 50) era de cuando solo existían retiros;
-- ahora la plataforma admite talleres y escapadas de menor importe.
-- Se mantiene la exigencia de que el precio sea positivo.

ALTER TABLE retreats DROP CONSTRAINT IF EXISTS retreats_total_price_check;
ALTER TABLE retreats ADD CONSTRAINT retreats_total_price_check CHECK (total_price > 0);
