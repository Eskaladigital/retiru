'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ReserveButtonProps {
  retreatId: string;
  retreatSlug: string;
  totalPrice: number;
  availableSpots: number;
  minReached: boolean;
  /** Confirmación manual: la reserva entra como solicitud sin pago */
  manualConfirmation?: boolean;
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
  locale = 'es',
  className = '',
  compact = false,
}: ReserveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [reserved, setReserved] = useState(false);
  const router = useRouter();
  const soldOut = availableSpots === 0;

  function getLabel() {
    if (soldOut) return locale === 'es' ? 'Agotado' : 'Sold out';
    if (manualConfirmation) {
      return compact
        ? (locale === 'es' ? 'Solicitar plaza' : 'Request spot')
        : (locale === 'es' ? 'Solicitar plaza (sin pago)' : 'Request spot (no payment)');
    }
    if (!minReached) {
      return compact
        ? (locale === 'es' ? 'Reservar plaza' : 'Reserve spot')
        : (locale === 'es' ? 'Reservar plaza (sin pago)' : 'Reserve spot (no payment)');
    }
    return compact
      ? `${locale === 'es' ? 'Reservar' : 'Book'} · ${totalPrice}€`
      : `${locale === 'es' ? 'Reservar plaza' : 'Book your spot'} · ${totalPrice}€`;
  }

  async function handleReserve() {
    if (soldOut || loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const redirectPath = `/${locale}/${locale === 'es' ? 'retiro' : 'retreat'}/${retreatSlug}`;
        router.push(`/${locale}/${locale === 'es' ? 'registro' : 'register'}?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || (locale === 'es' ? 'Error al crear la reserva' : 'Error creating booking'));
        return;
      }

      if (data.reserved) {
        setReserved(true);
        setTimeout(() => {
          router.push(`/${locale}/${locale === 'es' ? 'mis-reservas' : 'my-bookings'}`);
        }, 3000);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(locale === 'es' ? 'Error inesperado. Inténtalo de nuevo.' : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (reserved) {
    return (
      <div className={`text-center rounded-xl bg-sage-50 border border-sage-200 p-4 ${className}`}>
        <p className="text-sage-700 font-semibold text-sm">
          {manualConfirmation
            ? (locale === 'es'
                ? 'Solicitud enviada. El organizador la revisará y, si la acepta, te enviaremos el enlace para completar el pago.'
                : 'Request sent. The organizer will review it and, if accepted, we\u2019ll send you the link to complete the payment.')
            : (locale === 'es'
                ? 'Plaza reservada. Te avisaremos cuando se alcance el mínimo para confirmar con el pago.'
                : 'Spot reserved. We\u2019ll notify you when the minimum is reached so you can confirm with payment.')}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleReserve}
      disabled={soldOut || loading}
      className={`btn-primary ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {loading
        ? (locale === 'es' ? 'Procesando…' : 'Processing…')
        : getLabel()}
    </button>
  );
}
