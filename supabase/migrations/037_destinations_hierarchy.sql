-- 037 · Jerarquía geográfica en destinations
-- Añade niveles país / comunidad autónoma / provincia / destino a la tabla.
--   kind: 'country' | 'region' | 'province' | 'destination'
--   parent_slug: slug del nivel superior (FK suave por slug para evitar ciclos
--                y permitir seeds/borrados sin romper integridad referencial)

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'destination',
  ADD COLUMN IF NOT EXISTS parent_slug TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'destinations_kind_chk'
  ) THEN
    ALTER TABLE destinations
      ADD CONSTRAINT destinations_kind_chk
      CHECK (kind IN ('country', 'region', 'province', 'destination'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_destinations_kind ON destinations(kind);
CREATE INDEX IF NOT EXISTS idx_destinations_parent_slug ON destinations(parent_slug);
CREATE INDEX IF NOT EXISTS idx_destinations_active_kind ON destinations(is_active, kind);
