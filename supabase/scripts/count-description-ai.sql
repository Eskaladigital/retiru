-- ============================================================================
-- RETIRU · Contar centros con descripción generada por IA
-- Ejecutar en Supabase SQL Editor o: psql $DATABASE_URL -f supabase/scripts/count-description-ai.sql
-- ============================================================================

-- Resumen: cuántos tienen descripción IA vs manual vs sin descripción
SELECT
  COUNT(*) FILTER (WHERE description_ai_generated_at IS NOT NULL) AS "con_descripcion_ia",
  COUNT(*) FILTER (WHERE description_ai_generated_at IS NULL AND COALESCE(LENGTH(description_es), 0) >= 400) AS "con_descripcion_manual",
  COUNT(*) FILTER (WHERE COALESCE(LENGTH(description_es), 0) < 400 OR description_es IS NULL) AS "sin_descripcion_util",
  COUNT(*) AS "total"
FROM centers;

-- Detalle: centros con descripción IA (últimos generados)
SELECT
  name,
  city,
  LENGTH(description_es) AS chars,
  description_ai_generated_at::date AS fecha_ia
FROM centers
WHERE description_ai_generated_at IS NOT NULL
ORDER BY description_ai_generated_at DESC
LIMIT 20;
