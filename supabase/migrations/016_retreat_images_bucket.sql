-- ============================================================================
-- RETIRU · Bucket storage `retreat-images` + políticas RLS
-- El wizard sube aquí (ruta retreats/...) y guarda URLs en retreat_images.
-- Antes solo existían políticas para bucket `retreats`, no para retreat-images.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('retreat-images', 'retreat-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "retreat_images_select" ON storage.objects;
DROP POLICY IF EXISTS "retreat_images_insert" ON storage.objects;

CREATE POLICY "retreat_images_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'retreat-images');

-- Solo usuarios autenticados; primera carpeta del path debe ser "retreats" (como en el cliente)
CREATE POLICY "retreat_images_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'retreat-images'
    AND (storage.foldername(name))[1] = 'retreats'
  );
