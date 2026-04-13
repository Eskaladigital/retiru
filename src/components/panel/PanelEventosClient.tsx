'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ban, CalendarDays, Trash2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';

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

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    published: 'Publicado',
    in_progress: 'En curso',
    expired: 'Expirado',
    finished: 'Finalizado',
    draft: 'Borrador',
    pending_review: 'En revisión',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    archived: 'Archivado',
  },
  en: {
    published: 'Published',
    in_progress: 'In progress',
    expired: 'Expired',
    finished: 'Finished',
    draft: 'Draft',
    pending_review: 'In review',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    archived: 'Archived',
  },
};

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-sage-100 text-sage-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-orange-100 text-orange-600',
  finished: 'bg-slate-100 text-slate-600',
  draft: 'bg-sand-200 text-[#7a6b5d]',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  archived: 'bg-blue-50 text-blue-600',
};

function statusBadge(displaySt: string, locale: Locale) {
  const label = STATUS_LABELS[locale][displaySt] ?? STATUS_LABELS.es[displaySt] ?? displaySt;
  const color = STATUS_COLOR[displaySt] ?? STATUS_COLOR.draft;
  return { label, color };
}

function deriveDisplayStatus(r: Retreat): string {
  if (r.status !== 'published') return r.status;
  const today = new Date().toISOString().slice(0, 10);
  const started = (r.start_date ?? '') <= today;
  const ended = (r.end_date ?? '') < today;
  if (ended) return r.confirmed_bookings > 0 ? 'finished' : 'expired';
  if (started) return r.confirmed_bookings > 0 ? 'in_progress' : 'expired';
  return 'published';
}

const UI: Record<Locale, {
  cancelConfirm: (title: string) => string;
  deleteConfirm: (title: string) => string;
  errCancel: string; errDelete: string; errConn: string;
  heading: string; countOne: string; countMany: string; newBtn: string;
  noDate: string; perPerson: string; occupancy: string; confShort: string; resShort: string; minShort: string;
  minOk: string; minNeed: (n: number) => string; edit: string; cancel: string; delete: string; cancelTitle: string; deleteTitle: string;
  emptyTitle: string; emptyBody: string; emptyCta: string;
}> = {
  es: {
    cancelConfirm: (title) => `¿Cancelar el evento "${title}"? Los asistentes serán notificados.`,
    deleteConfirm: (title) => `¿Eliminar definitivamente "${title}"? Esta acción no se puede deshacer.`,
    errCancel: 'Error al cancelar',
    errDelete: 'Error al eliminar',
    errConn: 'Error de conexión',
    heading: 'Mis eventos',
    countOne: 'evento',
    countMany: 'eventos',
    newBtn: '+ Nuevo evento',
    noDate: 'Sin fecha',
    perPerson: '€/persona',
    occupancy: 'Ocupación',
    confShort: 'conf.',
    resShort: 'res.',
    minShort: 'mín.',
    minOk: 'Mínimo viable alcanzado',
    minNeed: (n) => `Faltan ${n} para el mínimo`,
    edit: 'Editar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    cancelTitle: 'Cancelar evento',
    deleteTitle: 'Eliminar evento',
    emptyTitle: 'Aún no has creado ningún evento',
    emptyBody: 'Crea retiros o eventos de yoga, meditación o ayurveda. Publica tu primer evento y empieza a recibir reservas.',
    emptyCta: 'Crear mi primer evento',
  },
  en: {
    cancelConfirm: (title) => `Cancel the event "${title}"? Attendees will be notified.`,
    deleteConfirm: (title) => `Permanently delete "${title}"? This cannot be undone.`,
    errCancel: 'Could not cancel',
    errDelete: 'Could not delete',
    errConn: 'Connection error',
    heading: 'My retreats',
    countOne: 'event',
    countMany: 'events',
    newBtn: '+ New event',
    noDate: 'No date',
    perPerson: '€/person',
    occupancy: 'Occupancy',
    confShort: 'conf.',
    resShort: 'res.',
    minShort: 'min.',
    minOk: 'Minimum reached',
    minNeed: (n) => `${n} more needed for minimum`,
    edit: 'Edit',
    cancel: 'Cancel',
    delete: 'Delete',
    cancelTitle: 'Cancel event',
    deleteTitle: 'Delete event',
    emptyTitle: 'You have not created any events yet',
    emptyBody: 'Create yoga, meditation or ayurveda retreats. Publish your first event and start receiving bookings.',
    emptyCta: 'Create my first event',
  },
};

