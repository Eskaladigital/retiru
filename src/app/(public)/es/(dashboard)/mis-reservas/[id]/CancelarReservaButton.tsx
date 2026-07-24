'use client';

// Botón de cancelación de reserva por el asistente, con preview del reembolso
// calculado en el servidor (tramos de la política + garantía Retiru 48 h).
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  bookingId: string;
  /** Porcentaje de reembolso que corresponde ahora mismo (0–100) */
  refundPercent: number;
  /** Importe estimado a devolver (0 si no hubo pago) */
  refundAmount: number;
  /** Si aplica la garantía Retiru de 48 h */
  graceApplies: boolean;
  /** Si la reserva está pagada */
  paid: boolean;
};

export function CancelarReservaButton({ bookingId, refundPercent, refundAmount, graceApplies, paid }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error || 'No se pudo cancelar la reserva');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-sm text-red-500 font-medium border border-red-200 rounded-xl py-3 hover:bg-red-50 transition-colors"
      >
        Cancelar reserva
      </button>
    );
  }

  return (
    <div className="border border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">¿Seguro que quieres cancelar?</p>
      {paid ? (
        <p className="text-sm text-[#7a6b5d]">
          {graceApplies
            ? <>Estás dentro de la <strong>garantía Retiru de 48 h</strong>: se te devolverá el <strong>100 %</strong> ({refundAmount.toFixed(0)}€) en tu método de pago.</>
            : refundPercent > 0
              ? <>Según la política de cancelación del evento te corresponde un reembolso del <strong>{refundPercent} %</strong> ({refundAmount.toFixed(0)}€) en tu método de pago.</>
              : <>Según la política de cancelación del evento, a estas fechas <strong>no corresponde reembolso</strong>.</>}
        </p>
      ) : (
        <p className="text-sm text-[#7a6b5d]">No has realizado ningún pago, así que no hay nada que reembolsar.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 text-sm bg-red-600 text-white font-semibold rounded-xl py-2.5 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Cancelando…' : 'Sí, cancelar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 text-sm border border-sand-300 text-foreground font-medium rounded-xl py-2.5 hover:bg-sand-50 transition-colors disabled:opacity-50"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
