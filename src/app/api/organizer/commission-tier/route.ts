// GET /api/organizer/commission-tier
// Returns the commission percent that would apply to the organizer's next retreat,
// plus the current paid-retreats count used to derive the tier.
import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { getCommissionTier } from '@/lib/utils';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) {
    return NextResponse.json({ commissionPercent: 0, paidRetreatsCount: 0 });
  }

  const { count } = await admin
    .from('retreats')
    .select('id', { count: 'exact', head: true })
    .eq('organizer_id', orgProfile.id)
    .in('status', ['published', 'archived', 'cancelled'])
    .gt('confirmed_bookings', 0);

  const paidRetreatsCount = count ?? 0;
  const commissionPercent = getCommissionTier(paidRetreatsCount);

  return NextResponse.json({ commissionPercent, paidRetreatsCount });
}
