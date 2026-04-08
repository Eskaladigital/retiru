-- ============================================================================
-- RETIRU · Migración 024 — Backfill: min_attendees = max_attendees en retiros
-- Los retiros creados antes del flujo "mínimo viable" suelen tener min_attendees
-- en DEFAULT 1 (no NULL). Se iguala el mínimo viable al cupo total para que el
-- comportamiento de negocio quede alineado con "pleno = mínimo" en datos legacy.
-- ============================================================================

UPDATE retreats
SET min_attendees = max_attendees,
    updated_at = NOW()
WHERE max_attendees >= 1;
