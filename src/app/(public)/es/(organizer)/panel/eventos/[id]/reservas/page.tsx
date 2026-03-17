'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Check, MessageCircle, ChevronDown } from 'lucide-react';

interface BookingRow {
  id: string;
  booking_number: string;
  status: string;
  total_price: number;
  platform_fee: number;
  organizer_amount: number;
  platform_payment_status: string;
  remaining_payment_status: string;
  remaining_payment_due_date: string | null;
  form_responses: Record<string, unknown>;
  organizer_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  profiles: { id: string; full_name: string; email: string; phone: string | null; avatar_url: string | null } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmada', color: 'bg-sage-100 text-sage-700' },
  pending_confirmation: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  pending_payment: { label: 'Pago pendiente', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completada', color: 'bg-sand-200 text-foreground' },
  cancelled_by_attendee: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  cancelled_by_organizer: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
};

export default function ReservasEventoPage() {
  const params = useParams();
  const retreatId = params.id as string;
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchBookings() {
    try {
      const res = await fetch(`/api/organizer/events/${retreatId}/bookings`);
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBookings(); }, [retreatId]);

  async function confirmBooking(bookingId: string) {
    setActionLoading(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      await fetchBookings();
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectBooking(bookingId: string) {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    setActionLoading(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      await fetchBookings();
    } finally {
      setActionLoading(null);
    }
  }

  async function markAsPaid(bookingId: string) {
    setActionLoading(bookingId);
    try {
      await fetch(`/api/organizer/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'manual' }),
      });
      await fetchBookings();
    } finally {
      setActionLoading(null);
    }
  }

  const confirmed = bookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).length;
  const pendingPayment = bookings.filter((b) => b.remaining_payment_status === 'pending' && b.status === 'confirmed').length;
  const totalIncome = bookings
    .filter((b) => ['confirmed', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.organizer_amount), 0);

  return (
    <div>
      <Link href={`/es/panel/eventos/${retreatId}`} className="inline-flex items-center gap-1.5 text-sm text-terracotta-600 font-medium mb-6">← Volver al retiro</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-foreground">Reservas del retiro</h1>
        <a
          href={`/api/organizer/events/${retreatId}/bookings/export`}
          className="flex items-center gap-2 text-sm font-medium bg-white border border-sand-300 px-4 py-2 rounded-xl hover:bg-sand-50"
        >
          <Download size={16} /> Exportar CSV
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
          <p className="text-2xl font-bold">{confirmed}</p>
          <p className="text-xs text-[#7a6b5d]">Confirmadas</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-2xl font-bold">{pendingPayment}</p>
          <p className="text-xs text-[#7a6b5d]">80% pendiente</p>
        </div>
        <div className="bg-terracotta-50 border border-terracotta-200 rounded-xl p-4">
          <p className="text-2xl font-bold">{totalIncome.toLocaleString()}€</p>
          <p className="text-xs text-[#7a6b5d]">Ingresos (80%)</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#7a6b5d]">Cargando reservas...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[#7a6b5d]">Aún no hay reservas para este retiro</p>
        </div>
      ) : (
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50">
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Asistente</th>
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">20%</th>
                <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">80%</th>
                <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const s = STATUS_LABELS[b.status] || { label: b.status, color: 'bg-sand-200 text-foreground' };
                const profile = b.profiles;
                const isPending = b.status === 'pending_confirmation';
                const canMarkPaid = b.status === 'confirmed' && b.remaining_payment_status === 'pending';

                return (
                  <tr key={b.id} className="border-b border-sand-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-xs font-bold text-sage-700 shrink-0">
                          {(profile?.full_name || '?')[0]}
                        </div>
                        <div>
                          <p className="font-medium">{profile?.full_name || 'Asistente'}</p>
                          <p className="text-xs text-[#a09383] md:hidden">{profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{profile?.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.platform_payment_status === 'paid'
                        ? <span className="text-sage-600">✓</span>
                        : <span className="text-amber-500">⏳</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.remaining_payment_status === 'confirmed_by_organizer'
                        ? <span className="text-sage-600">✓</span>
                        : <span className="text-amber-500">⏳</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPending && (
                          <>
                            <button
                              onClick={() => confirmBooking(b.id)}
                              disabled={actionLoading === b.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sage-100 text-sage-700 hover:bg-sage-200 disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => rejectBooking(b.id)}
                              disabled={actionLoading === b.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {canMarkPaid && (
                          <button
                            onClick={() => markAsPaid(b.id)}
                            disabled={actionLoading === b.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 disabled:opacity-50"
                          >
                            80% pagado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
