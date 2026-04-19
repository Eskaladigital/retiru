// /administrator/mails/[slug] — Detalle de campaña con 4 pestañas
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminSupabase } from '@/lib/supabase/server';
import { CampaignDetailClient, type CampaignFull } from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export default async function MailCampaignDetail({ params }: PageProps) {
  const { slug } = await params;
  const sb = createAdminSupabase();

  const { data: stats } = await sb
    .from('mailing_campaigns_stats')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!stats) notFound();

  const { data: raw } = await sb
    .from('mailing_campaigns')
    .select('html_content, generation_prompt, generation_reference_ids')
    .eq('id', stats.id)
    .maybeSingle();

  const campaign: CampaignFull = {
    ...stats,
    html_content: raw?.html_content || null,
    generation_prompt: raw?.generation_prompt || null,
    generation_reference_ids: raw?.generation_reference_ids || [],
  };

  return (
    <div className="pt-2">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/administrator/mails" className="text-sage-700 hover:underline">Mails</Link>
        <span className="text-[#a09383]">/</span>
        <span className="text-[#7a6b5d] font-mono text-xs">{campaign.slug}</span>
      </div>
      <CampaignDetailClient initial={campaign} />
    </div>
  );
}
