'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ContentIssue {
  type: string;
  field: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestedFix?: string;
}

export function AdminRetiroPreviewActions({ retreatId }: { retreatId: string }) {
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [moderating, setModerating] = useState(false);
  const [moderationIssues, setModerationIssues] = useState<ContentIssue[]>([]);
  const [showIssues, setShowIssues] = useState(false);

  async function handleApprove() {
    // Primero ejecutar moderación
    setModerating(true);
    setModerationIssues([]);
    setShowIssues(false);

    try {
      const modRes = await fetch('/api/admin/retreats/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId }),
      });

      if (modRes.ok) {
        const modResult = await modRes.json();
        if (modResult.hasCriticalIssues) {
          setModerationIssues(modResult.issues);
          setShowIssues(true);
          setModerating(false);
          return;
        }
        // Si hay issues no críticos, mostrar advertencia pero permitir aprobar
        if (modResult.issues?.length > 0) {
          const confirm = window.confirm(
            `Se detectaron ${modResult.issues.length} advertencia(s) de moderación.\n\n` +
            modResult.issues.map((i: ContentIssue) => `• ${i.description}`).join('\n') +
            '\n\n¿Continuar con la aprobación?'
          );
          if (!confirm) {
            setModerating(false);
            return;
          }
        }
      } else {
        console.error('Error en moderación, continuando sin revisar');
      }
    } catch (err) {
      console.error('Error al moderar contenido:', err);
    }

    setModerating(false);

    // Proceder con aprobación
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
    <>
      {showIssues && moderationIssues.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 p-5">
          <h3 className="mb-3 font-serif text-lg font-semibold text-red-900">
            ⚠️ Problemas críticos detectados — No se puede aprobar
          </h3>
          <p className="mb-4 text-sm text-red-800">
            El contenido de este retiro contiene información sensible que no debe aparecer en la ficha pública.
            El organizador debe editar el retiro y eliminar estos datos antes de poder publicarse:
          </p>
          <ul className="space-y-3">
            {moderationIssues.map((issue, i) => (
              <li key={i} className="rounded-lg bg-white border border-red-200 p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    issue.severity === 'high' ? 'bg-red-600 text-white' :
                    issue.severity === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {issue.severity === 'high' ? 'CRÍTICO' : issue.severity === 'medium' ? 'ADVERTENCIA' : 'INFO'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{issue.description}</p>
                    <p className="mt-1 text-xs text-gray-600">Campo: {issue.field}</p>
                    {issue.suggestedFix && (
                      <p className="mt-2 text-xs text-gray-700 italic">💡 Sugerencia: {issue.suggestedFix}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowIssues(false)}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white border border-red-300 text-red-700 hover:bg-red-50"
            >
              Cerrar advertencias
            </button>
            <button
              onClick={() => {
                setRejecting(true);
                setShowIssues(false);
                setRejectReason(
                  'El contenido contiene información sensible (contacto directo, precios, o enlaces externos). ' +
                  'Por favor, edita el retiro y elimina: ' +
                  moderationIssues.map(i => i.description).join('; ')
                );
              }}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Rechazar con estas razones
            </button>
          </div>
        </div>
      )}

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
        disabled={acting || moderating}
        className="text-sm font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {moderating ? 'Revisando contenido...' : 'Aprobar y publicar'}
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
    </>
  );
}
