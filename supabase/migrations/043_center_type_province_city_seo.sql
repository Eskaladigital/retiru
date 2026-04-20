-- 043_center_type_province_city_seo.sql
--
-- Amplía la tabla center_type_province_seo con soporte para
-- ciudades (barrios/distritos) dentro de una provincia, para
-- alimentar las landings /es/centros/[tipo]/[provincia]/[ciudad].
--
-- Cambios:
--   1. Añade columna city_slug TEXT NULL y city_name TEXT NULL.
--   2. Reemplaza el UNIQUE (type, province_slug) por dos índices
--      únicos parciales, uno para provincial (city_slug IS NULL)
--      y otro para ciudad (city_slug IS NOT NULL).
--   3. Añade índice de lookup por triple.
--
-- Datos existentes: todas las filas actuales son "provincial"
-- (city_slug quedará NULL). Son 97 pares activos al momento de
-- esta migración.

ALTER TABLE center_type_province_seo
  ADD COLUMN IF NOT EXISTS city_slug TEXT,
  ADD COLUMN IF NOT EXISTS city_name TEXT;

-- Quitar el UNIQUE viejo (permitir múltiples filas con misma
-- (type, province_slug) distinguiéndose por city_slug).
ALTER TABLE center_type_province_seo
  DROP CONSTRAINT IF EXISTS center_type_province_seo_unique;

-- Unique parcial para provincial (una fila por tipo+provincia sin ciudad).
CREATE UNIQUE INDEX IF NOT EXISTS center_type_province_seo_province_unique
  ON center_type_province_seo (type, province_slug)
  WHERE city_slug IS NULL;

-- Unique parcial para ciudad (una fila por tipo+provincia+ciudad).
CREATE UNIQUE INDEX IF NOT EXISTS center_type_province_seo_city_unique
  ON center_type_province_seo (type, province_slug, city_slug)
  WHERE city_slug IS NOT NULL;

-- Índice de lookup por triple (incluye NULL).
CREATE INDEX IF NOT EXISTS idx_center_type_province_seo_triple
  ON center_type_province_seo (type, province_slug, city_slug);
