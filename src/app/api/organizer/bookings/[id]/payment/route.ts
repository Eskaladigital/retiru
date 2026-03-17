// PATCH /api/organizer/bookings/[id]/payment — Mark 80% as paid
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { method, notes } = await request.json();

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { data: booking } = await admin
      .from('bookings')
      .select('id, organizer_id, remaining_payment_status')
      .eq('id', bookingId)
      .eq('organizer_id', orgProfile.id)
      .single();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    await admin
      .from('bookings')
      .update({
        remaining_payment_status: 'confirmed_by_organizer',
        remaining_payment_confirmed_at: new Date().toISOString(),
        remaining_payment_confirmed_by: user.id,
        organizer_notes: notes || booking.organizer_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return NextResponse.json({ status: 'payment_confirmed' });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
