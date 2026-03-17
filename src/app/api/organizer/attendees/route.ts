// GET /api/organizer/attendees — List all attendees across events
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
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!orgProfile) return NextResponse.json({ error: 'Not an organizer' }, { status: 403 });

    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, attendee_id, total_price, status, created_at,
        profiles!attendee_id(id, full_name, email, phone, avatar_url),
        retreats!retreat_id(title_es)
      `)
      .eq('organizer_id', orgProfile.id)
      .in('status', ['confirmed', 'completed', 'pending_confirmation'])
      .order('created_at', { ascending: false });

    if (!bookings) return NextResponse.json({ attendees: [] });

    const attendeeMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatar_url: string | null;
      events: number;
      totalSpent: number;
      lastEvent: string;
      lastDate: string;
    }>();

    for (const b of bookings) {
      const profile = b.profiles as any;
      const retreat = b.retreats as any;
      if (!profile?.id) continue;

      const existing = attendeeMap.get(profile.id);
      if (existing) {
        existing.events += 1;
        existing.totalSpent += Number(b.total_price);
        if (b.created_at > existing.lastDate) {
          existing.lastDate = b.created_at;
          existing.lastEvent = retreat?.title_es || 'Retiro';
        }
      } else {
        attendeeMap.set(profile.id, {
          id: profile.id,
          name: profile.full_name || 'Asistente',
          email: profile.email || '',
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          events: 1,
          totalSpent: Number(b.total_price),
          lastEvent: retreat?.title_es || 'Retiro',
          lastDate: b.created_at,
        });
      }
    }

    const attendees = Array.from(attendeeMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Attendees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
