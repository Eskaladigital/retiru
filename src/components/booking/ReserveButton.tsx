'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ReserveButtonProps {
  retreatId: string;
  retreatSlug: string;
  platformFee: number;
  availableSpots: number;
  locale?: 'es' | 'en';
  className?: string;
  compact?: boolean;
}

export default function ReserveButton({
  retreatId,
  retreatSlug,
  platformFee,
  availableSpots,
  locale = 'es',
  className = '',
  compact = false,
}: ReserveButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const soldOut = availableSpots === 0;

  const label = soldOut
    ? (locale === 'es' ? 'Agotado' : 'Sold out')
    : compact
      ? `${locale === 'es' ? 'Reservar' : 'Book'} · ${platformFee}€`
      : `${locale === 'es' ? 'Reservar plaza' : 'Book your spot'} · ${platformFee}€`;

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

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(locale === 'es' ? 'Error inesperado. Inténtalo de nuevo.' : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReserve}
      disabled={soldOut || loading}
      className={`btn-primary ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {loading
        ? (locale === 'es' ? 'Procesando…' : 'Processing…')
        : label}
    </button>
  );
}
