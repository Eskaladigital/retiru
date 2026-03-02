-- ============================================================================
-- RETIRU · Eliminar usuario demo (ejecutar en SQL Editor si ya no lo necesitas)
-- CUIDADO: borra retiros, reservas, facturas y todos los datos del demo
-- ============================================================================

DO $$
DECLARE
  org_uuid UUID := '00000000-0000-0000-0000-000000000010';
  user_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Retiros del demo: eliminar en orden respetando FKs
  DELETE FROM retreat_categories WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid);
  DELETE FROM retreat_images WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid);
  DELETE FROM refunds WHERE booking_id IN (SELECT id FROM bookings WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid));
  DELETE FROM invoices WHERE booking_id IN (SELECT id FROM bookings WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid));
  DELETE FROM reviews WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid);
  DELETE FROM bookings WHERE retreat_id IN (SELECT id FROM retreats WHERE organizer_id = org_uuid);
  DELETE FROM retreats WHERE organizer_id = org_uuid;
  DELETE FROM organizer_verification_steps WHERE organizer_id = org_uuid;
  DELETE FROM organizer_profiles WHERE id = org_uuid;
  DELETE FROM blog_articles WHERE author_id = user_uuid;
  DELETE FROM notification_preferences WHERE user_id = user_uuid;
  DELETE FROM profiles WHERE id = user_uuid;
  DELETE FROM auth.users WHERE id = user_uuid;
  RAISE NOTICE 'Usuario demo eliminado correctamente';
END $$;
