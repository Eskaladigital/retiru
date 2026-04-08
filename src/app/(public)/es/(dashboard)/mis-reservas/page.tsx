// /es/mis-reservas — Reservas del usuario (datos desde BD)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getBookingsForUser } from '@/lib/data';
import { formatDateRange } from '@/lib/utils';
import PaymentSuccessBanner from '@/components/booking/PaymentSuccessBanner';
import PayNowButton from '@/components/booking/PayNowButton';

const STATUS: Record<string, { label: string; color: string }> = {
  reserved_no_payment: { label: 'Reservada (pendiente mínimo)', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmada', color: 'bg-sage-100 text-sage-700' },
  pending_confirmation: { label: 'Pendiente confirmación', color: 'bg-amber-100 text-amber-700' },
  pending_payment: { label: 'Pendiente pago', color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  cancelled_by_attendee: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  cancelled_by_organizer: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Completada', color: 'bg-sand-200 text-foreground' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  sla_expired: { label: 'Expirada', color: 'bg-sand-200 text-[#7a6b5d]' },
};

const PLACEHOLDER_IMG = '/images/placeholder-retreat.jpg';

export default async function MisReservasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/es/login?redirect=/es/mis-reservas');

  const bookings = await getBookingsForUser(user.id);

  return (
    <div>
      <PaymentSuccessBanner />
      <h1 className="font-serif text-3xl text-foreground mb-2">Mis reservas</h1>
      <p className="text-sm text-[#7a6b5d] mb-8">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''}</p>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => {
            const r = b.retreats;
            const org = b.organizer_profiles;
            const title = r?.title_es || r?.title_en || 'Retiro';
            const dates = r ? formatDateRange(r.start_date, r.end_date, 'es') : '';
            const coverImg = r?.retreat_images?.find((i) => i.is_cover)?.url || r?.retreat_images?.[0]?.url || PLACEHOLDER_IMG;
            const s = STATUS[b.status] || { label: b.status, color: 'bg-sand-200 text-foreground' };

            const isReservedNoPay = b.status === 'reserved_no_payment';
            const canPay = isReservedNoPay && b.payment_deadline && new Date(b.payment_deadline) > new Date();
            const waitingForMin = isReservedNoPay && !b.payment_deadline;

            return (
              <div
                key={b.id}
                className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft hover:border-sand-300 transition-all"
              >
                <Link href={`/es/mis-reservas/${b.id}`} className="w-full md:w-40 h-28 rounded-xl overflow-hidden shrink-0 group">
                  <img src={coverImg} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={`/es/mis-reservas/${b.id}`}>
                      <h3 className="font-serif text-lg leading-tight hover:text-terracotta-600 transition-colors">{title}</h3>
                    </Link>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-[#7a6b5d] mb-2">{org?.business_name ?? 'Organizador'} · {dates}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div><span className="text-[#a09383]">Importe:</span> <span className="font-bold">{Number(b.total_price).toFixed(0)}€</span></div>
                  </div>

                  {waitingForMin && (
                    <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      Se te avisará cuando el retiro alcance el mínimo de participantes para confirmar con el pago.
                    </p>
                  )}

                  {canPay && (
                    <div className="mt-2 flex items-center gap-3">
                      <PayNowButton bookingId={b.id} locale="es" />
                      <span className="text-xs text-[#a09383]">
                        Plazo: {new Date(b.payment_deadline!).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="font-serif text-xl mb-2">Aún no tienes reservas</h3>
          <p className="text-sm text-[#7a6b5d] mb-6">Explora los retiros disponibles y encuentra tu experiencia perfecta</p>
          <Link href="/es/buscar" className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">Explorar retiros</Link>
        </div>
      )}
    </div>
  );
}
