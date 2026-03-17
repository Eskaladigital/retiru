// POST /api/bookings/[id]/form — Save attendee form responses
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { responses } = await request.json();

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Invalid responses' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    const { data: booking } = await admin
      .from('bookings')
      .select('id, attendee_id')
      .eq('id', bookingId)
      .eq('attendee_id', user.id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await admin
      .from('bookings')
      .update({
        form_responses: responses,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Form save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: booking } = await admin
      .from('bookings')
      .select(`
        id, form_responses,
        retreats!retreat_id(title_es, post_booking_form)
      `)
      .eq('id', bookingId)
      .eq('attendee_id', user.id)
      .single();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    return NextResponse.json({
      formFields: (booking.retreats as any)?.post_booking_form || [],
      responses: booking.form_responses || {},
      retreatTitle: (booking.retreats as any)?.title_es || 'Retiro',
    });
  } catch (error) {
    console.error('Form fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
