'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ban, CalendarDays, Trash2 } from 'lucide-react';

interface Retreat {
  id: string;
  slug: string;
  title_es: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number;
  min_attendees: number;
  confirmed_bookings: number;
  reserved_bookings: number;
  total_price: number;
  cover: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: 'Publicado', color: 'bg-sage-100 text-sage-700' },
  in_progress: { label: 'En curso', color: 'bg-emerald-100 text-emerald-700' },
  expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-600' },
  finished: { label: 'Finalizado', color: 'bg-slate-100 text-slate-600' },
  draft: { label: 'Borrador', color: 'bg-sand-200 text-[#7a6b5d]' },
  pending_review: { label: 'En revisión', color: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
  archived: { label: 'Archivado', color: 'bg-blue-50 text-blue-600' },
};

function deriveDisplayStatus(r: Retreat): string {
  if (r.status !== 'published') return r.status;
  const today = new Date().toISOString().slice(0, 10);
  const started = (r.start_date ?? '') <= today;
  const ended = (r.end_date ?? '') < today;
  if (ended) return r.confirmed_bookings > 0 ? 'finished' : 'expired';
  if (started) return r.confirmed_bookings > 0 ? 'in_progress' : 'expired';
  return 'published';
}

export function PanelEventosClient({ retreats: initial, baseHref }: { retreats: Retreat[]; baseHref: string }) {
  const [retreats, setRetreats] = useState(initial);
  const [acting, setActing] = useState<string | null>(null);

  async function handleCancel(id: string, title: string) {
    if (!confirm(`¿Cancelar el evento "${title}"? Los asistentes serán notificados.`)) return;
    setActing(id);
    try {
      const res = await fetch(`/api/retreats/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRetreats(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      } else {
        alert(data.error || 'Error al cancelar');
      }
    } catch { alert('Error de conexión'); }
    finally { setActing(null); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar definitivamente "${title}"? Esta acción no se puede deshacer.`)) return;
    setActing(id);
    try {
      const res = await fetch(`/api/retreats/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRetreats(prev => prev.filter(r => r.id !== id));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch { alert('Error de conexión'); }
    finally { setActing(null); }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Mis eventos</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{retreats.length} {retreats.length === 1 ? 'evento' : 'eventos'}</p>
        </div>
        <Link
          href={`${baseHref}/nuevo`}
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors shrink-0"
        >
          + Nuevo evento
        </Link>
      </div>

      {retreats.length > 0 ? (
        <div className="space-y-3">
          {retreats.map((r) => {
            const displaySt = deriveDisplayStatus(r);
            const s = STATUS_MAP[displaySt] || STATUS_MAP.draft;
            const totalEnrolled = r.confirmed_bookings + r.reserved_bookings;
            const occupancy = r.max_attendees ? Math.round((totalEnrolled / r.max_attendees) * 100) : 0;
            const confirmedPct = r.max_attendees ? Math.round((r.confirmed_bookings / r.max_attendees) * 100) : 0;
            const minOk = (r.min_attendees ?? 1) <= 1 || totalEnrolled >= (r.min_attendees ?? 1);
            const dateStr = r.start_date
              ? `${new Date(r.start_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}${r.end_date ? ` – ${new Date(r.end_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
              : 'Sin fecha';
            const isDisabled = acting === r.id;
            const canCancel = !['cancelled', 'archived'].includes(r.status);
            const canDelete = r.confirmed_bookings === 0;

            return (
              <div key={r.id} className="flex flex-col md:flex-row gap-4 bg-white border border-sand-200 rounded-2xl p-4 hover:shadow-soft transition-all">
                <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-sand-100">
                  {r.cover ? (
                    <img src={r.cover} alt={r.title_es} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#a09383]">
                      <CalendarDays className="w-10 h-10" strokeWidth={1.25} aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-base leading-tight">{r.title_es}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-[#7a6b5d] mb-2">{dateStr} · {r.total_price}€/persona</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[200px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#a09383]">Ocupación</span>
                        <span className="font-semibold">
                          {r.confirmed_bookings} conf.{r.reserved_bookings > 0 && <> + {r.reserved_bookings} res.</>}/{r.max_attendees || 0}
                          {(r.min_attendees ?? 1) > 1 && (
                            <span className="font-normal text-[#a09383]"> · mín. {r.min_attendees}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-sage-500 rounded-full transition-all" style={{ width: `${confirmedPct}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-terracotta-400/40 rounded-full transition-all" style={{ width: `${occupancy}%` }} />
                      </div>
                      {(r.min_attendees ?? 1) > 1 && (
                        <p className={`text-[11px] mt-1 ${minOk ? 'text-sage-700' : 'text-amber-700'}`}>
                          {minOk ? 'Mínimo viable alcanzado' : `Faltan ${(r.min_attendees ?? 1) - totalEnrolled} para el mínimo`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`${baseHref}/${r.id}`} className="text-xs font-medium text-terracotta-600 hover:underline">
                        Editar
                      </Link>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(r.id, r.title_es)}
                          disabled={isDisabled}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancelar evento"
                        >
                          <Ban size={13} />
                          Cancelar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(r.id, r.title_es)}
                          disabled={isDisabled}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar evento"
                        >
                          <Trash2 size={13} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="font-serif text-xl mb-2">Aún no has creado ningún evento</h3>
          <p className="text-sm text-[#7a6b5d] mb-6 max-w-md mx-auto">
            Crea retiros o eventos de yoga, meditación o ayurveda. Publica tu primer evento y empieza a recibir reservas.
          </p>
          <Link href={`${baseHref}/nuevo`} className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
            Crear mi primer evento
          </Link>
        </div>
      )}
    </div>
  );
}
