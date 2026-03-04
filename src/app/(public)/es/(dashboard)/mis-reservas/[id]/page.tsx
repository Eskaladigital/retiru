// /es/mis-reservas/[id] — Detalle de reserva (datos desde BD)
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getBookingById } from '@/lib/data';
import { formatDateRange, formatDate } from '@/lib/utils';

type Props = { params: Promise<{ id: string }> };

const STATUS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending_confirmation: 'Pendiente confirmación',
  pending_payment: 'Pendiente pago',
  completed: 'Completada',
  cancelled: 'Cancelada',
  cancelled_by_attendee: 'Cancelada',
  cancelled_by_organizer: 'Cancelada',
  rejected: 'Rechazada',
  sla_expired: 'Expirada',
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-sage-100 text-sage-700',
  pending_confirmation: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-amber-100 text-amber-700',
  completed: 'bg-sand-200 text-foreground',
  cancelled: 'bg-red-100 text-red-700',
  cancelled_by_attendee: 'bg-red-100 text-red-700',
  cancelled_by_organizer: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  sla_expired: 'bg-sand-200 text-[#7a6b5d]',
};

const PLACEHOLDER_IMG = '/images/placeholder-retreat.jpg';

export default async function ReservaDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/es/login?redirect=/es/mis-reservas/${id}`);

  const booking = await getBookingById(id, user.id);
  if (!booking) notFound();

  const r = (booking as any).retreats;
  const org = (booking as any).organizer_profiles;
  const title = r?.title_es || r?.title_en || 'Retiro';
  const slug = r?.slug;
  const orgSlug = org?.slug;
  const dates = r ? formatDateRange(r.start_date, r.end_date, 'es') : '';
  const days = r?.duration_days;
  const nights = days ? Math.max(1, days - 1) : 0;
  const duration = days ? `${days} día${days !== 1 ? 's' : ''} · ${nights} noche${nights !== 1 ? 's' : ''}` : '';
  const dest = (r as any)?.destinations;
  const location = dest?.name_es || r?.address || '';
  const coverImg = r?.retreat_images?.find((i: { is_cover: boolean }) => i.is_cover)?.url || r?.retreat_images?.[0]?.url || PLACEHOLDER_IMG;
  const statusLabel = STATUS[(booking as any).status] || (booking as any).status;
  const statusColor = STATUS_COLOR[(booking as any).status] || 'bg-sand-200 text-foreground';
  const feePaid = (booking as any).platform_payment_status === 'paid';
  const remainingPaid = (booking as any).remaining_payment_status === 'confirmed_by_organizer';
  const createdAt = (booking as any).created_at ? formatDate((booking as any).created_at, 'es') : '';

  // Buscar conversación: primero por booking_id, luego por retreat_id + user_id
  let convId: string | null = null;
  const { data: convByBooking } = await supabase
    .from('conversations')
    .select('id')
    .eq('booking_id', id)
    .single();
  if (convByBooking) {
    convId = convByBooking.id;
  } else if (r?.id) {
    const { data: convByRetreat } = await supabase
      .from('conversations')
      .select('id')
      .eq('retreat_id', r.id)
      .eq('user_id', user.id)
      .single();
    convId = convByRetreat?.id ?? null;
  }

  return (
    <div>
      <Link href="/es/mis-reservas" className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium hover:gap-2.5 transition-all mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Mis reservas
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Reserva {(booking as any).booking_number}</h1>
          <p className="text-sm text-[#7a6b5d]">{createdAt && `Realizada el ${createdAt}`}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Retiro */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img src={coverImg} alt={title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <h2 className="font-serif text-xl mb-2">{title}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-[#7a6b5d]">
                {location && <span>📍 {location}</span>}
                {dates && <span>📅 {dates}</span>}
                {duration && <span>🕐 {duration}</span>}
              </div>
              <div className="flex gap-3 mt-4">
                {slug && <Link href={`/es/retiro/${slug}`} className="text-sm font-medium text-terracotta-600 hover:underline">Ver retiro</Link>}
                {orgSlug && <Link href={`/es/organizador/${orgSlug}`} className="text-sm font-medium text-terracotta-600 hover:underline">Ver organizador</Link>}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg mb-3">Chat con {org?.business_name ?? 'organizador'}</h3>
            <div className="bg-sand-100 rounded-xl p-4 text-center text-sm text-[#7a6b5d]">
              <p>Habla directamente con el organizador para coordinar los detalles de tu retiro.</p>
              <Link
                href={convId ? `/es/mensajes/${convId}` : '/es/mensajes'}
                className="inline-flex mt-3 bg-terracotta-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-terracotta-700 transition-colors"
              >
                {convId ? 'Ir al chat' : 'Ver mensajes'}
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR */}
          {(booking as any).qr_code && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6 text-center">
              <h3 className="font-serif text-lg mb-3">Tu código QR</h3>
              <div className="w-40 h-40 mx-auto bg-sand-100 rounded-xl flex items-center justify-center text-[#a09383] text-sm">
                {(booking as any).qr_code}
              </div>
              <p className="text-xs text-[#7a6b5d] mt-3">Muéstralo al organizador para hacer check-in</p>
            </div>
          )}

          {/* Desglose pago */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg mb-4">Desglose del pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7a6b5d]">Cuota Retiru</span>
                <span className={`font-semibold ${feePaid ? 'text-sage-600' : 'text-amber-600'}`}>
                  {feePaid ? '✓' : '⏳'} {Number((booking as any).platform_fee).toFixed(0)}€
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a6b5d]">Al organizador</span>
                <span className={`font-semibold ${remainingPaid ? 'text-sage-600' : 'text-amber-600'}`}>
                  {remainingPaid ? '✓' : '⏳'} {Number((booking as any).organizer_amount).toFixed(0)}€
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-sand-200 font-bold">
                <span>Total</span><span>{Number((booking as any).total_price).toFixed(0)}€</span>
              </div>
            </div>
            {!remainingPaid && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                Recuerda pagar los {Number((booking as any).organizer_amount).toFixed(0)}€ al organizador antes del retiro.
              </p>
            )}
          </div>

          {/* Cancelar (solo si aplica) */}
          {!['cancelled', 'cancelled_by_attendee', 'cancelled_by_organizer', 'rejected', 'completed'].includes((booking as any).status) && (
            <button className="w-full text-sm text-red-500 font-medium border border-red-200 rounded-xl py-3 hover:bg-red-50 transition-colors">
              Cancelar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
