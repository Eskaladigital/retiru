// GET /api/organizer/attendees — List all attendees across events
import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ORGANIZER_ATTENDEE_STATUSES } from '@/lib/utils';

export async function GET() {
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

    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, attendee_id, total_price, status, created_at, retreat_id,
        profiles!attendee_id(id, full_name, email, phone, avatar_url),
        retreats!retreat_id(title_es, series_id, start_date)
      `)
      .eq('organizer_id', orgProfile.id)
      .in('status', [...ORGANIZER_ATTENDEE_STATUSES])
      .order('created_at', { ascending: false });

    if (!bookings) return NextResponse.json({ attendees: [] });

    const attendeeMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatar_url: string | null;
      /** Experiencias distintas (serie o retiro suelto), no cada fecha de una serie */
      events: number;
      /** Fechas/inscripciones individuales */
      bookings: number;
      totalSpent: number;
      lastEvent: string;
      lastDate: string;
      _eventKeys: Set<string>;
    }>();

    for (const b of bookings) {
      const profile = b.profiles as any;
      const retreat = b.retreats as any;
      if (!profile?.id) continue;

      const eventKey = retreat?.series_id
        ? `series:${retreat.series_id}`
        : `retreat:${b.retreat_id}`;
      const title = retreat?.title_es || 'Retiro';
      const paidStatuses = new Set(['confirmed', 'completed']);
      const amount = paidStatuses.has(b.status) ? Number(b.total_price) : 0;

      const existing = attendeeMap.get(profile.id);
      if (existing) {
        existing.bookings += 1;
        if (!existing._eventKeys.has(eventKey)) {
          existing._eventKeys.add(eventKey);
          existing.events += 1;
        }
        existing.totalSpent += amount;
        if (b.created_at > existing.lastDate) {
          existing.lastDate = b.created_at;
          existing.lastEvent = title;
        }
      } else {
        attendeeMap.set(profile.id, {
          id: profile.id,
          name: profile.full_name || 'Asistente',
          email: profile.email || '',
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          events: 1,
          bookings: 1,
          totalSpent: amount,
          lastEvent: title,
          lastDate: b.created_at,
          _eventKeys: new Set([eventKey]),
        });
      }
    }

    const attendees = Array.from(attendeeMap.values())
      .map(({ _eventKeys, ...rest }) => rest)
      .sort((a, b) => b.bookings - a.bookings || b.totalSpent - a.totalSpent);

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Attendees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
