-- ============================================================================
-- 010 · Conversaciones de soporte (usuario/organizador → admin)
-- ============================================================================

-- 1) Nuevas columnas
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_support BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_unread INT NOT NULL DEFAULT 0;

-- 2) Hacer nullable organizer_id y attendee_id (en soporte no hay organizador)
ALTER TABLE conversations
  ALTER COLUMN organizer_id DROP NOT NULL,
  ALTER COLUMN attendee_id DROP NOT NULL;

-- 3) Índice único: un solo chat de soporte por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_support_user
  ON conversations(user_id)
  WHERE is_support = true;

-- 4) Actualizar RLS de conversations para soporte
DROP POLICY IF EXISTS "cv_select" ON conversations;
CREATE POLICY "cv_select" ON conversations FOR SELECT USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
  OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cv_insert" ON conversations;
CREATE POLICY "cv_insert" ON conversations FOR INSERT WITH CHECK (
  user_id = auth.uid() OR attendee_id = auth.uid()
);

DROP POLICY IF EXISTS "cv_update" ON conversations;
CREATE POLICY "cv_update" ON conversations FOR UPDATE USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
  OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
