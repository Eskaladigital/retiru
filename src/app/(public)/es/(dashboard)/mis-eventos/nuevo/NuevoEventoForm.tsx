'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, GripVertical, Plus, Trash2 } from 'lucide-react';

interface Option { id: string; name: string; slug: string }

interface Props {
  categories: Option[];
  destinations: Option[];
}

interface ScheduleItem { time: string; activity: string }
interface ScheduleDay { day: number; title: string; items: ScheduleItem[] }

const STEPS = ['Información', 'Detalles', 'Programa', 'Incluye', 'Precio'];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';
const textareaCls = `${inputCls} resize-none`;

const CANCELLATION_PRESETS = {
  flexible: {
    label: 'Flexible',
    desc: '100% si cancela >14 días, 50% si >7 días, 0% si <3 días',
    tiers: [{ days_before: 14, refund_percent: 100 }, { days_before: 7, refund_percent: 50 }, { days_before: 3, refund_percent: 0 }],
  },
  standard: {
    label: 'Estándar',
    desc: '100% si cancela >30 días, 50% si >14 días, 0% si <7 días',
    tiers: [{ days_before: 30, refund_percent: 100 }, { days_before: 14, refund_percent: 50 }, { days_before: 7, refund_percent: 0 }],
  },
  strict: {
    label: 'Estricta',
    desc: '50% si cancela >30 días, 0% después',
    tiers: [{ days_before: 30, refund_percent: 50 }, { days_before: 0, refund_percent: 0 }],
  },
};

