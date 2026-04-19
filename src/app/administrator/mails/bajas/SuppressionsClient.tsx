'use client';
// Cliente de /administrator/mails/bajas: búsqueda en memoria, alta manual y
// revertir baja (elimina la fila de email_suppressions).
//
// Nota: al revertir NO limpiamos marketing_opt_out_at de los centros que
// compartan ese email, porque no sabemos si su opt-out vino de este
// formulario o de otro motivo. Si un admin quiere reactivar un centro
// concreto, puede hacerlo desde su ficha.

import { useMemo, useState } from 'react';
import { Search, UserMinus, UserPlus, Trash2 } from 'lucide-react';

export type SuppressionRow = {
  id: string;
  email: string;
  reason: string | null;
  source: 'self' | 'admin' | 'bounce' | 'complaint';
  created_at: string;
};

const SOURCE_LABEL: Record<SuppressionRow['source'], { label: string; classes: string }> = {
  self: { label: 'Usuario', classes: 'bg-sage-50 text-sage-700 border-sage-200' },
  admin: { label: 'Admin', classes: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200' },
  bounce: { label: 'Rebote', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  complaint: { label: 'Queja', classes: 'bg-red-50 text-red-700 border-red-200' },
};

function formatDateEs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SuppressionsClient({ initialRows }: { initialRows: SuppressionRow[] }) {
  const [rows, setRows] = useState<SuppressionRow[]>(initialRows);
  const [query, setQuery] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/mailing/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: newReason.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'No se pudo añadir el email');
        return;
      }
      setRows((prev) => [data.suppression as SuppressionRow, ...prev]);
      setNewEmail('');
      setNewReason('');
    } catch (err) {
      setAddError((err as Error).message || 'Error inesperado');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(row: SuppressionRow) {
    const ok = window.confirm(
      `¿Quitar a ${row.email} de la lista de bajas?\n\n` +
        'Volverá a poder recibir mailings si está asociado a algún centro activo. ' +
        'Esta acción no limpia automáticamente los opt-out marcados en los centros.',
    );
    if (!ok) return;

    setRemovingId(row.id);
    try {
      const res = await fetch(`/api/admin/mailing/suppressions?id=${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudo quitar la baja');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert((err as Error).message || 'Error inesperado');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-sand-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserMinus size={16} className="text-terracotta-600" />
          <h2 className="font-serif text-lg text-foreground">Añadir baja manual</h2>
        </div>
        <p className="text-xs text-[#7a6b5d] mb-4">
          Útil cuando alguien pide la baja por teléfono, WhatsApp o email directo. Se marcarán también como
          opt-out los centros que tengan ese email.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            required
            className="flex-1 rounded-xl border border-sand-200 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            maxLength={320}
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="flex-1 sm:max-w-xs rounded-xl border border-sand-200 bg-cream-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="rounded-full bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 transition-colors inline-flex items-center gap-2 justify-center"
          >
            <UserPlus size={14} />
            {adding ? 'Añadiendo…' : 'Añadir baja'}
          </button>
        </form>
        {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-sand-200">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09383]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por email o motivo"
              className="w-full rounded-full border border-sand-200 bg-cream-50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <div className="text-xs text-[#7a6b5d] whitespace-nowrap">
            {filtered.length} / {rows.length} bajas
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-serif text-xl text-foreground mb-2">
              {rows.length === 0 ? 'Aún no hay bajas registradas' : 'Sin resultados'}
            </p>
            <p className="text-sm text-[#7a6b5d]">
              {rows.length === 0
                ? 'Las bajas llegarán desde /api/unsubscribe cuando un usuario retire su consentimiento.'
                : 'Prueba con otro término de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-sand-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Origen</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#7a6b5d]">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#7a6b5d]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const badge = SOURCE_LABEL[r.source] || SOURCE_LABEL.self;
                  return (
                    <tr key={r.id} className="border-b border-sand-100 last:border-0 hover:bg-cream-100/50">
                      <td className="px-4 py-3 font-mono text-xs break-all">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7a6b5d] max-w-[280px]">
                        {r.reason || <span className="text-[#a09383]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7a6b5d] whitespace-nowrap">
                        {formatDateEs(r.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemove(r)}
                          disabled={removingId === r.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                          title="Quitar esta baja"
                        >
                          <Trash2 size={13} />
                          {removingId === r.id ? 'Quitando…' : 'Quitar baja'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
