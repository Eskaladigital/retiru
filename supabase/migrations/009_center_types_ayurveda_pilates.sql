-- Añadir pilates y ayurveda al enum center_type
-- Categorías finales: yoga, pilates, meditation, ayurveda, wellness, spa, yoga_meditation, wellness_spa, multidisciplinary

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'center_type' AND e.enumlabel = 'pilates') THEN
    ALTER TYPE center_type ADD VALUE 'pilates';
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'center_type' AND e.enumlabel = 'ayurveda') THEN
    ALTER TYPE center_type ADD VALUE 'ayurveda';
  END IF;
END
$$;
