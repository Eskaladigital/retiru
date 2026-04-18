-- ============================================================================
-- 027 · Sistema de roles múltiples por usuario
-- Migra de profiles.role (enum único) a tabla user_roles (N roles por usuario)
-- ============================================================================

-- 1) Tabla user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('attendee','organizer','center','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 2) Migrar datos existentes desde profiles.role
INSERT INTO user_roles (user_id, role)
SELECT id, role::text FROM profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Asegurar que todos tienen al menos 'attendee'
INSERT INTO user_roles (user_id, role)
SELECT id, 'attendee' FROM profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Insertar rol 'center' para usuarios que han reclamado centros
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT claimed_by, 'center'
FROM centers
WHERE claimed_by IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Insertar rol 'organizer' para usuarios con organizer_profiles
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT op.user_id, 'organizer'
FROM organizer_profiles op
WHERE op.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6) RLS en user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ur_select" ON user_roles FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
);

CREATE POLICY "ur_admin_all" ON user_roles FOR ALL USING (
  is_admin(auth.uid())
);

-- 7) Funciones helper SQL

CREATE OR REPLACE FUNCTION has_role(uid UUID, role_name TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = uid AND role = role_name);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_roles_array(uid UUID) RETURNS TEXT[] AS $$
  SELECT COALESCE(array_agg(role ORDER BY role), ARRAY['attendee']::TEXT[])
  FROM user_roles
  WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8) Actualizar is_admin() para usar user_roles
CREATE OR REPLACE FUNCTION is_admin(uid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = uid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 9) Actualizar RLS de conversations (reemplaza políticas de 008 y 010)
DROP POLICY IF EXISTS "cv_select" ON conversations;
CREATE POLICY "cv_select" ON conversations FOR SELECT USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "cv_update" ON conversations;
CREATE POLICY "cv_update" ON conversations FOR UPDATE USING (
  user_id = auth.uid()
  OR attendee_id = auth.uid()
  OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = conversations.organizer_id AND organizer_profiles.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 10) Actualizar RLS de messages
DROP POLICY IF EXISTS "mg_select" ON messages;
CREATE POLICY "mg_select" ON messages FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR c.attendee_id = auth.uid()
      OR EXISTS(SELECT 1 FROM organizer_profiles WHERE id = c.organizer_id AND organizer_profiles.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
  )
);

-- 11) Trigger: al insertar un profile nuevo, darle rol 'attendee' automáticamente
CREATE OR REPLACE FUNCTION handle_new_profile_role() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'attendee')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER tr_new_profile_role
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile_role();
