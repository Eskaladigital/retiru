-- ═══════════════════════════════════════════════════════════════════════
-- 018 · Full-payment booking model — PART 1: enum values
-- ═══════════════════════════════════════════════════════════════════════
-- PostgreSQL requires new enum values to be committed before they can
-- be referenced in DEFAULT, UPDATE, etc. Run this first, then run 019.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TYPE remaining_payment_status ADD VALUE IF NOT EXISTS 'not_applicable';
ALTER TYPE remaining_payment_status ADD VALUE IF NOT EXISTS 'expired';
