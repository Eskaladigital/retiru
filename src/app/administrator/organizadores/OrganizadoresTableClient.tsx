'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface OrganizerRow {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  full_name: string | null;
  events: number;
  status: string;
  joined: string;
  verified_at: string | null;
  total_bookings: number;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verificado', cls: 'bg-sage-100 text-sage-700' },
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspendido', cls: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rechazado', cls: 'bg-sand-200 text-[#7a6b5d]' },
};

export function OrganizadoresTableClient({ organizers }: { organizers: OrganizerRow[] }) {
  const [messaging, setMessaging] = useState<string | null>(null);

  async function handleMessage(userId: string) {
    setMessaging(userId);
    try {
      const res = await fetch('/api/admin/messages/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.conversation_id) {
        window.location.href = `/administrator/mensajes?open=${data.conversation_id}`;
      } else {
        alert(data.error || 'Error al abrir conversación');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setMessaging(null);
    }
  }

  return (
    <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand-200 bg-sand-50">
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d] hidden md:table-cell">Email</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Reservas</th>
            <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
            <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Registro</th>
            <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
          </tr>
        </thead>
        <tbody>
          {organizers.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-[#999]">
                No hay organizadores registrados.
              </td>
            </tr>
          ) : (
            organizers.map((o) => {
              const badge = STATUS_BADGE[o.status] || STATUS_BADGE.pending;
              const date = o.joined ? new Date(o.joined).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              return (
                <tr key={o.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="py-3 px-4 font-medium">
                    <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">
                      {o.name}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-[#7a6b5d] hidden md:table-cell">{o.email || '—'}</td>
                  <td className="py-3 px-4 text-center">{o.events}</td>
                  <td className="py-3 px-4 text-center">{o.total_bookings}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#a09383]">{date}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {o.user_id && (
                        <button
                          onClick={() => handleMessage(o.user_id!)}
                          disabled={messaging === o.user_id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          title="Enviar mensaje"
                        >
                          <MessageCircle size={14} />
                          Mensaje
                        </button>
                      )}
                      <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline">
                        Ver perfil
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
