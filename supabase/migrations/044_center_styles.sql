-- 044_center_styles.sql
--
-- Taxonomía de estilos/subtipos para centros (Fase 3 #10 del PLAN_SEO).
-- Permite long-tail del tipo "kundalini Madrid", "mindfulness Barcelona",
-- "panchakarma Valencia", etc., sin tocar el core de `centers.type`.
--
-- Diseño:
--   1. `styles` catálogo: cada estilo pertenece a un `center_type`
--      (yoga | meditation | ayurveda) y tiene slug único global.
--   2. `center_styles` many-to-many: (center_id, style_id).
--   3. Triggers opcional de integridad: `center_styles.style` debe
--      ser un estilo cuyo `center_type` coincida con `centers.type`
--      — lo hacemos por CHECK vía función/trigger.
--
-- Catálogo inicial (ES/EN):
--   YOGA        → kundalini, vinyasa, hatha, iyengar, ashtanga, yin,
--                 restorative, aereo, prenatal, power, nidra, bikram.
--   MEDITATION  → mindfulness, vipassana, zen, trascendental, metta.
--   AYURVEDA    → panchakarma, marma, shirodhara, abhyanga.

-- ── Tabla catálogo ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  center_type TEXT NOT NULL CHECK (center_type IN ('yoga', 'meditation', 'ayurveda')),
  description_es TEXT,
  description_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_styles_type_active ON styles (center_type, is_active);

-- ── Tabla de asignación (many-to-many) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS center_styles (
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'manual', 'claim')),
  confidence NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (center_id, style_id)
);

CREATE INDEX IF NOT EXISTS idx_center_styles_center ON center_styles (center_id);
CREATE INDEX IF NOT EXISTS idx_center_styles_style ON center_styles (style_id);

-- ── Trigger: consistencia entre styles.center_type y centers.type ───────
CREATE OR REPLACE FUNCTION check_center_style_type_match()
RETURNS TRIGGER AS $$
DECLARE
  v_center_type TEXT;
  v_style_type TEXT;
BEGIN
  SELECT type INTO v_center_type FROM centers WHERE id = NEW.center_id;
  SELECT center_type INTO v_style_type FROM styles WHERE id = NEW.style_id;
  IF v_center_type IS NULL OR v_style_type IS NULL THEN
    RAISE EXCEPTION 'center o style no encontrado';
  END IF;
  IF v_center_type <> v_style_type THEN
    RAISE EXCEPTION 'Incompatibilidad: el estilo % pertenece a % y el centro es de tipo %',
      NEW.style_id, v_style_type, v_center_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_center_style_type ON center_styles;
CREATE TRIGGER trg_check_center_style_type
  BEFORE INSERT OR UPDATE ON center_styles
  FOR EACH ROW EXECUTE FUNCTION check_center_style_type_match();

-- ── RLS: lectura pública, escritura solo service role ───────────────────
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "styles public read" ON styles;
CREATE POLICY "styles public read" ON styles FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "center_styles public read" ON center_styles;
CREATE POLICY "center_styles public read" ON center_styles FOR SELECT USING (TRUE);

