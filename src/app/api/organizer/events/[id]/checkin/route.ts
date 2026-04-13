// PATCH /api/organizer/events/[id]/checkin — Marcar check-in de un booking
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const { data: booking } = await admin
      .from('bookings')
      .select('id, organizer_id, retreat_id, status')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.retreat_id !== params.id) {
      return NextResponse.json({ error: 'Booking does not belong to this retreat' }, { status: 400 });
    }

    if (booking.organizer_id !== orgProfile.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (!['confirmed', 'completed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking must be confirmed to check in' }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('bookings')
      .update({
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
