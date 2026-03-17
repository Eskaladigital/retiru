'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Option { id: string; name: string; slug: string }

interface Props {
  retreat: any;
  categories: Option[];
  destinations: Option[];
  /** Si se pasa, usa este endpoint en lugar de /api/retreats/[id] (ej. admin) */
  apiPath?: string;
  /** Ocultar acciones de cancelar/eliminar (ej. en admin) */
  hideActions?: boolean;
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';
const textareaCls = `${inputCls} resize-none`;

export function EditarEventoForm({ retreat, categories, destinations, apiPath, hideActions }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acting, setActing] = useState(false);

  async function handleCancel() {
    if (!confirm(`¿Cancelar el evento "${retreat.title_es}"? Los asistentes serán notificados.`)) return;
    setActing(true);
    setError('');
    try {
      const res = await fetch(apiPath || `/api/retreats/${retreat.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess('Evento cancelado.');
        router.refresh();
      } else {
        setError(data.error || 'Error al cancelar');
      }
    } catch { setError('Error de conexión'); }
    finally { setActing(false); }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar definitivamente "${retreat.title_es}"? Esta acción no se puede deshacer.`)) return;
    setActing(true);
    setError('');
    try {
      const res = await fetch(apiPath || `/api/retreats/${retreat.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push('/es/mis-eventos');
      } else {
        setError(data.error || 'Error al eliminar');
      }
    } catch { setError('Error de conexión'); }
    finally { setActing(false); }
  }

  const existingCats = (retreat.retreat_categories || []).map((c: any) => c.category_id);

  const [form, setForm] = useState({
    title_es: retreat.title_es || '',
    title_en: retreat.title_en || '',
    summary_es: retreat.summary_es || '',
    summary_en: retreat.summary_en || '',
    description_es: retreat.description_es || '',
    description_en: retreat.description_en || '',
    start_date: retreat.start_date || '',
    end_date: retreat.end_date || '',
    total_price: retreat.total_price?.toString() || '',
    max_attendees: retreat.max_attendees?.toString() || '',
    destination_id: retreat.destination_id || '',
    address: retreat.address || '',
    confirmation_type: retreat.confirmation_type || 'automatic',
    languages: retreat.languages || ['es'],
    categories: existingCats as string[],
    includes_es: (retreat.includes_es?.length ? retreat.includes_es : ['']) as string[],
  });

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCat(catId: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(catId)
        ? f.categories.filter((c) => c !== catId)
        : [...f.categories, catId],
    }));
  }

  function addInclude() {
    setForm((f) => ({ ...f, includes_es: [...f.includes_es, ''] }));
  }

  function updateInclude(i: number, val: string) {
    setForm((f) => {
      const arr = [...f.includes_es];
      arr[i] = val;
      return { ...f, includes_es: arr };
    });
  }

  function removeInclude(i: number) {
    setForm((f) => ({ ...f, includes_es: f.includes_es.filter((_, idx) => idx !== i) }));
  }

  async function handleSave(publish: boolean = false) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(apiPath || `/api/retreats/${retreat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          includes_es: form.includes_es.filter(Boolean),
          destination_id: form.destination_id || null,
          status: publish ? 'published' : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      if (publish) {
        setSuccess(data.status === 'published'
          ? 'Evento publicado directamente.'
          : 'Evento enviado a revisión. El equipo de Retiru lo revisará pronto.');
      } else {
        setSuccess('Cambios guardados.');
      }
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Título (ES) *</label>
        <input type="text" value={form.title_es} onChange={(e) => set('title_es', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Título (EN)</label>
        <input type="text" value={form.title_en} onChange={(e) => set('title_en', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Resumen (ES) *</label>
        <textarea rows={2} value={form.summary_es} onChange={(e) => set('summary_es', e.target.value)} className={textareaCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Descripción (ES) *</label>
        <textarea rows={6} value={form.description_es} onChange={(e) => set('description_es', e.target.value)} className={textareaCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Fecha inicio *</label>
          <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Fecha fin *</label>
          <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Destino</label>
        <select value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)} className={inputCls}>
          <option value="">Selecciona un destino</option>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Dirección</label>
        <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Precio (€) *</label>
          <input type="number" min="50" value={form.total_price} onChange={(e) => set('total_price', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Plazas máximas *</label>
          <input type="number" min="1" value={form.max_attendees} onChange={(e) => set('max_attendees', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Categorías</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                form.categories.includes(c.id)
                  ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                  : 'border-sand-300 hover:border-terracotta-300 hover:bg-terracotta-50/50'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={form.categories.includes(c.id)} onChange={() => toggleCat(c.id)} />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">¿Qué incluye?</label>
        <div className="space-y-2">
          {form.includes_es.map((inc, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={inc} onChange={(e) => updateInclude(i, e.target.value)} placeholder="Servicio incluido" className={inputCls} />
              {form.includes_es.length > 1 && (
                <button type="button" onClick={() => removeInclude(i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 transition-colors self-center">×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addInclude} className="mt-2 text-sm font-medium text-terracotta-600 hover:underline">+ Añadir otro</button>
      </div>

      {/* Status banner */}
      {retreat.status === 'pending_review' && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Este evento está <strong>pendiente de revisión</strong> por el equipo de Retiru. Te notificaremos cuando sea aprobado.
        </div>
      )}
      {retreat.status === 'rejected' && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          Este evento fue <strong>rechazado</strong>.
          {retreat.rejection_reason && <> Motivo: <em>{retreat.rejection_reason}</em></>}
          {' '}Puedes corregirlo y volver a enviarlo a revisión.
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-sand-200">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving || acting}
          className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors disabled:opacity-50"
        >
          Guardar cambios
        </button>
        {(retreat.status === 'draft' || retreat.status === 'rejected') && (
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || acting}
            className="bg-terracotta-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-terracotta-700 transition-colors disabled:opacity-50"
          >
            {apiPath ? 'Publicar' : 'Enviar a revisión'}
          </button>
        )}
        {!hideActions && (
          <div className="flex gap-2 ml-auto">
            {!['cancelled', 'archived'].includes(retreat.status) && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || acting}
                className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                Cancelar evento
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || acting}
              className="inline-flex items-center gap-1.5 border border-red-300 text-red-700 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
