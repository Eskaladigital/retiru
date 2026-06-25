-- ============================================================================
-- RETIRU · Blog: ocultar artículos programados (published_at futuro) al público
-- La política blog_pub solo comprobaba is_published; los programados se veían antes de tiempo.
-- Admin panel usa service role (bypass RLS). Ver 047: blog_adm ya no incluye SELECT.
-- ============================================================================

DROP POLICY IF EXISTS "blog_pub" ON blog_articles;

CREATE POLICY "blog_pub" ON blog_articles
  FOR SELECT
  USING (
    is_published = true
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );
