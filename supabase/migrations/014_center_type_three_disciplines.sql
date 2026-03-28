-- Fase 1 directorio: solo yoga | meditation | ayurveda.
-- Antes de aplicar en producción: ejecutar `npm run centers:reclassify-three -- --update`
-- (reclasificación con IA). Esta migración fuerza filas residuales y sustituye el enum.

-- 1) Coerción de seguridad: todo lo que no sea uno de los tres pasa a yoga (luego la IA/script puede afinar antes si hace falta)
UPDATE centers SET type = CASE type::text
  WHEN 'yoga' THEN 'yoga'::center_type
  WHEN 'meditation' THEN 'meditation'::center_type
  WHEN 'ayurveda' THEN 'ayurveda'::center_type
  ELSE 'yoga'::center_type
END;

CREATE TYPE center_type_new AS ENUM ('yoga', 'meditation', 'ayurveda');

ALTER TABLE centers ALTER COLUMN type DROP DEFAULT;

ALTER TABLE centers
  ALTER COLUMN type TYPE center_type_new
  USING (type::text::center_type_new);

ALTER TABLE centers
  ALTER COLUMN type SET DEFAULT 'yoga'::center_type_new;

DROP TYPE center_type;

ALTER TYPE center_type_new RENAME TO center_type;
