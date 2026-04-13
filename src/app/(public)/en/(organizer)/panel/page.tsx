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
  confirmed: 'Confirmed',
  pending_confirmation: 'Pending',
  pending_payment: 'Payment pending',
  completed: 'Completed',
  cancelled_by_attendee: 'Cancelled',
  rejected: 'Rejected',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function PanelDashboardPageEn() {
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
      <div className="text-center py-16 text-[#7a6b5d]">Loading dashboard…</div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🎯</p>
        <h3 className="font-serif text-xl mb-2">Welcome to your panel</h3>
        <p className="text-sm text-[#7a6b5d] mb-6">Create your first event to start receiving bookings</p>
        <Link href="/en/panel/eventos/nuevo" className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors">
          Create event
        </Link>
      </div>
    );
  }

  const { kpis, recentBookings, businessName } = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Hello, {businessName}!</h1>
        <p className="text-[#7a6b5d] mt-1">Here is a snapshot of your activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active retreats', value: String(kpis.activeRetreats), icon: '📅', color: 'bg-terracotta-50 border-terracotta-200' },
          { label: 'Bookings this month', value: String(kpis.bookingsThisMonth), icon: '📋', color: 'bg-sage-50 border-sage-200' },
          { label: 'Pending payouts', value: `${kpis.pendingIncome.toLocaleString()}€`, icon: '💰', color: 'bg-amber-50 border-amber-200' },
          { label: 'Average rating', value: kpis.avgRating > 0 ? kpis.avgRating.toFixed(1) : '—', icon: '⭐', color: 'bg-sand-100 border-sand-300' },
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
          <h2 className="font-serif text-xl">Latest bookings</h2>
          <Link href="/en/panel/eventos" className="text-sm text-terracotta-600 font-medium hover:underline">View all</Link>
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
          <p className="text-center py-6 text-sm text-[#7a6b5d]">No bookings yet</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/en/panel/eventos/nuevo" className="flex items-center gap-3 bg-terracotta-600 text-white rounded-2xl p-5 hover:bg-terracotta-700 transition-colors">
          <span className="text-2xl">➕</span>
          <div><p className="font-semibold">New retreat</p><p className="text-xs text-terracotta-200">Create and publish a retreat</p></div>
        </Link>
        <Link href="/en/panel/mensajes" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">💬</span>
          <div><p className="font-semibold">{kpis.unreadMessages > 0 ? `${kpis.unreadMessages} new messages` : 'Messages'}</p><p className="text-xs text-[#a09383]">Reply to your attendees</p></div>
        </Link>
        <Link href="/en/panel/asistentes" className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl p-5 hover:shadow-soft transition-all">
          <span className="text-2xl">👥</span>
          <div><p className="font-semibold">Attendees</p><p className="text-xs text-[#a09383]">Manage your attendees</p></div>
        </Link>
      </div>
    </div>
  );
}
