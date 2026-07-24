-- 051: Eventos periódicos (series con ocurrencias).
-- Una serie define la recurrencia (cada N días) y cada fecha es una fila
-- normal de retreats (ocurrencia) con sus propias reservas y aforo.
-- is_series_next marca la ocurrencia futura más próxima de cada serie,
-- que es la única que aparece en listados públicos (los eventos no
-- periódicos quedan en true por defecto).

CREATE TABLE IF NOT EXISTS retreat_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  master_retreat_id UUID REFERENCES retreats(id) ON DELETE SET NULL,
  interval_days INT NOT NULL CHECK (interval_days BETWEEN 1 AND 90),
  occurrences_ahead INT NOT NULL DEFAULT 4 CHECK (occurrences_ahead BETWEEN 1 AND 8),
  series_end_date DATE,
  skip_dates DATE[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE retreats ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES retreat_series(id) ON DELETE SET NULL;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS is_series_next BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_rt_series ON retreats(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_series_org ON retreat_series(organizer_id);
CREATE INDEX IF NOT EXISTS idx_series_active ON retreat_series(is_active) WHERE is_active = true;

ALTER TABLE retreat_series ENABLE ROW LEVEL SECURITY;

-- El organizador ve y gestiona sus series; los admins todo. Las escrituras de
-- ocurrencias se hacen con service role desde el servidor.
DROP POLICY IF EXISTS "series_own" ON retreat_series;
CREATE POLICY "series_own" ON retreat_series FOR SELECT
  USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = retreat_series.organizer_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "series_adm" ON retreat_series;
CREATE POLICY "series_adm" ON retreat_series FOR SELECT USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "series_upd_own" ON retreat_series;
CREATE POLICY "series_upd_own" ON retreat_series FOR UPDATE
  USING (EXISTS(SELECT 1 FROM organizer_profiles WHERE id = retreat_series.organizer_id AND user_id = auth.uid()));

COMMENT ON TABLE retreat_series IS 'Series de eventos periódicos: recurrencia cada interval_days, horizonte de occurrences_ahead fechas publicadas, skip_dates = fechas cerradas (vacaciones).';
COMMENT ON COLUMN retreats.is_series_next IS 'true en la próxima ocurrencia de cada serie (y en todos los eventos no periódicos); los listados públicos filtran por esta columna.';
