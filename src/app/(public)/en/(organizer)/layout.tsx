import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import PanelSidebar from '@/components/panel/PanelSidebar';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let hasContract = false;

  if (user) {
    const admin = createAdminSupabase();
    const { data: orgProfile } = await admin
      .from('organizer_profiles')
      .select('contract_accepted_at')
      .eq('user_id', user.id)
      .single();

    hasContract = !!orgProfile?.contract_accepted_at;
  }

  if (!hasContract) {
    return <div className="min-h-[calc(100vh-72px)] bg-cream-100 pt-16 md:pt-[72px]">{children}</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] pt-16 md:pt-[72px]">
      <PanelSidebar />
      <div className="flex-1 bg-cream-100 p-6 md:p-8">{children}</div>
    </div>
  );
}
