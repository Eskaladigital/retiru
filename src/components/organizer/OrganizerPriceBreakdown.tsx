// Desglose comisión 20 % / neto organizador para formularios de evento (precio público todo incluido)
import { calculateOrganizerAmount, calculatePlatformFee, formatPrice } from '@/lib/utils';

interface OrganizerPriceBreakdownProps {
  /** Valor del input de precio (string permite vacío o borrador) */
  priceInput: string;
}

export function OrganizerPriceBreakdown({ priceInput }: OrganizerPriceBreakdownProps) {
  const raw = String(priceInput).replace(',', '.').trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 50) return null;

  const platform = calculatePlatformFee(n);
  const organizer = calculateOrganizerAmount(n);

  return (
    <div className="rounded-xl border border-sand-200 bg-gradient-to-br from-sand-50/90 to-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a09383] mb-1.5">Reparto por cada plaza</p>
      <p className="text-xs text-[#7a6b5d] leading-relaxed mb-4">
        El precio que indicas es el <strong className="text-foreground">importe final</strong> que paga el asistente en Retiru.
        La comisión de la plataforma va <strong className="text-foreground">incluida</strong> en esa cifra (no se suma aparte al usuario).
      </p>
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg bg-white border border-sand-200 p-3">
          <p className="text-[#a09383] text-xs mb-1">Paga el asistente</p>
          <p className="font-bold text-lg text-foreground tabular-nums">{formatPrice(n)}</p>
        </div>
        <div className="rounded-lg bg-white border border-sage-200/80 p-3">
          <p className="text-[#a09383] text-xs mb-1">Te queda a ti (80&nbsp;%)</p>
          <p className="font-semibold text-lg text-sage-800 tabular-nums">{formatPrice(organizer)}</p>
        </div>
        <div className="rounded-lg bg-white border border-terracotta-200/80 p-3">
          <p className="text-[#a09383] text-xs mb-1">Retiru (20&nbsp;%)</p>
          <p className="font-semibold text-lg text-terracotta-700 tabular-nums">{formatPrice(platform)}</p>
        </div>
      </div>
    </div>
  );
}
