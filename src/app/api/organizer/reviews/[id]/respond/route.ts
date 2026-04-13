// POST /api/organizer/reviews/[id]/respond — Responder a una reseña
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function POST(
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

    const { response } = await req.json();
    if (!response || response.trim().length === 0) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    const { data: review } = await admin
      .from('reviews')
      .select('id, organizer_id')
      .eq('id', params.id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.organizer_id !== orgProfile.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from('reviews')
      .update({
        response: response.trim(),
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
