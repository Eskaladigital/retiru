// GET /api/organizer/reviews — Lista todas las reseñas del organizador
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

    const { data: reviews, error } = await admin
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        content,
        response,
        responded_at,
        created_at,
        profiles!attendee_id(full_name, avatar_url),
        retreats!retreat_id(title_es, slug)
      `)
      .eq('organizer_id', orgProfile.id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      reviews: (reviews || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        response: r.response,
        respondedAt: r.responded_at,
        createdAt: r.created_at,
        attendeeName: r.profiles?.full_name || 'Asistente',
        attendeeAvatar: r.profiles?.avatar_url,
        retreatTitle: r.retreats?.title_es || 'Retiro',
        retreatSlug: r.retreats?.slug,
      })),
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
