-- Guardar teléfono del registro (user_metadata.phone) en profiles.phone
-- Importante: mantener `SET search_path = ''` y `public.profiles` con schema
-- explícito (igual que 002_fix_handle_new_profile.sql). Si se quitan, el
-- trigger falla en llamadas desde auth con search_path vacío.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
