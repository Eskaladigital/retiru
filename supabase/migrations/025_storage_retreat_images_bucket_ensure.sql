-- ============================================================================
-- RETIRU · Asegurar bucket público `retreat-images` + políticas (idempotente)
-- Si en producción ves: «El bucket retreat-images no existe», ejecuta esta
-- migración en el SQL Editor de Supabase o: supabase db push / link + migrate.
-- Equivale a 016 + 021 consolidado para proyectos donde no se aplicaron antes.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('retreat-images', 'retreat-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "retreat_images_select" ON storage.objects;
DROP POLICY IF EXISTS "retreat_images_insert" ON storage.objects;

CREATE POLICY "retreat_images_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'retreat-images');

-- Subidas desde cliente (anon no): carpetas retreats/, blog/, avatars/ dentro de este bucket.
-- La API /api/storage/retreat-images usa service role y no depende de esta política.
CREATE POLICY "retreat_images_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'retreat-images'
    AND (storage.foldername(name))[1] IN ('retreats', 'blog', 'avatars')
  );
