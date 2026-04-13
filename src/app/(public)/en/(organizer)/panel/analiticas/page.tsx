import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export default async function AnaliticasPageEn() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/en/login?redirect=/en/panel/analiticas');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id, avg_rating, review_count')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) redirect('/en/login');

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
    .select('id, title_es, slug, confirmed_bookings')
    .eq('organizer_id', orgProfile.id)
    .eq('status', 'published')
    .order('confirmed_bookings', { ascending: false })
    .limit(5);

  type TopRetreatStat = { name: string; bookings: number };
  const topRetreatsData: TopRetreatStat[] = (topRetreats ?? []).map(
    (r: { title_es: string | null; confirmed_bookings: number | null }) => ({
      name: r.title_es ?? '',
      bookings: r.confirmed_bookings ?? 0,
    }),
  );

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Analytics</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">How your retreats are performing this month</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Active retreats</p>
          <p className="text-2xl font-bold mt-1">{activeRetreats || 0}</p>
          <p className="text-xs text-[#7a6b5d] mt-1">Published and upcoming</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Bookings</p>
          <p className="text-2xl font-bold mt-1">{bookingsThisMonth || 0}</p>
          <p className={`text-xs font-semibold mt-1 ${bookingsChange >= 0 ? 'text-sage-600' : 'text-red-500'}`}>
            {bookingsChange >= 0 ? '+' : ''}{bookingsChange}% vs last month
          </p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Revenue (month)</p>
          <p className="text-2xl font-bold mt-1">{revenueThisMonth.toLocaleString('en')}€</p>
          <p className="text-xs text-[#7a6b5d] mt-1">Confirmed</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-5">
          <p className="text-xs text-[#a09383] uppercase tracking-wider font-semibold">Rating</p>
          <p className="text-2xl font-bold mt-1">{orgProfile.avg_rating || 0}</p>
          <p className="text-xs text-[#7a6b5d] mt-1">{orgProfile.review_count || 0} reviews</p>
        </div>
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Visits and bookings</h3>
        <div className="h-64 bg-sand-100 rounded-xl flex items-center justify-center text-sm text-[#a09383]">
          📊 Chart (coming soon with Recharts)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Top retreats by bookings</h3>
          {topRetreatsData.length > 0 ? (
            <div className="space-y-3">
              {topRetreatsData.map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{e.name}</span>
                  <span className="text-[#7a6b5d]">{e.bookings} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#a09383]">No data yet</p>
          )}
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg mb-4">Traffic sources</h3>
          <div className="space-y-3">
            <p className="text-sm text-[#a09383]">
              Coming soon: Google Analytics metrics and traffic to your retreat pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
