// GET /api/organizer/dashboard — Real KPIs and recent bookings
import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = createAdminSupabase();

    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('id, business_name, avg_rating, review_count, total_retreats, total_bookings')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { count: activeRetreats } = await admin
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .eq('status', 'published');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: bookingsThisMonth } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .gte('created_at', monthStart)
      .in('status', ['confirmed', 'pending_confirmation', 'completed']);

    const { data: confirmedBookings } = await admin
      .from('bookings')
      .select('organizer_amount, remaining_payment_status')
      .eq('organizer_id', orgProfile.id)
      .in('status', ['confirmed', 'completed']);

    const pendingIncome = (confirmedBookings || [])
      .filter((b: any) => b.remaining_payment_status === 'pending')
      .reduce((sum: number, b: any) => sum + Number(b.organizer_amount), 0);

    const { data: recentBookings } = await admin
      .from('bookings')
      .select(`
        id, booking_number, status, total_price, platform_fee, organizer_amount, created_at,
        profiles!attendee_id(full_name),
        retreats!retreat_id(title_es)
      `)
      .eq('organizer_id', orgProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: unreadMessages } = await admin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .gt('organizer_unread', 0);

    return NextResponse.json({
      kpis: {
        activeRetreats: activeRetreats || 0,
        bookingsThisMonth: bookingsThisMonth || 0,
        pendingIncome: Math.round(pendingIncome),
        avgRating: orgProfile.avg_rating || 0,
        reviewCount: orgProfile.review_count || 0,
        unreadMessages: unreadMessages || 0,
      },
      recentBookings: (recentBookings || []).map((b: any) => ({
        id: b.id,
        bookingNumber: b.booking_number,
        attendeeName: b.profiles?.full_name || 'Asistente',
        retreatTitle: b.retreats?.title_es || 'Retiro',
        amount: b.total_price,
        status: b.status,
        createdAt: b.created_at,
      })),
      businessName: orgProfile.business_name,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
