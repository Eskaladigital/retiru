-- ============================================================================
-- RETIRU · Migración: slug_en para artículos de blog
-- Permite URLs traducidas por idioma:
--   /es/blog/retiros-silencio-espana
--   /en/blog/silence-retreats-spain
-- ============================================================================

ALTER TABLE blog_articles ADD COLUMN slug_en TEXT;

-- Índice único parcial: solo aplica cuando slug_en no es NULL
CREATE UNIQUE INDEX idx_blog_slug_en ON blog_articles(slug_en) WHERE slug_en IS NOT NULL;
