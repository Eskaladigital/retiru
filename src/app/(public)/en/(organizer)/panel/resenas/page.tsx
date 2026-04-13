import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ResenasClient } from '@/app/(public)/es/(organizer)/panel/resenas/ResenasClient';

export default async function ResenasPageEn() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/en/login?redirect=/en/panel/resenas');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) redirect('/en/login');

  const { data: reviews } = await admin
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

  const list = (reviews || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    response: r.response,
    respondedAt: r.responded_at,
    createdAt: r.created_at,
    attendeeName: r.profiles?.full_name || 'Guest',
    attendeeAvatar: r.profiles?.avatar_url,
    retreatTitle: r.retreats?.title_es || 'Retreat',
    retreatSlug: r.retreats?.slug,
  }));

  const unreplied = list.filter((r: any) => !r.response).length;

  const avgRating = list.length > 0
    ? (list.reduce((sum: number, r: any) => sum + r.rating, 0) / list.length).toFixed(1)
    : '0.0';

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">Reviews</h1>
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-1">
          <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xl font-bold">{avgRating}</span>
        </div>
        <span className="text-sm text-[#7a6b5d]">{list.length} reviews</span>
        {unreplied > 0 && (
          <>
            <span className="text-sm text-[#a09383]">·</span>
            <span className="text-sm text-amber-600">{unreplied} unanswered</span>
          </>
        )}
      </div>
      <ResenasClient reviews={list} />
    </div>
  );
}