-- ── Catálogo inicial ────────────────────────────────────────────────────
INSERT INTO styles (slug, name_es, name_en, center_type, description_es, description_en, sort_order) VALUES
  -- Yoga
  ('kundalini', 'Kundalini Yoga', 'Kundalini Yoga', 'yoga',
    'Yoga dinámico con kriyas, pranayama, mantras y meditación para despertar la energía kundalini.',
    'Dynamic yoga combining kriyas, pranayama, mantras and meditation to awaken kundalini energy.',
    10),
  ('vinyasa', 'Vinyasa', 'Vinyasa', 'yoga',
    'Estilo fluido donde el movimiento se sincroniza con la respiración en secuencias creativas.',
    'Fluid style where movement syncs with breath in creative sequences.',
    20),
  ('hatha', 'Hatha Yoga', 'Hatha Yoga', 'yoga',
    'Ritmo pausado que permite alinear posturas con respiración consciente.',
    'Slow-paced practice aligning postures with conscious breathing.',
    30),
  ('iyengar', 'Iyengar', 'Iyengar', 'yoga',
    'Énfasis en la alineación precisa mediante cinturones, bloques y soportes.',
    'Emphasis on precise alignment with belts, blocks and props.',
    40),
  ('ashtanga', 'Ashtanga', 'Ashtanga', 'yoga',
    'Serie fija de posturas exigentes, practicada con vinyasa y bandhas.',
    'Fixed series of demanding postures practised with vinyasa and bandhas.',
    50),
  ('yin', 'Yin Yoga', 'Yin Yoga', 'yoga',
    'Posturas pasivas sostenidas varios minutos para trabajar fascia y articulaciones.',
    'Passive postures held for several minutes to work fascia and joints.',
    60),
  ('restorative', 'Yoga Restaurativo', 'Restorative Yoga', 'yoga',
    'Posturas de largo soporte con mantas y bloques para restaurar el sistema nervioso.',
    'Long-held supported postures with blankets and blocks to restore the nervous system.',
    70),
  ('aereo', 'Yoga Aéreo', 'Aerial Yoga', 'yoga',
    'Posturas suspendidas en hamacas de tela para descomprimir columna y ganar movilidad.',
    'Postures suspended in fabric hammocks to decompress the spine and build mobility.',
    80),
  ('prenatal', 'Yoga Prenatal', 'Prenatal Yoga', 'yoga',
    'Adaptado al embarazo: alivia molestias, prepara el parto y conecta con el bebé.',
    'Adapted to pregnancy: eases discomfort, prepares for birth and connects with the baby.',
    90),
  ('power', 'Power Yoga', 'Power Yoga', 'yoga',
    'Versión vigorosa y atlética del vinyasa, con énfasis en fuerza y resistencia.',
    'Vigorous, athletic variation of vinyasa focused on strength and endurance.',
    100),
  ('nidra', 'Yoga Nidra', 'Yoga Nidra', 'yoga',
    'Relajación guiada profunda conocida como "sueño yóguico".',
    'Deep guided relaxation known as "yogic sleep".',
    110),
  ('bikram', 'Bikram / Hot Yoga', 'Bikram / Hot Yoga', 'yoga',
    'Serie fija de 26 posturas en sala calefactada a ~40°C.',
    'Fixed series of 26 postures in a room heated to about 40°C.',
    120),
  -- Meditation
  ('mindfulness', 'Mindfulness', 'Mindfulness', 'meditation',
    'Atención plena al momento presente, con raíces en tradiciones budistas.',
    'Present-moment awareness rooted in Buddhist traditions.',
    10),
  ('vipassana', 'Vipassana', 'Vipassana', 'meditation',
    'Meditación silenciosa de observación de sensaciones corporales y mente.',
    'Silent meditation observing bodily sensations and the mind.',
    20),
  ('zen', 'Zen / Zazen', 'Zen / Zazen', 'meditation',
    'Tradición japonesa Zen: postura sentada (zazen) y atención a la respiración.',
    'Japanese Zen tradition: seated posture (zazen) and focus on breath.',
    30),
  ('trascendental', 'Meditación Trascendental', 'Transcendental Meditation', 'meditation',
    'Uso de un mantra personal dos veces al día durante 20 minutos.',
    'Personal mantra repeated twice daily for 20 minutes.',
    40),
  ('metta', 'Metta / Amor Bondadoso', 'Metta / Loving-Kindness', 'meditation',
    'Meditación de cultivo de la compasión y el amor incondicional.',
    'Meditation cultivating compassion and unconditional love.',
    50),
  -- Ayurveda
  ('panchakarma', 'Panchakarma', 'Panchakarma', 'ayurveda',
    'Protocolo clásico de 5 acciones de desintoxicación (5–21 días).',
    'Classic 5-action detox protocol (5–21 days).',
    10),
  ('marma', 'Marma', 'Marma Therapy', 'ayurveda',
    'Terapia sobre los 107 puntos vitales para liberar bloqueos energéticos.',
    'Therapy on the 107 vital points to release energy blockages.',
    20),
  ('shirodhara', 'Shirodhara', 'Shirodhara', 'ayurveda',
    'Hilo continuo de aceite tibio sobre la frente para calmar el sistema nervioso.',
    'Continuous stream of warm oil poured on the forehead to calm the nervous system.',
    30),
  ('abhyanga', 'Abhyanga', 'Abhyanga', 'ayurveda',
    'Masaje ayurvédico completo con aceites medicinales calentados.',
    'Full-body ayurvedic massage with warmed medicinal oils.',
    40)
ON CONFLICT (slug) DO NOTHING;
