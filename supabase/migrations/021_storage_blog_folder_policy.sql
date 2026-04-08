-- ============================================================================
-- RETIRU · Permitir subida de imágenes a carpeta blog/ en bucket retreat-images
-- La política anterior solo permitía la carpeta retreats/.
-- ============================================================================

DROP POLICY IF EXISTS "retreat_images_insert" ON storage.objects;

CREATE POLICY "retreat_images_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'retreat-images'
    AND (storage.foldername(name))[1] IN ('retreats', 'blog', 'avatars')
  );
