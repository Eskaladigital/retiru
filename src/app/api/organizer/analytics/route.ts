// GET /api/organizer/analytics — KPIs y estadísticas del organizador
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
      .select('id, avg_rating, review_count')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { count: activeRetreats } = await admin
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString());

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const { count: bookingsThisMonth } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .gte('created_at', currentMonthStart)
      .in('status', ['confirmed', 'pending_confirmation', 'completed']);

    const { count: bookingsLastMonth } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', orgProfile.id)
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd)
      .in('status', ['confirmed', 'pending_confirmation', 'completed']);

    const bookingsChange = bookingsLastMonth && bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth || 0) - bookingsLastMonth) / bookingsLastMonth * 100)
      : 0;

    const { data: confirmedBookings } = await admin
      .from('bookings')
      .select('organizer_amount')
      .eq('organizer_id', orgProfile.id)
      .gte('created_at', currentMonthStart)
      .in('status', ['confirmed', 'completed']);

    const revenueThisMonth = (confirmedBookings || [])
      .reduce((sum: number, b: any) => sum + Number(b.organizer_amount), 0);

    const { data: topRetreats } = await admin
      .from('retreats')
      .select(`
        id,
        title_es,
        slug,
        bookings:bookings(count)
      `)
      .eq('organizer_id', orgProfile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    type RetreatBookingCount = { id: string; title: string; slug: string; bookings: number };
    const mappedTopRetreats: RetreatBookingCount[] = (topRetreats ?? []).map(
      (r: {
        id: string;
        title_es: string | null;
        slug: string | null;
        bookings: unknown[] | null;
      }) => ({
        id: r.id,
        title: r.title_es ?? '',
        slug: r.slug ?? '',
        bookings: Array.isArray(r.bookings) ? r.bookings.length : 0,
      }),
    );
    const retreatsWithCounts = [...mappedTopRetreats]
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    return NextResponse.json({
      kpis: {
        activeRetreats: activeRetreats || 0,
        bookingsThisMonth: bookingsThisMonth || 0,
        bookingsChange,
        revenueThisMonth: Math.round(revenueThisMonth),
        avgRating: orgProfile.avg_rating || 0,
        reviewCount: orgProfile.review_count || 0,
      },
      topRetreats: retreatsWithCounts,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
