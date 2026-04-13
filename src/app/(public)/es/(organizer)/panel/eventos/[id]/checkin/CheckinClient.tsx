'use client';

import { useState } from 'react';

interface Attendee {
  id: string;
  name: string;
  avatar?: string | null;
  checkedIn: boolean;
  time: string | null;
}

export function CheckinClient({ attendees: initial, retreatId }: { attendees: Attendee[]; retreatId: string }) {
  const [attendees, setAttendees] = useState(initial);
  const [acting, setActing] = useState<string | null>(null);

  async function handleCheckin(bookingId: string) {
    setActing(bookingId);
    try {
      const res = await fetch(`/api/organizer/events/${retreatId}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        setAttendees(prev =>
          prev.map(a => a.id === bookingId ? { ...a, checkedIn: true, time: timeStr } : a)
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al marcar check-in');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-2">
      {attendees.map((a) => (
        <div key={a.id} className="flex items-center justify-between bg-white border border-sand-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                a.checkedIn ? 'bg-sage-100 text-sage-700' : 'bg-sand-200 text-[#a09383]'
              }`}
            >
              {a.checkedIn ? '✓' : '—'}
            </span>
            <span className="text-sm font-medium">{a.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {a.time && <span className="text-xs text-[#a09383]">{a.time}</span>}
            {!a.checkedIn && (
              <button
                onClick={() => handleCheckin(a.id)}
                disabled={acting === a.id}
                className="text-xs font-semibold text-terracotta-600 hover:underline disabled:opacity-50"
              >
                {acting === a.id ? 'Marcando...' : 'Marcar'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
