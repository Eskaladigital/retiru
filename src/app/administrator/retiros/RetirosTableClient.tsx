'use client';

import { useState, useMemo } from 'react';

interface RetreatRow {
  id: string;
  title_es: string;
  slug: string;
  status: string;
  total_price: number;
  max_attendees: number;
  confirmed_bookings: number;
  start_date: string;
  end_date: string;
  created_at: string;
  published_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
}

type FilterStatus = 'all' | 'pending_review' | 'draft' | 'published' | 'rejected' | 'archived' | 'cancelled';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending_review: { label: 'Pendiente revisión', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  published: { label: 'Publicado', className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rechazado', className: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: 'Archivado', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending_review', label: 'Pendientes' },
  { value: 'draft', label: 'Borradores' },
  { value: 'published', label: 'Publicados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'archived', label: 'Archivados' },
];

export function RetirosTableClient({ retreats }: { retreats: RetreatRow[] }) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [acting, setActing] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? retreats : retreats.filter((r) => r.status === filter)),
    [retreats, filter],
  );

  const pendingCount = retreats.filter((r) => r.status === 'pending_review').length;

  async function handleApprove(retreatId: string) {
    if (!confirm('¿Aprobar y publicar este retiro?')) return;
    setActing(retreatId);
    try {
      const res = await fetch('/api/admin/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, action: 'approve' }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al aprobar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  async function handleReject(retreatId: string) {
    setActing(retreatId);
    try {
      const res = await fetch('/api/admin/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, action: 'reject', rejectionReason: rejectReason || undefined }),
      });
      if (res.ok) {
        setRejectId(null);
        setRejectReason('');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al rechazar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  async function handleAction(retreatId: string, action: 'cancel' | 'archive' | 'delete') {
    const messages = {
      cancel: '¿Cancelar este retiro? Dejará de mostrarse al público.',
      archive: '¿Archivar este retiro? Se ocultará pero se conservarán los datos.',
      delete: '¿Eliminar definitivamente? Solo es posible si no tiene reservas activas.',
    };
    if (!confirm(messages[action])) return;
    setActing(retreatId);
    try {
      const res = await fetch('/api/admin/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, action }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || `Error al ${action}`);
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.value
                ? 'bg-terracotta-600 text-white border-terracotta-600'
                : 'bg-white text-[#7a6b5d] border-sand-200 hover:border-terracotta-300'
            }`}
          >
            {f.label}
            {f.value === 'pending_review' && pendingCount > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-50 text-left text-xs font-semibold text-[#a09383] uppercase tracking-wider">
                <th className="px-4 py-3">Retiro</th>
                <th className="px-4 py-3 hidden md:table-cell">Organizador</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Precio</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Reservas</th>
                <th className="px-4 py-3 hidden sm:table-cell">Fechas</th>
                <th className="px-4 py-3 hidden lg:table-cell">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#a09383]">
                    No hay retiros {filter !== 'all' ? `con estado "${STATUS_BADGE[filter]?.label || filter}"` : ''}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.draft;
                  return (
                    <tr key={r.id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={r.status === 'published' ? `/es/retiro/${r.slug}` : `/administrator/retiros/preview/${r.slug}`}
                          target={r.status === 'published' ? '_blank' : undefined}
                          rel={r.status === 'published' ? 'noopener' : undefined}
                          className="text-terracotta-600 hover:underline font-medium line-clamp-2"
                        >
                          {r.title_es}
                        </a>
                        {r.rejection_reason && (
                          <span className="block text-xs text-red-500 mt-0.5 truncate max-w-[220px]" title={r.rejection_reason}>
                            Motivo: {r.rejection_reason}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-medium text-xs">{r.organizer_name || '—'}</span>
                        {r.organizer_email && (
                          <span className="block text-[11px] text-[#a09383] truncate max-w-[160px]">{r.organizer_email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium whitespace-nowrap">
                        {r.total_price}€
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-xs">{r.confirmed_bookings}/{r.max_attendees}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-[#7a6b5d] whitespace-nowrap">
                        {new Date(r.start_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(r.end_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#a09383] whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('es')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {r.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                disabled={acting === r.id}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => setRejectId(r.id)}
                                disabled={acting === r.id}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          <a
                            href={r.status === 'published' ? `/es/retiro/${r.slug}` : `/administrator/retiros/preview/${r.slug}`}
                            target={r.status === 'published' ? '_blank' : undefined}
                            rel={r.status === 'published' ? 'noopener' : undefined}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sand-100 text-[#7a6b5d] hover:bg-sand-200 transition-colors"
                          >
                            Ver
                          </a>
                          <a
                            href={`/administrator/retiros/${r.id}/editar`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 transition-colors"
                          >
                            Editar
                          </a>
                          {!['cancelled', 'archived'].includes(r.status) && (
                            <button
                              onClick={() => handleAction(r.id, 'cancel')}
                              disabled={acting === r.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(r.id, 'delete')}
                            disabled={acting === r.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de rechazo */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl mb-3">Rechazar retiro</h3>
            <p className="text-sm text-[#7a6b5d] mb-4">
              Indica el motivo del rechazo. El organizador podrá verlo y corregir su retiro.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (opcional pero recomendado)..."
              className="w-full border border-sand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 resize-none h-24"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="text-sm px-4 py-2 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                disabled={acting === rejectId}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
