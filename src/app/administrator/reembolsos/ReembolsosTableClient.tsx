'use client';

import { EmailLink } from '@/components/ui/email-link';

interface RefundRow {
  id: string;
  attendee: string;
  attendee_email: string | null;
  event: string;
  retreat_slug: string | null;
  amount: number;
  reason: string;
  reason_detail: string | null;
  status: string;
  date: string;
  processed_at: string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  processed: { label: 'Procesado', cls: 'bg-sage-100 text-sage-700' },
  approved: { label: 'Aprobado', cls: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
};

const REASON_LABEL: Record<string, string> = {
  cancelled_by_attendee: 'Cancelación asistente',
  cancelled_by_organizer: 'Retiro cancelado por organizador',
  sla_expired: 'SLA expirado',
  admin_decision: 'Decisión admin',
  dispute: 'Disputa',
  other: 'Otro',
};

export function ReembolsosTableClient({ refunds }: { refunds: RefundRow[] }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {refunds.length === 0 ? (
          <div className="bg-white border border-sand-200 rounded-2xl px-4 py-12 text-center text-[#999] text-sm">No hay reembolsos.</div>
        ) : (
          refunds.map((r) => {
            const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
            const reasonLabel = REASON_LABEL[r.reason] || r.reason;
            const dateStr = r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
            return (
              <div key={r.id} className="bg-white border border-sand-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{r.attendee}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-[#a09383]">Importe:</span> <span className="font-semibold">{r.amount.toFixed(2)}€</span></div>
                  <div><span className="text-[#a09383]">Fecha:</span> {dateStr}</div>
                  <div className="col-span-2"><span className="text-[#a09383]">Motivo:</span> {reasonLabel}</div>
                  {r.event && <div className="col-span-2"><span className="text-[#a09383]">Retiro:</span> {r.retreat_slug ? <a href={`/es/retiro/${r.retreat_slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{r.event}</a> : r.event}</div>}
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
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Asistente</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Retiro</th>
              <th className="text-left py-3 px-4 font-semibold text-[#7a6b5d]">Motivo</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Importe</th>
              <th className="text-center py-3 px-4 font-semibold text-[#7a6b5d]">Estado</th>
              <th className="text-right py-3 px-4 font-semibold text-[#7a6b5d]">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-[#999]">No hay reembolsos.</td></tr>
            ) : (
              refunds.map((r) => {
                const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                const reasonLabel = REASON_LABEL[r.reason] || r.reason;
                const dateStr = r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                return (
                  <tr key={r.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                    <td className="py-3 px-4 font-medium text-[#7a6b5d]">{r.id.slice(0, 8)}…</td>
                    <td className="py-3 px-4">{r.attendee_email ? <EmailLink email={r.attendee_email} className="text-foreground hover:text-terracotta-600 hover:underline">{r.attendee}</EmailLink> : r.attendee}</td>
                    <td className="py-3 px-4 text-[#7a6b5d]">{r.retreat_slug ? <a href={`/es/retiro/${r.retreat_slug}`} target="_blank" rel="noopener" className="text-terracotta-600 hover:underline">{r.event}</a> : r.event}</td>
                    <td className="py-3 px-4 text-[#7a6b5d]" title={r.reason_detail || undefined}>{reasonLabel}{r.reason_detail && <span className="block text-xs truncate max-w-[180px]">{r.reason_detail}</span>}</td>
                    <td className="py-3 px-4 text-right font-semibold">{r.amount.toFixed(2)}€</td>
                    <td className="py-3 px-4 text-center"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span></td>
                    <td className="py-3 px-4 text-right text-[#7a6b5d]">{dateStr}</td>
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
