-- URL o path público de la página de Facebook del centro (sin API de Google)
ALTER TABLE centers ADD COLUMN IF NOT EXISTS facebook TEXT;

COMMENT ON COLUMN centers.facebook IS 'Enlace público a Facebook del centro (p. ej. https://www.facebook.com/nombre)';
