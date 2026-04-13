// PVP = precio público; reparto variable según tier de comisión del organizador
import { calculateOrganizerAmount, calculatePlatformFee, formatPrice } from '@/lib/utils';

interface OrganizerPriceBreakdownProps {
  /** Valor del input de precio (string permite vacío o borrador) */
  priceInput: string;
  /** Porcentaje de comisión Retiru para este organizador (0, 10 o 20). Default 20. */
  commissionPercent?: number;
  /** Número de retiros con reservas pagadas (para mostrar tier). Si no se pasa, se infiere de commissionPercent. */
  paidRetreatsCount?: number;
}

function TierBadge({ commissionPercent, paidRetreatsCount }: { commissionPercent: number; paidRetreatsCount?: number }) {
  if (commissionPercent === 0) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 mb-4">
        <p className="text-xs text-foreground leading-relaxed">
          <strong className="text-emerald-800">Tu primer retiro es gratis:</strong>{' '}
          Retiru no cobra comisión en tu primer retiro. El <strong className="text-emerald-700">100&nbsp;%</strong> del PVP es para ti.
          Queremos que pruebes la plataforma sin riesgo.
        </p>
      </div>
    );
  }
  if (commissionPercent === 10) {
    return (
      <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2.5 mb-4">
        <p className="text-xs text-foreground leading-relaxed">
          <strong className="text-sky-800">Comisión reducida en tu segundo retiro:</strong>{' '}
          solo el <strong className="text-sky-700">10&nbsp;%</strong> del PVP es para Retiru; tú percibes el <strong className="text-sky-700">90&nbsp;%</strong> neto.
          A partir del tercer retiro se aplica la comisión estándar (20&nbsp;%).
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-amber-50/80 border border-amber-200/70 px-3 py-2.5 mb-4">
      <p className="text-xs text-foreground leading-relaxed">
        <strong className="text-amber-900">Comisión estándar:</strong> de ese PVP percibes{' '}
        <strong className="text-sage-800">el 80&nbsp;%</strong>; el{' '}
        <strong className="text-terracotta-800">20&nbsp;% restante</strong> es la{' '}
        <strong>comisión de Retiru</strong> (plataforma, cobro, difusión y soporte).
      </p>
    </div>
  );
}

export function OrganizerPriceBreakdown({ priceInput, commissionPercent = 20, paidRetreatsCount }: OrganizerPriceBreakdownProps) {
  const raw = String(priceInput).replace(',', '.').trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 50) return null;

  const cp = commissionPercent;
  const orgPercent = 100 - cp;
  const platform = calculatePlatformFee(n, cp);
  const organizer = calculateOrganizerAmount(n, cp);

  return (
    <div className="rounded-xl border border-sand-200 bg-gradient-to-br from-sand-50/90 to-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a09383] mb-2">Precio público (PVP) y reparto</p>
      <p className="text-sm text-foreground leading-snug mb-3">
        El número que indicas arriba es el <strong>PVP</strong>: lo que <strong>paga el público</strong> por plaza en Retiru. No se añade comisión encima del checkout.
      </p>
      <TierBadge commissionPercent={cp} paidRetreatsCount={paidRetreatsCount} />
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg bg-white border border-sand-200 p-3">
          <p className="text-[#a09383] text-xs mb-1 leading-tight">PVP — paga el asistente</p>
          <p className="font-bold text-lg text-foreground tabular-nums">{formatPrice(n)}</p>
          <p className="text-[11px] text-[#a09383] mt-1">100&nbsp;% del precio mostrado</p>
        </div>
        <div className="rounded-lg bg-white border border-sage-200/80 p-3 ring-1 ring-sage-200/50">
          <p className="text-[#a09383] text-xs mb-1 leading-tight">Tú percibes ({orgPercent}&nbsp;% del PVP)</p>
          <p className="font-semibold text-lg text-sage-800 tabular-nums">{formatPrice(organizer)}</p>
          <p className="text-[11px] text-sage-700 mt-1 font-medium">{(orgPercent / 100).toFixed(1).replace('.', ',')} × PVP — tu ingreso neto</p>
        </div>
        {cp > 0 ? (
          <div className="rounded-lg bg-white border border-terracotta-200/80 p-3">
            <p className="text-[#a09383] text-xs mb-1 leading-tight">Retiru ({cp}&nbsp;% del PVP)</p>
            <p className="font-semibold text-lg text-terracotta-700 tabular-nums">{formatPrice(platform)}</p>
            <p className="text-[11px] text-terracotta-700/90 mt-1">{(cp / 100).toFixed(1).replace('.', ',')} × PVP — comisión plataforma</p>
          </div>
        ) : (
          <div className="rounded-lg bg-white border border-emerald-200/80 p-3">
            <p className="text-[#a09383] text-xs mb-1 leading-tight">Retiru (0&nbsp;%)</p>
            <p className="font-semibold text-lg text-emerald-700 tabular-nums">{formatPrice(0)}</p>
            <p className="text-[11px] text-emerald-700/90 mt-1">Sin comisión — primer retiro gratis</p>
          </div>
        )}
      </div>
    </div>
  );
}
