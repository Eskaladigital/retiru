// PVP = precio público; reparto 80 % organizador / 20 % Retiru (misma lógica que columnas generadas en BD)
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
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a09383] mb-2">Precio público (PVP) y reparto</p>
      <p className="text-sm text-foreground leading-snug mb-3">
        El número que indicas arriba es el <strong>PVP</strong>: lo que <strong>paga el público</strong> por plaza en Retiru. No se añade comisión encima del checkout.
      </p>
      <div className="rounded-lg bg-amber-50/80 border border-amber-200/70 px-3 py-2.5 mb-4">
        <p className="text-xs text-foreground leading-relaxed">
          <strong className="text-amber-900">Para el organizador:</strong> de ese PVP solo percibes{' '}
          <strong className="text-sage-800">el 80&nbsp;%</strong> (es decir, <strong>0,8&nbsp;€ de cada euro</strong> que paga el asistente).
          El <strong className="text-terracotta-800">20&nbsp;% restante</strong> (<strong>0,2&nbsp;€ de cada euro</strong>) es la{' '}
          <strong>comisión de Retiru</strong> (plataforma, cobro, difusión y soporte).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg bg-white border border-sand-200 p-3">
          <p className="text-[#a09383] text-xs mb-1 leading-tight">PVP — paga el asistente</p>
          <p className="font-bold text-lg text-foreground tabular-nums">{formatPrice(n)}</p>
          <p className="text-[11px] text-[#a09383] mt-1">100&nbsp;% del precio mostrado</p>
        </div>
        <div className="rounded-lg bg-white border border-sage-200/80 p-3 ring-1 ring-sage-200/50">
          <p className="text-[#a09383] text-xs mb-1 leading-tight">Tú percibes (80&nbsp;% del PVP)</p>
          <p className="font-semibold text-lg text-sage-800 tabular-nums">{formatPrice(organizer)}</p>
          <p className="text-[11px] text-sage-700 mt-1 font-medium">0,8 × PVP — tu ingreso neto</p>
        </div>
        <div className="rounded-lg bg-white border border-terracotta-200/80 p-3">
          <p className="text-[#a09383] text-xs mb-1 leading-tight">Retiru (20&nbsp;% del PVP)</p>
          <p className="font-semibold text-lg text-terracotta-700 tabular-nums">{formatPrice(platform)}</p>
          <p className="text-[11px] text-terracotta-700/90 mt-1">0,2 × PVP — comisión plataforma</p>
        </div>
      </div>
    </div>
  );
}
