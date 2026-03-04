-- ============================================================================
-- 008 · Mensajería interna por evento (pre-reserva)
-- Permite conversaciones vinculadas a un retiro sin necesidad de booking.
-- ============================================================================

-- 1) Añadir retreat_id y user_id; hacer booking_id nullable
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS retreat_id UUID REFERENCES retreats(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id),
  ALTER COLUMN booking_id DROP NOT NULL;

-- Rellenar user_id desde attendee_id para conversaciones existentes
UPDATE conversations SET user_id = attendee_id WHERE user_id IS NULL;

-- Índice único: una conversación por par (usuario, retiro)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_retreat_user
  ON conversations(retreat_id, user_id)
  WHERE retreat_id IS NOT NULL AND user_id IS NOT NULL;

-- Índice para buscar conversaciones por retiro
CREATE INDEX IF NOT EXISTS idx_conv_retreat ON conversations(retreat_id) WHERE retreat_id IS NOT NULL;

-- Índice para buscar conversaciones por user_id
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id) WHERE user_id IS NOT NULL;

-- 2) Actualizar RLS de conversations
DROP POLICY IF EXISTS "cv_r" ON conversations;
CREATE POLICY "cv_select" ON conversations FOR SELECT USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
  OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cv_ins" ON conversations;
CREATE POLICY "cv_insert" ON conversations FOR INSERT WITH CHECK (
  user_id = auth.uid() OR attendee_id = auth.uid()
);

-- 3) Actualizar RLS de messages
DROP POLICY IF EXISTS "mg_r" ON messages;
CREATE POLICY "mg_select" ON messages FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR c.attendee_id = auth.uid()
      OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = c.organizer_id AND organizer_profiles.user_id = auth.uid())
      OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- mg_ins ya existe y es correcto (sender_id = auth.uid())

-- 4) Política UPDATE para marcar mensajes como leídos
CREATE POLICY "mg_update_read" ON messages FOR UPDATE USING (
  EXISTS(
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR c.attendee_id = auth.uid()
      OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = c.organizer_id AND organizer_profiles.user_id = auth.uid())
    )
  )
) WITH CHECK (
  is_read = true
);

-- 5) Política UPDATE para conversations (actualizar contadores de no leídos)
CREATE POLICY "cv_update" ON conversations FOR UPDATE USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
);
