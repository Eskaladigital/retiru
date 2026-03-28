-- Categoría de retiro Ayurveda (home "Explora por enfoque" + ?tipo=ayurveda en listados).
-- El seed histórico no la incluía; sin esta fila solo aparecían Yoga y Meditación.

INSERT INTO categories (name_es, name_en, slug, icon, sort_order, is_active)
VALUES ('Ayurveda', 'Ayurveda', 'ayurveda', '🪷', 11, true)
ON CONFLICT (slug) DO NOTHING;
