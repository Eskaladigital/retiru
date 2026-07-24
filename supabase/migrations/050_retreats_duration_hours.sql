-- 050: Duración en horas para eventos de un solo día.
-- Cuando start_date = end_date el organizador indica cuántas horas dura
-- (p. ej. 3 = clase de yoga al atardecer). En eventos de varios días queda NULL
-- y se sigue mostrando la duración en días calculada con las fechas.

ALTER TABLE retreats ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(4,1) CHECK (duration_hours > 0);

COMMENT ON COLUMN retreats.duration_hours IS 'Duración en horas para eventos de un día (start_date = end_date). NULL en eventos de varios días.';
