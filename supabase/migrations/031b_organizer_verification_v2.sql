-- ============================================================================
-- 031b · Sistema de verificación de organizadores v2
-- Requiere 031a ejecutada primero (enum values commiteados)
-- ============================================================================

-- 1) Añadir columna contract_accepted_at a organizer_profiles
ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ;

-- 2) Añadir columna file_url a organizer_verification_steps
ALTER TABLE organizer_verification_steps
  ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 3) Para organizadores existentes: insertar los 2 nuevos pasos si no existen
INSERT INTO organizer_verification_steps (organizer_id, step)
SELECT op.id, 'economic_activity'
FROM organizer_profiles op
WHERE NOT EXISTS (
  SELECT 1 FROM organizer_verification_steps ovs
  WHERE ovs.organizer_id = op.id AND ovs.step = 'economic_activity'
)
ON CONFLICT (organizer_id, step) DO NOTHING;

INSERT INTO organizer_verification_steps (organizer_id, step)
SELECT op.id, 'insurance'
FROM organizer_profiles op
WHERE NOT EXISTS (
  SELECT 1 FROM organizer_verification_steps ovs
  WHERE ovs.organizer_id = op.id AND ovs.step = 'insurance'
)
ON CONFLICT (organizer_id, step) DO NOTHING;

-- 4) Eliminar paso personal_data (ya no aplica; datos en profiles)
DELETE FROM organizer_verification_steps WHERE step = 'personal_data';

-- 5) Actualizar trigger para nuevos organizadores: 5 pasos sin personal_data
CREATE OR REPLACE FUNCTION handle_new_organizer() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organizer_verification_steps (organizer_id, step) VALUES
    (NEW.id, 'identity_doc'),
    (NEW.id, 'economic_activity'),
    (NEW.id, 'insurance'),
    (NEW.id, 'tax_info'),
    (NEW.id, 'bank_info');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Bucket privado para documentos de organizadores
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-docs', 'organizer-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Política: organizador puede subir a su carpeta
CREATE POLICY "orgdocs_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organizer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: organizador puede ver sus propios documentos
CREATE POLICY "orgdocs_own_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'organizer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: admin puede ver todos los documentos
CREATE POLICY "orgdocs_admin_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'organizer-docs'
    AND has_role(auth.uid(), 'admin')
  );

-- Política: organizador puede actualizar/borrar sus archivos
CREATE POLICY "orgdocs_own_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'organizer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "orgdocs_own_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'organizer-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7) Para organizadores ya verificados: marcar contrato como aceptado retroactivamente
UPDATE organizer_profiles
SET contract_accepted_at = verified_at
WHERE status = 'verified' AND contract_accepted_at IS NULL AND verified_at IS NOT NULL;

UPDATE organizer_profiles
SET contract_accepted_at = created_at
WHERE status = 'verified' AND contract_accepted_at IS NULL;

-- 8) Para organizadores ya verificados: marcar sus pasos como approved
UPDATE organizer_verification_steps ovs
SET status = 'approved', reviewed_at = NOW()
FROM organizer_profiles op
WHERE ovs.organizer_id = op.id
  AND op.status = 'verified'
  AND ovs.status != 'approved';
