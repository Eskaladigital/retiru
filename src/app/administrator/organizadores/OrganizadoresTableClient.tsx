'use client';

import { useState } from 'react';
import { MessageCircle, Shield } from 'lucide-react';
import { EmailLink } from '@/components/ui/email-link';

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
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {organizers.length === 0 ? (
          <div className="bg-white border border-sand-200 rounded-2xl px-4 py-12 text-center text-[#999] text-sm">No hay organizadores registrados.</div>
        ) : (
          organizers.map((o) => {
            const badge = STATUS_BADGE[o.status] || STATUS_BADGE.pending;
            const date = o.joined ? new Date(o.joined).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            return (
              <div key={o.id} className="bg-white border border-sand-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline font-medium text-sm truncate">{o.name}</a>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
                </div>
                {o.email && <p className="text-xs text-[#7a6b5d] truncate">{o.email}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-[#a09383]">Retiros:</span> {o.events}</div>
                  <div><span className="text-[#a09383]">Reservas:</span> {o.total_bookings}</div>
                  <div><span className="text-[#a09383]">Registro:</span> {date}</div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 border-t border-sand-100">
                  {o.status !== 'verified' && (
                    <a href={`/administrator/organizadores/${o.id}/verificar`} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 px-2 py-1.5 rounded-lg transition-colors"><Shield size={14} /> Verificar</a>
                  )}
                  {o.status === 'verified' && (
                    <a href={`/administrator/organizadores/${o.id}/verificar`} className="inline-flex items-center gap-1 text-xs font-medium text-sage-600 hover:bg-sage-50 px-2 py-1.5 rounded-lg transition-colors"><Shield size={14} /> Docs</a>
                  )}
                  {o.user_id && (
                    <button onClick={() => handleMessage(o.user_id!)} disabled={messaging === o.user_id} className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:bg-terracotta-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"><MessageCircle size={14} /> Mensaje</button>
                  )}
                  <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline px-2 py-1.5">Ver perfil</a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50">
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Email</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Retiros</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Reservas</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Registro</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]"></th>
            </tr>
          </thead>
          <tbody>
            {organizers.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-[#999]">No hay organizadores registrados.</td></tr>
            ) : (
              organizers.map((o) => {
                const badge = STATUS_BADGE[o.status] || STATUS_BADGE.pending;
                const date = o.joined ? new Date(o.joined).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                return (
                  <tr key={o.id} id={`org-${o.id}`} className="border-b border-sand-100 hover:bg-sand-50/50 scroll-mt-24">
                    <td className="py-3 px-4 font-medium"><a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{o.name}</a></td>
                    <td className="py-3 px-4 text-[#7a6b5d]"><EmailLink email={o.email} className="text-[#7a6b5d] hover:text-terracotta-600 hover:underline break-all" /></td>
                    <td className="py-3 px-4 text-center">{o.events}</td>
                    <td className="py-3 px-4 text-center">{o.total_bookings}</td>
                    <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span></td>
                    <td className="py-3 px-4 text-[#a09383]">{date}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status !== 'verified' && <a href={`/administrator/organizadores/${o.id}/verificar`} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1.5 rounded-lg transition-colors"><Shield size={14} /> Verificar</a>}
                        {o.status === 'verified' && <a href={`/administrator/organizadores/${o.id}/verificar`} className="inline-flex items-center gap-1 text-xs font-medium text-sage-600 hover:text-sage-700 hover:bg-sage-50 px-2 py-1.5 rounded-lg transition-colors"><Shield size={14} /> Docs</a>}
                        {o.user_id && <button onClick={() => handleMessage(o.user_id!)} disabled={messaging === o.user_id} className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"><MessageCircle size={14} /> Mensaje</button>}
                        <a href={`/es/organizador/${o.slug}`} target="_blank" rel="noopener" className="text-xs font-semibold text-terracotta-600 hover:underline">Ver perfil</a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
