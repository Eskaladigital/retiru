// /en/claim/[token] — Magic link center claim page
import { redirect, notFound } from 'next/navigation';
import { createAdminSupabase } from '@/lib/supabase/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Props = { params: Promise<{ token: string }> };

export default async function ClaimCenterPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminSupabase();

  const { data: tokenRow } = await admin
    .from('claim_tokens')
    .select('id, center_id, used_by, used_at, expires_at')
    .eq('token', token)
    .single();

  if (!tokenRow) notFound();

  const expired = new Date(tokenRow.expires_at) < new Date();

  if (tokenRow.used_by || expired) {
    return (
      <div className="container-wide py-20 text-center">
        <h1 className="font-serif text-3xl mb-4">
          {tokenRow.used_by ? 'Link already used' : 'Link expired'}
        </h1>
        <p className="text-[#7a6b5d] mb-6">
          {tokenRow.used_by
            ? 'This claim link has already been used.'
            : 'This link has expired. You can claim your center from its page.'}
        </p>
        <a href="/en/centers-retiru" className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          Browse center directory
        </a>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/en/login?redirect=${encodeURIComponent(`/en/claim/${token}`)}&claim=true`);
  }

  const { data: center } = await admin
    .from('centers')
    .select('id, name, slug, claimed_by')
    .eq('id', tokenRow.center_id)
    .single();

  if (!center) notFound();

  if (center.claimed_by) {
    return (
      <div className="container-wide py-20 text-center">
        <h1 className="font-serif text-3xl mb-4">Center already claimed</h1>
        <p className="text-[#7a6b5d] mb-6">
          <strong>{center.name}</strong> already has a verified owner.
        </p>
        <a href={`/en/center/${center.slug}`} className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          View center
        </a>
      </div>
    );
  }

  const now = new Date().toISOString();

  const { data: existingClaim } = await admin
    .from('center_claims')
    .select('id')
    .eq('center_id', center.id)
    .eq('user_id', user.id)
    .single();

  if (existingClaim) {
    await admin
      .from('center_claims')
      .update({ status: 'approved', method: 'magic_link', reviewed_at: now })
      .eq('id', existingClaim.id);
  } else {
    await admin
      .from('center_claims')
      .insert({
        center_id: center.id,
        user_id: user.id,
        status: 'approved',
        method: 'magic_link',
        reviewed_at: now,
      });
  }

  await admin
    .from('centers')
    .update({ claimed_by: user.id, updated_at: now })
    .eq('id', center.id);

  await admin
    .from('claim_tokens')
    .update({ used_by: user.id, used_at: now })
    .eq('id', tokenRow.id);

  return (
    <div className="container-wide py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl mb-4">Center claimed!</h1>
        <p className="text-[#7a6b5d] mb-6">
          You are now the verified owner of <strong>{center.name}</strong>. You can manage your profile, respond to reviews and publish events.
        </p>
        <a href={`/en/center/${center.slug}`} className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          View my center
        </a>
      </div>
    </div>
  );
}
