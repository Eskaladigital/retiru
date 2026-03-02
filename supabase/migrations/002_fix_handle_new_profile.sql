-- ============================================================================
-- RETIRU · Fix: permitir crear usuarios desde el dashboard de Supabase
-- Los triggers fallaban por permisos/RLS. Ambos necesitan SECURITY DEFINER
-- y tablas con schema explícito cuando search_path está vacío.
-- ============================================================================

-- 1. handle_new_user: asegurar search_path y schema explícito
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. handle_new_profile: SECURITY DEFINER + schema explícito
CREATE OR REPLACE FUNCTION handle_new_profile() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
