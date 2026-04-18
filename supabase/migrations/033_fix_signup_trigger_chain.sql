-- ============================================================================
-- RETIRU · Fix cadena de triggers al registrarse (signUp 500 "Database error")
-- ============================================================================
-- Causa: handle_new_user() usa SET search_path = '' (correcto). Al insertar en
-- public.profiles se disparan AFTER INSERT otros triggers cuyas funciones
-- referenciaban tablas sin schema (p. ej. user_roles) → con search_path vacío
-- PostgreSQL no resuelve el nombre y el INSERT falla → revierte todo el signup.
--
-- Solución: nombres totalmente calificados (public.*) + SET search_path = ''
-- en todas las funciones de esa cadena.
-- ============================================================================

-- 1) Perfil al crear usuario en auth.users (teléfono desde metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
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

-- 2) Preferencias de notificación al crear profile
CREATE OR REPLACE FUNCTION public.handle_new_profile() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3) Rol attendee en user_roles al crear profile (027)
CREATE OR REPLACE FUNCTION public.handle_new_profile_role() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'attendee')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
