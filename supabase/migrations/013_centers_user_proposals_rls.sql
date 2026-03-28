-- Paso 2/2: columna, índices y RLS (ejecutar después de 012; ya existe el valor pending_review).

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_centers_submitted_by ON centers(submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_centers_pending_review ON centers(status) WHERE status = 'pending_review';

DROP POLICY IF EXISTS "ctr_submitted" ON centers;
CREATE POLICY "ctr_submitted" ON centers FOR SELECT
  USING (submitted_by = auth.uid() AND status = 'pending_review');
