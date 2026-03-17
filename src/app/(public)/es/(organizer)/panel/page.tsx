'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    activeRetreats: number;
    bookingsThisMonth: number;
    pendingIncome: number;
    avgRating: number;
    reviewCount: number;
    unreadMessages: number;
  };
  recentBookings: {
    id: string;
    bookingNumber: string;
    attendeeName: string;
    retreatTitle: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  businessName: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending_confirmation: 'Pendiente',
  pending_payment: 'Pago pendiente',
  completed: 'Completada',
  cancelled_by_attendee: 'Cancelada',
  rejected: 'Rechazada',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Hace unos minutos';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export default function PanelDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizer/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-[#7a6b5d]">Cargando dashboard...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🎯</p>
        <h3 className="font-serif text-xl mb-2">Bienvenido a tu panel</h3>
        <p className="text-sm text-[#7a6b5d] mb-6">Crea tu primer evento para empezar a recibir reservas</p>
        <Link href="/es/mis-eventos/nuevo" className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
          Crear evento
        </Link>
      </div>
    );
  }

  const { kpis, recentBookings, businessName } = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">¡Hola, {businessName}!</h1>
        <p className="text-[#7a6b5d] mt-1">Aquí tienes un resumen de tu actividad</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Retiros activos', value: String(kpis.activeRetreats), icon: '📅', color: 'bg-terracotta-50 border-terracotta-200' },
          { label: 'Reservas este mes', value: String(kpis.bookingsThisMonth), icon: '📋', color: 'bg-sage-50 border-sage-200' },
          { label: 'Ingresos pendientes', value: `${kpis.pendingIncome.toLocaleString()}€`, icon: '💰', color: 'bg-amber-50 border-amber-200' },
          { label: 'Valoración media', value: kpis.avgRating > 0 ? kpis.avgRating.toFixed(1) : '—', icon: '⭐', color: 'bg-sand-100 border-sand-300' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.color}`}>
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
            <p className="text-xs text-[#7a6b5d] mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl">Últimas reservas</h2>
          <Link href="/es/panel/eventos" className="text-sm text-terracotta-600 font-medium hover:underline">Ver todas</Link>
        </div>
        {recentBookings.length > 0 ? (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-sand-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-sm font-bold text-sage-700">{b.attendeeName[0]}</div>
                  <div>
                    <p className="text-sm font-medium">{b.attendeeName}</p>
                    <p className="text-xs text-[#a09383]">{b.retreatTitle} · {timeAgo(b.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{Number(b.amount).toFixed(0)}€</p>
                  <p className="text-xs text-[#a09383]">{STATUS_LABELS[b.status] || b.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-sm text-[#7a6b5d]">Aún no tienes reservas</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/es/mis-eventos/nuevo" className="flex items-center gap-3 bg-terracotta-600 text-white rounded-2xl p-5 hover:bg-terracotta-700 transition-colors">
          <span className="text-2xl">➕</span>
          <div><p className="font-semibold">Nuevo retiro</p><p className="text-xs text-terracotta-200">Crea y publica un retiro</p></div>
        </Link>
        <Link href="/es/panel/mensajes" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">💬</span>
          <div><p className="font-semibold">{kpis.unreadMessages > 0 ? `${kpis.unreadMessages} mensajes nuevos` : 'Mensajes'}</p><p className="text-xs text-[#a09383]">Responde a tus asistentes</p></div>
        </Link>
        <Link href="/es/panel/asistentes" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">👥</span>
          <div><p className="font-semibold">Asistentes</p><p className="text-xs text-[#a09383]">Gestiona tus asistentes</p></div>
        </Link>
      </div>
    </div>
  );
}
