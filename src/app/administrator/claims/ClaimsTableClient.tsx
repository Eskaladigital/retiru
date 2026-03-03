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
  centers: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    website: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
  } | null;
  profiles: { id: string; full_name: string | null; email: string | null } | null;
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? claims : claims.filter((c) => c.status === filter)),
    [claims, filter],
  );

  const detailClaim = detailId ? claims.find((c) => c.id === detailId) : null;

  async function handleAction(claimId: string, action: 'approve' | 'reject') {
    if (!confirm(action === 'approve' ? '¿Aprobar este claim?' : '¿Rechazar este claim?')) return;
    setActing(claimId);
    try {
      const res = await fetch('/api/admin/center-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action, adminNotes: adminNotes || undefined }),
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

  function emailsMatch(c: ClaimRow): boolean | null {
    if (!c.profiles?.email || !c.centers?.email) return null;
    return c.profiles.email.toLowerCase() === c.centers.email.toLowerCase();
  }

  return (
    <>
      {/* Filtros */}
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

      {/* Tabla */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-50 text-left text-xs font-semibold text-[#a09383] uppercase tracking-wider">
                <th className="px-4 py-3">Centro</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Coincidencia</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
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
                filtered.map((c) => {
                  const match = emailsMatch(c);
                  return (
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
                        {c.centers?.city && (
                          <span className="block text-[11px] text-[#b5a89c]">{c.centers.city}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{c.profiles?.full_name || 'Sin nombre'}</span>
                        {c.profiles?.email && (
                          <span className="block text-xs text-[#a09383]">{c.profiles.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {match === true && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            <span>✓</span> Emails coinciden
                          </span>
                        )}
                        {match === false && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <span>✗</span> No coinciden
                          </span>
                        )}
                        {match === null && (
                          <span className="text-xs text-[#a09383]">—</span>
                        )}
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
                            <button
                              onClick={() => { setDetailId(c.id); setAdminNotes(c.admin_notes || ''); }}
                              className="text-xs font-medium text-terracotta-600 hover:underline px-1"
                            >
                              Detalle
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs text-[#a09383]">
                              {c.reviewed_at
                                ? `Revisado ${new Date(c.reviewed_at).toLocaleDateString('es')}`
                                : '—'}
                            </span>
                            <button
                              onClick={() => { setDetailId(c.id); setAdminNotes(c.admin_notes || ''); }}
                              className="text-xs font-medium text-terracotta-600 hover:underline px-1"
                            >
                              Ver
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle */}
      {detailClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl mb-4">Detalle del claim</h3>

            <div className="space-y-3 text-sm">
              {/* Centro */}
              <div className="bg-sand-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-foreground">{detailClaim.centers?.name}</p>
                {detailClaim.centers?.email && (
                  <p className="text-[#7a6b5d]">Email centro: <span className="font-mono text-xs">{detailClaim.centers.email}</span></p>
                )}
                {detailClaim.centers?.phone && (
                  <p className="text-[#7a6b5d]">Tel: {detailClaim.centers.phone}</p>
                )}
                {detailClaim.centers?.address && (
                  <p className="text-[#7a6b5d]">{detailClaim.centers.address}{detailClaim.centers.city ? `, ${detailClaim.centers.city}` : ''}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {detailClaim.centers?.website && (
                    <a href={detailClaim.centers.website.startsWith('http') ? detailClaim.centers.website : `https://${detailClaim.centers.website}`} target="_blank" rel="noopener" className="text-xs text-terracotta-600 hover:underline">Web</a>
                  )}
                  <a href={`/es/centro/${detailClaim.centers?.slug}`} target="_blank" rel="noopener" className="text-xs text-terracotta-600 hover:underline">Ver ficha en Retiru</a>
                  {detailClaim.centers?.name && (
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(detailClaim.centers.name + (detailClaim.centers.city ? ' ' + detailClaim.centers.city : ''))}`} target="_blank" rel="noopener" className="text-xs text-terracotta-600 hover:underline">Google Maps</a>
                  )}
                </div>
              </div>

              {/* Solicitante */}
              <div className="bg-blue-50/50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-foreground">{detailClaim.profiles?.full_name || 'Sin nombre'}</p>
                {detailClaim.profiles?.email && (
                  <p className="text-[#7a6b5d]">Email usuario: <span className="font-mono text-xs">{detailClaim.profiles.email}</span></p>
                )}
                <p className="text-[#7a6b5d]">Método: {METHOD_LABEL[detailClaim.method] || detailClaim.method}</p>
                {detailClaim.notes && (
                  <p className="text-[#7a6b5d]">Notas del usuario: <em>{detailClaim.notes}</em></p>
                )}
              </div>

              {/* Verificación de emails */}
              {(() => {
                const m = emailsMatch(detailClaim);
                if (m === true) return (
                  <div className="px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                    Los emails del centro y del solicitante <strong>coinciden</strong>. Alta probabilidad de que sea el dueño legítimo.
                  </div>
                );
                if (m === false) return (
                  <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                    Los emails <strong>no coinciden</strong>. Verifica manualmente la identidad del solicitante.
                  </div>
                );
                return (
                  <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm">
                    No se puede comparar emails (falta email del centro o del usuario).
                  </div>
                );
              })()}

              {/* Notas admin */}
              {detailClaim.status === 'pending' && (
                <div>
                  <label className="block text-xs font-semibold text-[#7a6b5d] mb-1.5">Notas del administrador</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notas internas (opcionales)..."
                    className="w-full border border-sand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300 resize-none h-20"
                  />
                </div>
              )}

              {detailClaim.admin_notes && detailClaim.status !== 'pending' && (
                <div className="text-sm text-[#7a6b5d]">
                  <span className="font-semibold">Notas admin:</span> {detailClaim.admin_notes}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setDetailId(null)}
                className="text-sm px-4 py-2 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
              >
                Cerrar
              </button>
              {detailClaim.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction(detailClaim.id, 'reject')}
                    disabled={acting === detailClaim.id}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAction(detailClaim.id, 'approve')}
                    disabled={acting === detailClaim.id}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