export function PanelEventosClient({ retreats: initial, baseHref, locale = 'es' }: { retreats: Retreat[]; baseHref: string; locale?: Locale }) {
  const [retreats, setRetreats] = useState(initial);
  const [acting, setActing] = useState<string | null>(null);
  const t = UI[locale];
  const dateLoc = locale === 'en' ? 'en' : 'es';

  async function handleCancel(id: string, title: string) {
    if (!confirm(t.cancelConfirm(title))) return;
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
        alert(data.error || t.errCancel);
      }
    } catch { alert(t.errConn); }
    finally { setActing(null); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(t.deleteConfirm(title))) return;
    setActing(id);
    try {
      const res = await fetch(`/api/retreats/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRetreats(prev => prev.filter(r => r.id !== id));
      } else {
        alert(data.error || t.errDelete);
      }
    } catch { alert(t.errConn); }
    finally { setActing(null); }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">{t.heading}</h1>
          <p className="text-sm text-[#7a6b5d] mt-1">{retreats.length} {retreats.length === 1 ? t.countOne : t.countMany}</p>
        </div>
        <Link
          href={`${baseHref}/nuevo`}
          className="inline-flex items-center gap-2 bg-terracotta-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-terracotta-700 transition-colors shrink-0"
        >
          {t.newBtn}
        </Link>
      </div>

      {retreats.length > 0 ? (
        <div className="space-y-3">
          {retreats.map((r) => {
            const displaySt = deriveDisplayStatus(r);
            const s = statusBadge(displaySt, locale);
            const totalEnrolled = r.confirmed_bookings + r.reserved_bookings;
            const occupancy = r.max_attendees ? Math.round((totalEnrolled / r.max_attendees) * 100) : 0;
            const confirmedPct = r.max_attendees ? Math.round((r.confirmed_bookings / r.max_attendees) * 100) : 0;
            const minOk = (r.min_attendees ?? 1) <= 1 || totalEnrolled >= (r.min_attendees ?? 1);
            const dateStr = r.start_date
              ? `${new Date(r.start_date).toLocaleDateString(dateLoc, { day: 'numeric', month: 'short' })}${r.end_date ? ` – ${new Date(r.end_date).toLocaleDateString(dateLoc, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
              : t.noDate;
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
                  <p className="text-sm text-[#7a6b5d] mb-2">{dateStr} · {r.total_price}{t.perPerson}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[200px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#a09383]">{t.occupancy}</span>
                        <span className="font-semibold">
                          {r.confirmed_bookings} {t.confShort}{r.reserved_bookings > 0 && <> + {r.reserved_bookings} {t.resShort}</>}/{r.max_attendees || 0}
                          {(r.min_attendees ?? 1) > 1 && (
                            <span className="font-normal text-[#a09383]"> · {t.minShort} {r.min_attendees}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-sage-500 rounded-full transition-all" style={{ width: `${confirmedPct}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-terracotta-400/40 rounded-full transition-all" style={{ width: `${occupancy}%` }} />
                      </div>
                      {(r.min_attendees ?? 1) > 1 && (
                        <p className={`text-[11px] mt-1 ${minOk ? 'text-sage-700' : 'text-amber-700'}`}>
                          {minOk ? t.minOk : t.minNeed((r.min_attendees ?? 1) - totalEnrolled)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`${baseHref}/${r.id}`} className="text-xs font-medium text-terracotta-600 hover:underline">
                        {t.edit}
                      </Link>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(r.id, r.title_es)}
                          disabled={isDisabled}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title={t.cancelTitle}
                        >
                          <Ban size={13} />
                          {t.cancel}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(r.id, r.title_es)}
                          disabled={isDisabled}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title={t.deleteTitle}
                        >
                          <Trash2 size={13} />
                          {t.delete}
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
          <h3 className="font-serif text-xl mb-2">{t.emptyTitle}</h3>
          <p className="text-sm text-[#7a6b5d] mb-6 max-w-md mx-auto">
            {t.emptyBody}
          </p>
          <Link href={`${baseHref}/nuevo`} className="inline-flex bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-700 transition-colors text-sm">
            {t.emptyCta}
          </Link>
        </div>
      )}
    </div>
  );
}
