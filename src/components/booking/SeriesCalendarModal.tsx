'use client';

// Calendario de inscripción en eventos periódicos: multiselección de fechas
// futuras de la serie (p. ej. «cada lunes y miércoles»). Usado desde la ficha
// (ReserveButton) y desde Mis reservas (ampliar inscripción).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SeriesDate {
  id: string;
  slug: string;
  start_date: string;
  spots_left: number;
  booked_by_me: boolean;
  total_price: number;
  currency: string;
}

interface SeriesCalendarModalProps {
  seriesId: string;
  locale?: 'es' | 'en';
  open: boolean;
  onClose: () => void;
  /** Tras inscribirse con éxito (nº de fechas reservadas) */
  onSuccess?: (datesBooked: number) => void;
}

function monthKey(iso: string) {
  return iso.slice(0, 7); // YYYY-MM
}

export default function SeriesCalendarModal({
  seriesId,
  locale = 'es',
  open,
  onClose,
  onSuccess,
}: SeriesCalendarModalProps) {
  const es = locale === 'es';
  const [dates, setDates] = useState<SeriesDate[] | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [monthIdx, setMonthIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(0);
  const router = useRouter();

  const loadDates = useCallback(async () => {
    setFetchError('');
    setDates(null);
    try {
      const res = await fetch(`/api/retreats/series/${seriesId}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || (es ? 'No se pudieron cargar las fechas' : 'Could not load dates'));
        return;
      }
      setDates(data.dates || []);
    } catch {
      setFetchError(es ? 'No se pudieron cargar las fechas' : 'Could not load dates');
    }
  }, [seriesId, es]);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setMonthIdx(0);
      setDone(0);
      loadDates();
    }
  }, [open, loadDates]);

  const byDate = useMemo(() => {
    const m = new Map<string, SeriesDate>();
    for (const d of dates || []) m.set(d.start_date, d);
    return m;
  }, [dates]);

  const months = useMemo(() => {
    const keys = [...new Set((dates || []).map((d) => monthKey(d.start_date)))];
    keys.sort();
    return keys;
  }, [dates]);

  const selectableIds = useMemo(
    () => (dates || []).filter((d) => !d.booked_by_me && d.spots_left > 0).map((d) => d.id),
    [dates],
  );

  if (!open) return null;

  const monthFmt = new Intl.DateTimeFormat(es ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric' });
  const weekdays = es ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(selectableIds));
  }

  async function submit() {
    if (selected.size === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId, retreatIds: [...selected], locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || (es ? 'Error al crear las reservas' : 'Error creating bookings'));
        return;
      }
      const n = data.datesBooked || selected.size;
      setDone(n);
      onSuccess?.(n);
      router.refresh();
    } catch {
      alert(es ? 'Error inesperado. Inténtalo de nuevo.' : 'Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderMonth(key: string) {
    const [y, m] = key.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // lunes primero
    const cells: (number | null)[] = [
      ...Array<null>(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((w, i) => (
            <div key={`${w}-${i}`} className="text-center text-[10px] font-semibold text-[#a09383] uppercase">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const iso = `${key}-${String(day).padStart(2, '0')}`;
            const d = byDate.get(iso);
            if (!d) {
              return (
                <div key={iso} className="h-9 flex items-center justify-center text-xs text-[#c9beb0]">
                  {day}
                </div>
              );
            }
            if (d.booked_by_me) {
              return (
                <div
                  key={iso}
                  title={es ? 'Ya tienes plaza reservada' : 'You already have a spot'}
                  className="h-9 rounded-lg bg-sage-100 border border-sage-200 flex items-center justify-center text-xs font-semibold text-sage-700"
                >
                  {day}✓
                </div>
              );
            }
            if (d.spots_left <= 0) {
              return (
                <div
                  key={iso}
                  title={es ? 'Completo' : 'Full'}
                  className="h-9 rounded-lg bg-sand-100 flex items-center justify-center text-xs text-[#c9beb0] line-through"
                >
                  {day}
                </div>
              );
            }
            const isSel = selected.has(d.id);
            return (
              <button
                key={iso}
                onClick={() => toggle(d.id)}
                disabled={submitting}
                className={`h-9 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                  isSel
                    ? 'bg-terracotta-600 border-terracotta-600 text-white'
                    : 'bg-white border-sand-200 text-foreground hover:border-terracotta-400'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {done > 0 ? (
          <div className="text-center py-4">
            <p className="text-sage-700 font-semibold text-sm mb-4">
              {es
                ? `Inscripción realizada en ${done} fecha${done === 1 ? '' : 's'}. Revisa el detalle en «Mis reservas» y en tu email.`
                : `Enrolled on ${done} date${done === 1 ? '' : 's'}. Check the details in “My bookings” and your email.`}
            </p>
            <button onClick={onClose} className="btn-primary px-6 py-2.5 text-sm">
              {es ? 'Cerrar' : 'Close'}
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
              {es ? 'Elige tus fechas' : 'Pick your dates'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {es
                ? 'Marca los días en los que quieres plaza (p. ej. cada lunes). Las fechas con ✓ ya son tuyas. Puedes inscribirte con hasta 7 semanas de antelación.'
                : 'Select the days you want a spot on (e.g. every Monday). Dates with ✓ are already yours. You can enroll up to 7 weeks ahead.'}
            </p>

            {fetchError && <p className="text-sm text-red-600 mb-3">{fetchError}</p>}
            {!dates && !fetchError && (
              <p className="text-sm text-muted-foreground py-6 text-center">{es ? 'Cargando fechas…' : 'Loading dates…'}</p>
            )}

            {dates && months.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setMonthIdx((v) => Math.max(0, v - 1))}
                    disabled={monthIdx === 0 || submitting}
                    className="px-2 py-1 text-sm rounded-lg hover:bg-sand-50 disabled:opacity-30"
                    aria-label={es ? 'Mes anterior' : 'Previous month'}
                  >
                    ←
                  </button>
                  <span className="text-sm font-semibold capitalize">
                    {monthFmt.format(new Date(`${months[monthIdx]}-01T00:00:00`))}
                  </span>
                  <button
                    onClick={() => setMonthIdx((v) => Math.min(months.length - 1, v + 1))}
                    disabled={monthIdx >= months.length - 1 || submitting}
                    className="px-2 py-1 text-sm rounded-lg hover:bg-sand-50 disabled:opacity-30"
                    aria-label={es ? 'Mes siguiente' : 'Next month'}
                  >
                    →
                  </button>
                </div>

                {renderMonth(months[monthIdx])}

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={selected.size === selectableIds.length ? () => setSelected(new Set()) : selectAll}
                    disabled={submitting || selectableIds.length === 0}
                    className="text-xs font-medium text-terracotta-600 hover:underline disabled:opacity-40"
                  >
                    {selected.size === selectableIds.length && selectableIds.length > 0
                      ? (es ? 'Quitar selección' : 'Clear selection')
                      : (es ? `Seleccionar todas (${selectableIds.length})` : `Select all (${selectableIds.length})`)}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {es ? `${selected.size} seleccionadas` : `${selected.size} selected`}
                  </span>
                </div>

                <button
                  onClick={submit}
                  disabled={selected.size === 0 || submitting}
                  className="btn-primary w-full py-3 mt-3 text-sm disabled:opacity-50"
                >
                  {submitting
                    ? (es ? 'Procesando…' : 'Processing…')
                    : (es
                        ? `Reservar ${selected.size || ''} fecha${selected.size === 1 ? '' : 's'}`.trim()
                        : `Book ${selected.size || ''} date${selected.size === 1 ? '' : 's'}`.trim())}
                </button>

                {dates.length === selectableIds.length ? null : (
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    {es
                      ? 'Cada fecha queda como reserva independiente: puedes cancelar días sueltos desde su detalle.'
                      : 'Each date becomes its own booking: you can cancel individual days from its detail page.'}
                  </p>
                )}
              </>
            )}

            {dates && months.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {es ? 'No hay fechas próximas disponibles.' : 'No upcoming dates available.'}
              </p>
            )}

            <button
              onClick={onClose}
              disabled={submitting}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              {es ? 'Cancelar' : 'Cancel'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Botón autocontenido para Mis reservas: abre el calendario de la serie. */
export function SeriesCalendarTrigger({
  seriesId,
  locale = 'es',
  label,
  className = '',
}: {
  seriesId: string;
  locale?: 'es' | 'en';
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const es = locale === 'es';
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'text-xs font-semibold px-3 py-1.5 rounded-lg border border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50 transition-colors'}
      >
        {label || (es ? 'Ampliar inscripción' : 'Add more dates')}
      </button>
      <SeriesCalendarModal
        seriesId={seriesId}
        locale={locale}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
