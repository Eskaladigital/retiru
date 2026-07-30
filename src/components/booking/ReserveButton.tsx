'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SeriesCalendarModal from '@/components/booking/SeriesCalendarModal';

interface SeriesInfo {
  seriesId: string;
  /** Fecha de la ocurrencia mostrada en esta ficha (YYYY-MM-DD) */
  currentDate: string;
  /** Próximas fechas de la serie (puede incluir la actual) */
  dates: { slug: string; start_date: string }[];
}

interface ReserveButtonProps {
  retreatId: string;
  retreatSlug: string;
  totalPrice: number;
  availableSpots: number;
  minReached: boolean;
  /** Confirmación manual: la reserva entra como solicitud sin pago */
  manualConfirmation?: boolean;
  /** false = modo lanzamiento: inscripción sin cobro (Stripe aún no activo) */
  onlinePaymentsEnabled?: boolean;
  /** Evento periódico: abre el selector fecha única / varias fechas (calendario) */
  series?: SeriesInfo;
  locale?: 'es' | 'en';
  className?: string;
  compact?: boolean;
}

export default function ReserveButton({
  retreatId,
  retreatSlug,
  totalPrice,
  availableSpots,
  minReached,
  manualConfirmation = false,
  onlinePaymentsEnabled = true,
  series,
  locale = 'es',
  className = '',
  compact = false,
}: ReserveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [seriesDatesBooked, setSeriesDatesBooked] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const router = useRouter();
  const soldOut = availableSpots === 0;

  const es = locale === 'es';
  const retreatPath = es ? 'retiro' : 'retreat';
  const hasSeriesChoice = !!series && series.dates.length > 1;

  const dateFmt = new Intl.DateTimeFormat(es ? 'es-ES' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const fmtDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00`));

  function getLabel() {
    if (soldOut) return es ? 'Agotado' : 'Sold out';
    if (manualConfirmation) {
      return compact
        ? (es ? 'Solicitar plaza' : 'Request spot')
        : (es ? 'Solicitar plaza (sin pago)' : 'Request spot (no payment)');
    }
    if (!onlinePaymentsEnabled || !minReached) {
      return compact
        ? (es ? 'Reservar plaza' : 'Reserve spot')
        : (es ? 'Reservar plaza (sin pago)' : 'Reserve spot (no payment)');
    }
    return compact
      ? `${es ? 'Reservar' : 'Book'} · ${totalPrice}€`
      : `${es ? 'Reservar plaza' : 'Book your spot'} · ${totalPrice}€`;
  }

  /** Usuario autenticado o redirige a registro; devuelve null si redirige. */
  async function requireUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const redirectPath = `/${locale}/${retreatPath}/${retreatSlug}`;
      router.push(`/${locale}/${es ? 'registro' : 'register'}?redirect=${encodeURIComponent(redirectPath)}`);
      return null;
    }
    return user;
  }

  async function reserveSingle() {
    if (soldOut || loading) return;
    setLoading(true);
    try {
      const user = await requireUser();
      if (!user) return;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || (es ? 'Error al crear la reserva' : 'Error creating booking'));
        return;
      }
      if (data.reserved) {
        setModalOpen(false);
        setReserved(true);
        setTimeout(() => {
          router.push(`/${locale}/${es ? 'mis-reservas' : 'my-bookings'}`);
        }, 3000);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(es ? 'Error inesperado. Inténtalo de nuevo.' : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function openCalendar() {
    if (loading) return;
    setLoading(true);
    try {
      const user = await requireUser();
      if (!user) return;
      setModalOpen(false);
      setCalendarOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (soldOut || loading) return;
    if (hasSeriesChoice) {
      setModalOpen(true);
      return;
    }
    reserveSingle();
  }

  function onCalendarSuccess(n: number) {
    setSeriesDatesBooked(n);
    setReserved(true);
  }

  if (reserved && !calendarOpen) {
    return (
      <div className={`text-center rounded-xl bg-sage-50 border border-sage-200 p-4 ${className}`}>
        <p className="text-sage-700 font-semibold text-sm">
          {seriesDatesBooked > 0
            ? (es
                ? `Inscripción realizada en ${seriesDatesBooked} fecha${seriesDatesBooked === 1 ? '' : 's'}. Revisa el detalle en «Mis reservas» y en tu email.`
                : `Enrolled on ${seriesDatesBooked} date${seriesDatesBooked === 1 ? '' : 's'}. Check the details in “My bookings” and your email.`)
            : manualConfirmation
              ? (es
                  ? 'Solicitud enviada. El organizador la revisará y, si la acepta, te enviaremos el enlace para completar el pago.'
                  : 'Request sent. The organizer will review it and, if accepted, we\u2019ll send you the link to complete the payment.')
              : !onlinePaymentsEnabled
                ? (es
                    ? 'Plaza reservada. Por ahora no se cobra en la plataforma; te avisaremos por email cuando puedas pagar en Retiru.'
                    : 'Spot reserved. Payment is not collected on the platform yet; we\u2019ll email you when you can pay on Retiru.')
                : (es
                    ? 'Plaza reservada. Te avisaremos cuando se alcance el mínimo para confirmar con el pago.'
                    : 'Spot reserved. We\u2019ll notify you when the minimum is reached so you can confirm with payment.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={soldOut || loading}
        className={`btn-primary ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {loading ? (es ? 'Procesando…' : 'Processing…') : getLabel()}
      </button>

      {modalOpen && series && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
              {es ? 'Evento periódico' : 'Recurring event'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {es
                ? 'Esta actividad se repite. ¿Cómo quieres inscribirte?'
                : 'This activity repeats. How would you like to enroll?'}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={reserveSingle}
                disabled={loading}
                className="w-full rounded-xl border border-terracotta-200 bg-terracotta-50 hover:bg-terracotta-100 transition-colors p-3.5 text-left disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-foreground">
                  {es ? 'Solo esta fecha' : 'Just this date'} · {fmtDate(series.currentDate)}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {es ? 'Reservas una única plaza para este día.' : 'You reserve a single spot for this day.'}
                </span>
              </button>

              <button
                onClick={openCalendar}
                disabled={loading}
                className="w-full rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors p-3.5 text-left disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-foreground">
                  {es ? 'Elegir varias fechas (calendario)' : 'Pick several dates (calendar)'}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {es
                    ? 'Marca los días que quieras: otra fecha suelta, cada lunes, todas… Una plaza por fecha elegida.'
                    : 'Select the days you want: another single date, every Monday, all of them… One spot per chosen date.'}
                </span>
              </button>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              disabled={loading}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              {es ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {series && (
        <SeriesCalendarModal
          seriesId={series.seriesId}
          locale={locale}
          open={calendarOpen}
          onClose={() => {
            setCalendarOpen(false);
            if (seriesDatesBooked > 0) {
              setTimeout(() => {
                router.push(`/${locale}/${es ? 'mis-reservas' : 'my-bookings'}`);
              }, 500);
            }
          }}
          onSuccess={onCalendarSuccess}
        />
      )}
    </>
  );
}
