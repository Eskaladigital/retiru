-- ============================================================================
-- RETIRU · Políticas de Storage (centers, retreats, avatars)
-- Los buckets ya existen; aquí definimos quién puede leer/escribir
-- ============================================================================

-- centers: lectura pública, escritura solo admin
CREATE POLICY "centers_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'centers');

CREATE POLICY "centers_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'centers' AND (SELECT is_admin(auth.uid()))
  );

CREATE POLICY "centers_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'centers' AND (SELECT is_admin(auth.uid()))
  );

CREATE POLICY "centers_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'centers' AND (SELECT is_admin(auth.uid()))
  );

-- retreats: lectura pública, escritura solo organizador del retiro
-- Ruta en bucket: {retreat_id}/cover.jpg o {retreat_id}/gallery/1.jpg
CREATE POLICY "retreats_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'retreats');

CREATE POLICY "retreats_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'retreats'
    AND EXISTS (
      SELECT 1 FROM retreats r
      JOIN organizer_profiles o ON o.id = r.organizer_id
      WHERE r.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "retreats_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'retreats'
    AND EXISTS (
      SELECT 1 FROM retreats r
      JOIN organizer_profiles o ON o.id = r.organizer_id
      WHERE r.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "retreats_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'retreats'
    AND EXISTS (
      SELECT 1 FROM retreats r
      JOIN organizer_profiles o ON o.id = r.organizer_id
      WHERE r.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  );

-- avatars: lectura pública, escritura solo el propio usuario
-- Ruta en bucket: {user_id}/avatar.jpg
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
