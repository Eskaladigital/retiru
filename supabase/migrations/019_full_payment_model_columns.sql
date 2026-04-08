-- ═══════════════════════════════════════════════════════════════════════
-- 019 · Full-payment booking model — PART 2: columns & defaults
-- ═══════════════════════════════════════════════════════════════════════
-- Run AFTER 018 has been committed (enum values must exist).
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add payout tracking columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'paid', 'not_applicable')),
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payout_date DATE,
  ADD COLUMN IF NOT EXISTS payout_reference TEXT,
  ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- 2. Change default for remaining_payment_status (new bookings = not_applicable)
ALTER TABLE bookings ALTER COLUMN remaining_payment_status SET DEFAULT 'not_applicable';

-- 3. Set payout_amount = organizer_amount for existing bookings
UPDATE bookings
SET payout_amount = organizer_amount
WHERE payout_amount IS NULL;
