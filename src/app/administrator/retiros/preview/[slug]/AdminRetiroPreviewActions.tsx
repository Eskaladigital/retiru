'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AdminRetiroPreviewActions({ retreatId }: { retreatId: string }) {
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function handleApprove() {
    if (!confirm('¿Aprobar y publicar este retiro?')) return;
    setActing(true);
    try {
      const res = await fetch('/api/admin/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, action: 'approve' }),
      });
      if (res.ok) {
        window.location.href = '/administrator/retiros';
      } else {
        const data = await res.json();
        alert(data.error || 'Error al aprobar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    setActing(true);
    try {
      const res = await fetch('/api/admin/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId, action: 'reject', rejectionReason: rejectReason || undefined }),
      });
      if (res.ok) {
        window.location.href = '/administrator/retiros';
      } else {
        const data = await res.json();
        alert(data.error || 'Error al rechazar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setActing(false);
      setRejecting(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Link
        href="/administrator/retiros"
        className="text-sm font-medium text-[#7a6b5d] hover:text-terracotta-600"
      >
        ← Volver a retiros
      </Link>
      <span className="text-sand-300">|</span>
      <button
        onClick={handleApprove}
        disabled={acting}
        className="text-sm font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        Aprobar y publicar
      </button>
      {rejecting ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo del rechazo (opcional)"
            className="px-3 py-1.5 rounded-lg border border-sand-200 text-sm w-64"
          />
          <button
            onClick={handleReject}
            disabled={acting}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
          <button
            onClick={() => setRejecting(false)}
            className="text-sm text-[#7a6b5d] hover:underline"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setRejecting(true)}
          disabled={acting}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          Rechazar
        </button>
      )}
    </div>
  );
}
