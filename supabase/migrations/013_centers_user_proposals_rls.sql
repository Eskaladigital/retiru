-- Paso 2/2: columna, índices y RLS para propuestas de centro.
--
-- PREREQUISITO OBLIGATORIO: migración 012_centers_user_proposals.sql (valor enum pending_review).
-- Sin 012, esta migración falla al crear el índice/política con:
--   22P02: invalid input value for enum center_status: "pending_review"
--
-- Con Supabase CLI cada archivo es una migración en transacción propia (orden numérico).
-- En SQL Editor: ejecuta 012, pulsa Run; luego 013, Run (nunca pegar 012+013 en un solo bloque).

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_centers_submitted_by ON centers(submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_centers_pending_review ON centers(status) WHERE status = 'pending_review';

DROP POLICY IF EXISTS "ctr_submitted" ON centers;
CREATE POLICY "ctr_submitted" ON centers FOR SELECT
  USING (submitted_by = auth.uid() AND status = 'pending_review');
