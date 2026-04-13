-- ============================================================================
-- 031a · Ampliar enum verification_step (debe commitearse antes de usar)
-- ============================================================================
ALTER TYPE verification_step ADD VALUE IF NOT EXISTS 'economic_activity';
ALTER TYPE verification_step ADD VALUE IF NOT EXISTS 'insurance';
