// GET /api/organizer/events/[id]/bookings — List bookings for an event
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: retreatId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { data: retreat } = await admin
      .from('retreats')
      .select('id')
      .eq('id', retreatId)
      .eq('organizer_id', orgProfile.id)
      .single();

    if (!retreat) return NextResponse.json({ error: 'Retreat not found' }, { status: 404 });

    const { data: bookings, error } = await admin
      .from('bookings')
      .select(`
        id, booking_number, status, total_price, platform_fee, organizer_amount,
        platform_payment_status, remaining_payment_status, remaining_payment_due_date,
        form_responses, organizer_notes, created_at, confirmed_at,
        profiles!attendee_id(id, full_name, email, phone, avatar_url)
      `)
      .eq('retreat_id', retreatId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
