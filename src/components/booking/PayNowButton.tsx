'use client';

import { useState } from 'react';

interface PayNowButtonProps {
  bookingId: string;
  locale?: 'es' | 'en';
}

export default function PayNowButton({ bookingId, locale = 'es' }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || (locale === 'es' ? 'Error al procesar el pago' : 'Error processing payment'));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(locale === 'es' ? 'Error inesperado' : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="text-xs font-semibold px-4 py-2 rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors disabled:opacity-60"
    >
      {loading
        ? (locale === 'es' ? 'Procesando…' : 'Processing…')
        : (locale === 'es' ? 'Pagar ahora' : 'Pay now')}
    </button>
  );
}
