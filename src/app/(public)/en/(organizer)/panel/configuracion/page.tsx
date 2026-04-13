import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { ConfigClient } from '@/app/(public)/es/(organizer)/panel/configuracion/ConfigClient';

export default async function ConfiguracionPageEn() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/en/login?redirect=/en/panel/configuracion');

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id, business_name, description_es, location, website, instagram, phone, languages, logo_url, tax_id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) redirect('/en/login');

  const profile = {
    businessName: orgProfile.business_name || '',
    bio: orgProfile.description_es || '',
    location: orgProfile.location || '',
    website: orgProfile.website || '',
    instagram: orgProfile.instagram || '',
    phone: orgProfile.phone || '',
    languages: orgProfile.languages || ['es'],
    logoUrl: orgProfile.logo_url,
    taxId: orgProfile.tax_id,
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Settings</h1>
        <p className="text-sm text-[#7a6b5d] mt-1">Manage your organizer profile and preferences</p>
      </div>

      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Public profile</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">This information is visible to attendees.</p>
        <ConfigClient profile={profile} />
      </section>

      <section className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-xl mb-4">Notifications</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">Choose which email notifications you want to receive.</p>

        <div className="space-y-4">
          {[
            { label: 'New booking', description: 'When an attendee books your retreat', default: true },
            { label: 'Cancellation', description: 'When an attendee cancels', default: true },
            { label: 'New message', description: 'When you receive a message from an attendee', default: true },
            { label: 'New review', description: 'When an attendee leaves a review', default: false },
            { label: 'Payment reminders', description: 'Alerts about pending payouts or payments', default: true },
            { label: 'Monthly reports', description: 'Monthly performance summary', default: false },
          ].map((notif) => (
            <label key={notif.label} className="flex items-start gap-3 cursor-pointer opacity-50 pointer-events-none">
              <input type="checkbox" defaultChecked={notif.default} className="mt-0.5 w-4 h-4 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500" disabled />
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-[#a09383]">{notif.description}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-[#a09383] mt-4">Coming soon: notification preferences</p>
      </section>

      <section className="bg-white border border-sand-200 rounded-2xl p-6">
        <h2 className="font-serif text-xl mb-4">Tax and bank details</h2>
        <p className="text-sm text-[#7a6b5d] mb-5">
          These are managed in the verification section for security.
        </p>

        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-foreground">Tax details on file</p>
          </div>
          {profile.taxId && (
            <p className="text-sm text-[#7a6b5d]">Tax ID: {profile.taxId}</p>
          )}
        </div>

        <Link
          href="/en/panel/verificacion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta-600 hover:underline"
        >
          View full documentation →
        </Link>
      </section>
    </div>
  );
}
