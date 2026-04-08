-- Bucket público para fotos de perfil (políticas RLS en 004_storage_policies.sql)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
