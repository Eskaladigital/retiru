// POST /api/cron/payment-reminders
// DEPRECATED: With the full-payment booking model, the attendee pays 100%
// upfront via Stripe. There is no remaining 80% payment to track.
// This endpoint is kept as a no-op so existing Vercel Cron config doesn't 404.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'No-op: full-payment model — no remaining payment reminders needed',
    timestamp: new Date().toISOString(),
  });
}
