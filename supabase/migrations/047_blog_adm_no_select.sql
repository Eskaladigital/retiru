-- ============================================================================
-- RETIRU · Blog: blog_adm no debe incluir SELECT
-- Con FOR ALL, un admin logueado veía artículos futuros en /es/blog (RLS OR con blog_pub).
-- El panel /administrator/blog usa service role (bypass RLS); aquí solo INSERT/UPDATE/DELETE.
-- ============================================================================

DROP POLICY IF EXISTS "blog_adm" ON blog_articles;

CREATE POLICY "blog_adm_insert" ON blog_articles
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "blog_adm_update" ON blog_articles
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "blog_adm_delete" ON blog_articles
  FOR DELETE
  USING (is_admin(auth.uid()));