export function NuevoEventoForm({ categories, destinations }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    excludes_es: [''],
    cancellation_type: 'standard' as 'flexible' | 'standard' | 'strict',
  });

  const [images, setImages] = useState<{ file?: File; url: string; preview: string; is_cover: boolean }[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);

  /** Tras crear borrador: modal explicativo antes de ir al listado o editar */
  const [postCreate, setPostCreate] = useState<{
    retreatId: string;
    isVerifiedOrganizer: boolean;
  } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  function set(field: string, value: unknown) {
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

  // --- Includes/Excludes helpers ---
  function addItem(field: 'includes_es' | 'excludes_es') {
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }));
  }
  function updateItem(field: 'includes_es' | 'excludes_es', i: number, val: string) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[i] = val;
      return { ...f, [field]: arr };
    });
  }
  function removeItem(field: 'includes_es' | 'excludes_es', i: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));
  }

  // --- Images ---
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).slice(0, 8 - images.length).map((file) => ({
      file,
      url: '',
      preview: URL.createObjectURL(file),
      is_cover: images.length === 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some((img) => img.is_cover)) {
        updated[0].is_cover = true;
      }
      return updated;
    });
  }

  function setCover(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_cover: i === idx })));
  }

  // --- Schedule ---
  function generateScheduleDays() {
    if (!form.start_date || !form.end_date) return;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const newSchedule: ScheduleDay[] = [];
    for (let d = 1; d <= days; d++) {
      const existing = schedule.find((s) => s.day === d);
      newSchedule.push(existing || { day: d, title: '', items: [{ time: '09:00', activity: '' }] });
    }
    setSchedule(newSchedule);
  }

  function updateScheduleTitle(dayIdx: number, title: string) {
    setSchedule((s) => s.map((d, i) => i === dayIdx ? { ...d, title } : d));
  }

  function addScheduleItem(dayIdx: number) {
    setSchedule((s) => s.map((d, i) => i === dayIdx ? { ...d, items: [...d.items, { time: '', activity: '' }] } : d));
  }

  function updateScheduleItem(dayIdx: number, itemIdx: number, field: 'time' | 'activity', val: string) {
    setSchedule((s) => s.map((d, i) => i === dayIdx ? {
      ...d,
      items: d.items.map((it, j) => j === itemIdx ? { ...it, [field]: val } : it),
    } : d));
  }

  function removeScheduleItem(dayIdx: number, itemIdx: number) {
    setSchedule((s) => s.map((d, i) => i === dayIdx ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) } : d));
  }

  function canNext() {
    if (step === 0) return form.title_es && form.summary_es && form.description_es;
    if (step === 1) return form.start_date && form.end_date;
    return true;
  }

  async function uploadImages(): Promise<{ url: string; is_cover: boolean }[]> {
    const supabase = createClient();
    const uploaded: { url: string; is_cover: boolean }[] = [];

    for (const img of images) {
      if (img.url) {
        uploaded.push({ url: img.url, is_cover: img.is_cover });
        continue;
      }
      if (!img.file) continue;

      const ext = img.file.name.split('.').pop();
      const path = `retreats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('retreat-images').upload(path, img.file, {
        cacheControl: '31536000',
        upsert: false,
      });

      if (error) {
        const msg = error.message || 'Error desconocido';
        if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('Unauthorized')) {
          throw new Error(
            'No se pudo subir la imagen: falta el bucket «retreat-images» o sus políticas en Supabase. Aplica la migración 016_retreat_images_bucket.sql en el proyecto.',
          );
        }
        if (msg.includes('Bucket not found') || msg.includes('not found')) {
          throw new Error(
            'El bucket de imágenes no existe en este proyecto. Crea en Supabase Storage el bucket público «retreat-images» o aplica las migraciones.',
          );
        }
        throw new Error(`Error al subir una imagen: ${msg}`);
      }

      const { data: urlData } = supabase.storage.from('retreat-images').getPublicUrl(path);
      uploaded.push({ url: urlData.publicUrl, is_cover: img.is_cover });
    }

    if (images.length > 0 && uploaded.length !== images.length) {
      throw new Error('No se pudieron subir todas las imágenes. Quita las que fallen y vuelve a intentarlo.');
    }

    return uploaded;
  }

  async function handleSubmit() {
    if (!form.title_es || !form.summary_es || !form.description_es || !form.start_date || !form.end_date || !form.total_price || !form.max_attendees) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      setUploading(true);
      const uploadedImages = await uploadImages();
      setUploading(false);

      const preset = CANCELLATION_PRESETS[form.cancellation_type];
      const cancellationPolicy = {
        type: form.cancellation_type,
        refund_tiers: preset.tiers,
        platform_fee_refundable: false,
      };

      const scheduleData = schedule
        .filter((d) => d.items.some((it) => it.activity))
        .map((d) => ({
          day: d.day,
          title_es: d.title,
          items: d.items.filter((it) => it.activity).map((it) => ({
            time: it.time,
            title_es: it.activity,
          })),
        }));

      const res = await fetch('/api/retreats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          includes_es: form.includes_es.filter(Boolean),
          excludes_es: form.excludes_es.filter(Boolean),
          destination_id: form.destination_id || null,
          images: uploadedImages,
          schedule: scheduleData,
          cancellation_policy: cancellationPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear el evento');
        return;
      }

      const id = data.retreat?.id as string | undefined;
      if (!id) {
        setError('Evento creado pero sin identificador. Revisa en «Mis eventos».');
        router.push('/es/mis-eventos');
        return;
      }

      setPostCreate({
        retreatId: id,
        isVerifiedOrganizer: Boolean(data.isVerifiedOrganizer),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleSendFromModal() {
    if (!postCreate) return;
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/retreats/${postCreate.retreatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReviewError(typeof data.error === 'string' ? data.error : 'No se pudo enviar. Inténtalo de nuevo.');
        return;
      }
      setPostCreate(null);
      router.push('/es/mis-eventos');
      router.refresh();
    } catch {
      setReviewError('Error de conexión');
    } finally {
      setReviewSubmitting(false);
    }
  }

  function handleContinueEditingFromModal() {
    if (!postCreate) return;
    const id = postCreate.retreatId;
    setPostCreate(null);
    router.push(`/es/mis-eventos/${id}`);
  }

  function handleGoToListFromModal() {
    setPostCreate(null);
    router.push('/es/mis-eventos');
  }

  return (
    <>
      {postCreate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="draft-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-sand-200 p-6 sm:p-8">
            <h2 id="draft-modal-title" className="font-serif text-xl sm:text-2xl text-foreground mb-3">
              Evento guardado como borrador
            </h2>
            <p className="text-[15px] text-[#5c5349] leading-relaxed mb-3">
              Acabas de crear este evento en modo borrador: aún no es visible para el público ni puede recibir reservas.
            </p>
            {postCreate.isVerifiedOrganizer ? (
              <p className="text-[15px] text-[#5c5349] leading-relaxed mb-4">
                Como ya tienes eventos publicados, puedes <strong>publicarlo ahora</strong> y quedará en línea al instante. Si prefieres, sigue editándolo antes.
              </p>
            ) : (
              <p className="text-[15px] text-[#5c5349] leading-relaxed mb-4">
                Cuando lo tengas listo, <strong>envíalo a revisión</strong>: el equipo de Retiru lo revisará y lo aprobará antes de publicarlo. Hasta entonces seguirá como borrador.
              </p>
            )}
            {reviewError && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                {reviewError}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleContinueEditingFromModal}
                disabled={reviewSubmitting}
                className="flex-1 bg-white border border-sand-300 text-foreground font-semibold px-4 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors disabled:opacity-50"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={handleSendFromModal}
                disabled={reviewSubmitting}
                className="flex-1 bg-terracotta-600 text-white font-semibold px-4 py-3 rounded-xl text-sm hover:bg-terracotta-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reviewSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                    </svg>
                    Enviando…
                  </>
                ) : postCreate.isVerifiedOrganizer ? (
                  'Publicar ahora'
                ) : (
                  'Enviar a revisión'
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGoToListFromModal}
              disabled={reviewSubmitting}
              className="mt-4 w-full text-center text-sm text-[#7a6b5d] hover:text-foreground underline-offset-2 hover:underline disabled:opacity-50"
            >
              Ir a mis eventos (sigue en borrador)
            </button>
          </div>
        </div>
      )}

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
        {/* ═══ Step 0: Información ═══ */}
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

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Imágenes del evento</label>
              <p className="text-xs text-[#a09383] mb-3">Sube hasta 8 imágenes. La primera será la portada. Formatos: JPG, PNG, WebP.</p>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-sand-200 aspect-[4/3]">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {img.is_cover && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-terracotta-600 text-white px-2 py-0.5 rounded-full">
                          PORTADA
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {!img.is_cover && (
                          <button type="button" onClick={() => setCover(i)} className="bg-white text-foreground text-xs font-semibold px-2.5 py-1 rounded-lg">
                            Portada
                          </button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} className="bg-red-500 text-white p-1.5 rounded-lg">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-sand-300 rounded-xl p-8 flex flex-col items-center gap-2 text-[#a09383] hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Subir imágenes</span>
                  <span className="text-xs">{images.length}/8 imágenes</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
            </div>
          </>
        )}

        {/* ═══ Step 1: Detalles ═══ */}
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

        {/* ═══ Step 2: Programa ═══ */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Programa del evento</label>
              <p className="text-xs text-[#a09383] mb-3">Opcional. Organiza las actividades por día. Se generan los días automáticamente según tus fechas.</p>

              {schedule.length === 0 ? (
                <button
                  type="button"
                  onClick={generateScheduleDays}
                  disabled={!form.start_date || !form.end_date}
                  className="w-full border-2 border-dashed border-sand-300 rounded-xl p-8 flex flex-col items-center gap-2 text-[#a09383] hover:border-terracotta-400 hover:text-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={24} />
                  <span className="text-sm font-medium">Generar programa</span>
                  {(!form.start_date || !form.end_date) && <span className="text-xs">Primero define las fechas en el paso anterior</span>}
                </button>
              ) : (
                <div className="space-y-4">
                  {schedule.map((day, dayIdx) => (
                    <div key={day.day} className="rounded-xl border border-sand-200 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 text-sm font-bold shrink-0">
                          {day.day}
                        </span>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateScheduleTitle(dayIdx, e.target.value)}
                          placeholder={`Título del día ${day.day} (ej: Bienvenida y conexión)`}
                          className={`${inputCls} !py-2`}
                        />
                      </div>

                      <div className="space-y-2 ml-11">
                        {day.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-2 items-center">
                            <input
                              type="time"
                              value={item.time}
                              onChange={(e) => updateScheduleItem(dayIdx, itemIdx, 'time', e.target.value)}
                              className="w-28 px-3 py-2 rounded-lg border border-sand-300 text-sm outline-none focus:border-terracotta-500 transition-all"
                            />
                            <input
                              type="text"
                              value={item.activity}
                              onChange={(e) => updateScheduleItem(dayIdx, itemIdx, 'activity', e.target.value)}
                              placeholder="Actividad (ej: Meditación guiada)"
                              className={`${inputCls} !py-2`}
                            />
                            {day.items.length > 1 && (
                              <button type="button" onClick={() => removeScheduleItem(dayIdx, itemIdx)} className="shrink-0 text-[#a09383] hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addScheduleItem(dayIdx)} className="text-xs font-medium text-terracotta-600 hover:underline ml-[7.5rem]">
                          + Añadir actividad
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ Step 3: Incluye / No incluye ═══ */}
        {step === 3 && (
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
                      onChange={(e) => updateItem('includes_es', i, e.target.value)}
                      placeholder={`Ej: ${['Alojamiento 3 noches', 'Pensión completa', 'Material de yoga', 'Transfer aeropuerto'][i] || 'Servicio incluido'}`}
                      className={inputCls}
                    />
                    {form.includes_es.length > 1 && (
                      <button type="button" onClick={() => removeItem('includes_es', i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors self-center">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addItem('includes_es')} className="mt-3 text-sm font-medium text-terracotta-600 hover:underline">
                + Añadir otro
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">¿Qué no incluye?</label>
              <p className="text-xs text-[#a09383] mb-3">Especifica lo que NO está incluido (vuelos, seguro, extras, etc.)</p>
              <div className="space-y-2">
                {form.excludes_es.map((exc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={exc}
                      onChange={(e) => updateItem('excludes_es', i, e.target.value)}
                      placeholder={`Ej: ${['Vuelos', 'Seguro de viaje', 'Tratamientos spa', 'Bebidas alcohólicas'][i] || 'No incluido'}`}
                      className={inputCls}
                    />
                    {form.excludes_es.length > 1 && (
                      <button type="button" onClick={() => removeItem('excludes_es', i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors self-center">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addItem('excludes_es')} className="mt-3 text-sm font-medium text-terracotta-600 hover:underline">
                + Añadir otro
              </button>
            </div>
          </>
        )}

        {/* ═══ Step 4: Precio ═══ */}
        {step === 4 && (
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

            {/* Cancellation policy */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Política de cancelación</label>
              <div className="space-y-3">
                {(Object.entries(CANCELLATION_PRESETS) as [string, typeof CANCELLATION_PRESETS.flexible][]).map(([key, preset]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      form.cancellation_type === key
                        ? 'border-terracotta-500 bg-terracotta-50/50'
                        : 'border-sand-300 hover:border-sand-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellation"
                      value={key}
                      checked={form.cancellation_type === key}
                      onChange={() => set('cancellation_type', key)}
                      className="mt-0.5 text-terracotta-600"
                    />
                    <div>
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p className="text-xs text-[#a09383]">{preset.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-[#a09383] mt-2">La cuota de gestión de Retiru (20%) no es reembolsable en ningún caso.</p>
            </div>
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
            onClick={() => { canNext() && setStep(step + 1); if (step === 1 && schedule.length === 0) generateScheduleDays(); }}
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
                {uploading ? 'Subiendo imágenes...' : 'Creando...'}
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
