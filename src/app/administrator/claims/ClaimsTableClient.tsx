'use client';

import { useState, useMemo } from 'react';

interface ClaimRow {
  id: string;
  center_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  method: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  centers: { id: string; name: string; slug: string; email: string | null } | null;
  profiles: { id: string; full_name: string | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const METHOD_LABEL: Record<string, string> = {
  email_match: 'Email coincidente',
  magic_link: 'Link mágico',
  manual_request: 'Solicitud manual',
};

export function ClaimsTableClient({ claims }: { claims: ClaimRow[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [acting, setActing] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? claims : claims.filter((c) => c.status === filter)),
    [claims, filter],
  );

  async function handleAction(claimId: string, action: 'approve' | 'reject') {
    if (!confirm(action === 'approve' ? '¿Aprobar este claim?' : '¿Rechazar este claim?')) return;
    setActing(claimId);
    try {
      const res = await fetch('/api/admin/center-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al procesar el claim');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-terracotta-600 text-white border-terracotta-600'
                : 'bg-white text-[#7a6b5d] border-sand-200 hover:border-terracotta-300'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobados' : 'Rechazados'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-50 text-left text-xs font-semibold text-[#a09383] uppercase tracking-wider">
                <th className="px-4 py-3">Centro</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#a09383]">
                    No hay claims {filter !== 'all' ? `con estado "${filter}"` : ''}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <a
                        href={`/es/centro/${c.centers?.slug || ''}`}
                        target="_blank"
                        rel="noopener"
                        className="text-terracotta-600 hover:underline font-medium"
                      >
                        {c.centers?.name || c.center_id}
                      </a>
                      {c.centers?.email && (
                        <span className="block text-xs text-[#a09383]">{c.centers.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.profiles?.full_name || 'Sin nombre'}</span>
                      <span className="block text-xs text-[#a09383] truncate max-w-[140px]">{c.user_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{METHOD_LABEL[c.method] || c.method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_BADGE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7a6b5d] whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('es')}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7a6b5d] max-w-[180px] truncate">
                      {c.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAction(c.id, 'approve')}
                            disabled={acting === c.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleAction(c.id, 'reject')}
                            disabled={acting === c.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#a09383]">
                          {c.reviewed_at
                            ? `Revisado ${new Date(c.reviewed_at).toLocaleDateString('es')}`
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
