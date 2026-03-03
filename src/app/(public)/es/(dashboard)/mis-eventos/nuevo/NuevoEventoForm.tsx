'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Option { id: string; name: string; slug: string }

interface Props {
  categories: Option[];
  destinations: Option[];
}

const STEPS = ['Información', 'Detalles', 'Incluye', 'Precio'];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';
const textareaCls = `${inputCls} resize-none`;

export function NuevoEventoForm({ categories, destinations }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title_es: '',
    title_en: '',
    summary_es: '',
    summary_en: '',
    description_es: '',
    description_en: '',
    start_date: '',
    end_date: '',
    total_price: '',
    max_attendees: '',
    destination_id: '',
    address: '',
    confirmation_type: 'automatic',
    languages: ['es'],
    categories: [] as string[],
    includes_es: [''],
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

  function canNext() {
    if (step === 0) return form.title_es && form.summary_es && form.description_es;
    if (step === 1) return form.start_date && form.end_date;
    return true;
  }

  async function handleSubmit() {
    if (!form.title_es || !form.summary_es || !form.description_es || !form.start_date || !form.end_date || !form.total_price || !form.max_attendees) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/retreats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          includes_es: form.includes_es.filter(Boolean),
          destination_id: form.destination_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear el evento');
        return;
      }

      router.push('/es/mis-eventos');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i <= step && setStep(i)}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors ${
              i === step ? 'bg-terracotta-600 text-white'
              : i < step ? 'bg-terracotta-100 text-terracotta-700 cursor-pointer'
              : 'bg-sand-200 text-[#a09383]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-6">
        {/* Step 0: Informacion */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Título del evento (ES) *</label>
              <input type="text" value={form.title_es} onChange={(e) => set('title_es', e.target.value)} placeholder="Ej: Retiro de Yoga y Meditación frente al mar" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Título (EN) <span className="text-[#a09383] font-normal">opcional</span></label>
              <input type="text" value={form.title_en} onChange={(e) => set('title_en', e.target.value)} placeholder="Ej: Yoga and Meditation Retreat by the sea" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Resumen corto (ES) *</label>
              <textarea rows={2} value={form.summary_es} onChange={(e) => set('summary_es', e.target.value)} placeholder="Descripción breve para las tarjetas de búsqueda..." className={textareaCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Descripción completa (ES) *</label>
              <textarea rows={6} value={form.description_es} onChange={(e) => set('description_es', e.target.value)} placeholder="Describe tu evento en detalle: qué ofreces, a quién va dirigido, qué lo hace especial..." className={textareaCls} />
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
          </>
        )}

        {/* Step 1: Detalles */}
        {step === 1 && (
          <>
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
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Dirección</label>
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Ej: Finca Can Lluc, Sant Llorenç de Balàfia" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmación de reserva</label>
              <div className="flex gap-4">
                {[
                  { v: 'automatic', l: 'Automática' },
                  { v: 'manual', l: 'Manual (revisar cada solicitud)' },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="confirmation" value={o.v} checked={form.confirmation_type === o.v} onChange={() => set('confirmation_type', o.v)} className="text-terracotta-600" />
                    {o.l}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Incluye */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">¿Qué incluye tu evento?</label>
              <p className="text-xs text-[#a09383] mb-3">Añade los servicios incluidos (alojamiento, comidas, materiales, etc.)</p>
              <div className="space-y-2">
                {form.includes_es.map((inc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={inc}
                      onChange={(e) => updateInclude(i, e.target.value)}
                      placeholder={`Ej: ${['Alojamiento 3 noches', 'Pensión completa', 'Material de yoga', 'Transfer aeropuerto'][i] || 'Servicio incluido'}`}
                      className={inputCls}
                    />
                    {form.includes_es.length > 1 && (
                      <button type="button" onClick={() => removeInclude(i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors self-center">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addInclude} className="mt-3 text-sm font-medium text-terracotta-600 hover:underline">
                + Añadir otro
              </button>
            </div>
          </>
        )}

        {/* Step 3: Precio */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Precio por persona (€) *</label>
                <input type="number" min="50" value={form.total_price} onChange={(e) => set('total_price', e.target.value)} placeholder="790" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Plazas máximas *</label>
                <input type="number" min="1" value={form.max_attendees} onChange={(e) => set('max_attendees', e.target.value)} placeholder="16" className={inputCls} />
              </div>
            </div>
            {form.total_price && (
              <div className="bg-sand-50 border border-sand-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2">Desglose de precios</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#a09383]">Precio total</p>
                    <p className="font-bold text-lg">{Number(form.total_price).toFixed(0)}€</p>
                  </div>
                  <div>
                    <p className="text-[#a09383]">Comisión Retiru (20%)</p>
                    <p className="font-semibold">{(Number(form.total_price) * 0.2).toFixed(0)}€</p>
                  </div>
                  <div>
                    <p className="text-[#a09383]">Tu ingreso (80%)</p>
                    <p className="font-semibold text-sage-700">{(Number(form.total_price) * 0.8).toFixed(0)}€</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-8">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors">
            Anterior
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" /></svg>
                Creando...
              </>
            ) : (
              'Crear evento (borrador)'
            )}
          </button>
        )}
      </div>
    </>
  );
}
