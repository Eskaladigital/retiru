import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { CheckinClient } from './CheckinClient';

type Props = { params: Promise<{ id: string }> };

type CheckinAttendee = {
  id: string;
  name: string;
  avatar: string | null | undefined;
  checkedIn: boolean;
  time: string | null;
};

export default async function CheckinPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/es/login?redirect=/es/panel/eventos/${id}/checkin`);

  const admin = createAdminSupabase();

  const { data: orgProfile } = await admin
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!orgProfile) notFound();

  const { data: retreat } = await admin
    .from('retreats')
    .select('id, title_es, organizer_id')
    .eq('id', id)
    .single();

  if (!retreat || retreat.organizer_id !== orgProfile.id) notFound();

  const { data: bookings } = await admin
    .from('bookings')
    .select(`
      id,
      checked_in_at,
      profiles!attendee_id(full_name, avatar_url)
    `)
    .eq('retreat_id', id)
    .in('status', ['confirmed', 'completed'])
    .order('checked_in_at', { ascending: false, nullsFirst: false });

  const attendees: CheckinAttendee[] = (bookings ?? []).map(
    (b: {
      id: string;
      checked_in_at: string | null;
      profiles: { full_name: string | null; avatar_url: string | null } | null;
    }) => ({
      id: b.id,
      name: b.profiles?.full_name || 'Asistente',
      avatar: b.profiles?.avatar_url,
      checkedIn: !!b.checked_in_at,
      time: b.checked_in_at
        ? new Date(b.checked_in_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
        : null,
    }),
  );

  const checkedCount = attendees.filter(a => a.checkedIn).length;

  return (
    <div>
      <Link href={`/es/panel/eventos/${id}`} className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">
        ← Volver al retiro
      </Link>
      <h1 className="font-serif text-2xl text-foreground mb-2">Check-in: {retreat.title_es}</h1>
      <p className="text-sm text-[#7a6b5d] mb-6">
        {checkedCount} de {attendees.length} asistentes han hecho check-in
      </p>

      <div className="h-3 bg-sand-200 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-sage-500 rounded-full transition-all"
          style={{ width: attendees.length > 0 ? `${(checkedCount / attendees.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6 text-center">
        <p className="text-sm text-[#7a6b5d] mb-3">Escanea el QR del asistente o márcalo manualmente</p>
        <button className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
          📷 Escanear QR
        </button>
      </div>

      <CheckinClient attendees={attendees} retreatId={id} />
    </div>
  );
}
