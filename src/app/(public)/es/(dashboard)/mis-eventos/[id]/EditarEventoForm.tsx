'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TinyRetreatDescriptionEditor = dynamic(
  () => import('@/components/editor/TinyRetreatDescriptionEditor').then((m) => m.TinyRetreatDescriptionEditor),
  { ssr: false, loading: () => <div className="min-h-[320px] bg-sand-100 animate-pulse rounded-xl border border-sand-200" /> },
);
import { Upload, X, Sparkles } from 'lucide-react';
import { OrganizerPriceBreakdown } from '@/components/organizer/OrganizerPriceBreakdown';
import { shrinkHeavyHtmlForRetreatPayload, uploadRetreatGalleryImageFromBrowser } from '@/lib/supabase/client';
import { RetreatDescriptionBody } from '@/components/ui/retreat-description-body';
import { contentLooksLikeHtml } from '@/lib/sanitize-rich-html';
import { markdownToHtml, plainBlogBodyToMarkdown } from '@/components/ui/markdown-content';

/** Si el contenido es markdown, lo convierte a HTML para TinyMCE. Si ya es HTML, lo deja. */
function ensureHtmlForEditor(text: string): string {
  if (!text?.trim()) return '';
  if (contentLooksLikeHtml(text)) return text;
  return markdownToHtml(plainBlogBodyToMarkdown(text));
}

interface Option { id: string; name: string; slug: string }

async function uploadRetreatImageViaApi(file: File): Promise<string> {
  return uploadRetreatGalleryImageFromBrowser(file);
}

function buildCoverImagePayloadFromEdit(
  form: {
    title_es: string;
    title_en: string;
    summary_es: string;
    summary_en: string;
    description_es: string;
    description_en: string;
    start_date: string;
    end_date: string;
    destination_id: string;
    address: string;
    categories: string[];
    includes_es: string[];
    languages: string[];
  },
  retreatSchedule: unknown,
  categoryOptions: Option[],
  destinationOptions: Option[],
): Record<string, unknown> {
  const destination_label = destinationOptions.find((d) => d.id === form.destination_id)?.name;
  const category_labels = form.categories
    .map((id) => categoryOptions.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const sched = Array.isArray(retreatSchedule) ? retreatSchedule : [];
  const schedulePayload = sched.slice(0, 8).map((d: Record<string, unknown>) => {
    const itemsRaw = Array.isArray(d.items) ? d.items : [];
    const items = itemsRaw.map((it: Record<string, unknown>) => ({
      time: typeof it.time === 'string' ? it.time : '',
      title_es: typeof it.title_es === 'string' ? it.title_es : '',
      activity: typeof it.activity === 'string' ? it.activity : '',
    }));
    return {
      day: typeof d.day === 'number' ? d.day : undefined,
      title_es: typeof d.title_es === 'string' ? d.title_es : typeof d.title === 'string' ? d.title : '',
      items,
    };
  });

  return {
    title_es: form.title_es,
    title_en: form.title_en.trim() || undefined,
    summary_es: form.summary_es,
    summary_en: form.summary_en.trim() || undefined,
    description_es: shrinkHeavyHtmlForRetreatPayload(form.description_es).slice(0, 32000),
    description_en: shrinkHeavyHtmlForRetreatPayload(form.description_en).trim().slice(0, 16000) || undefined,
    destination_id: form.destination_id || undefined,
    destination_label: destination_label || undefined,
    address: form.address.trim() || undefined,
    start_date: form.start_date || undefined,
    end_date: form.end_date || undefined,
    category_ids: form.categories,
    category_labels,
    includes_es: form.includes_es.filter(Boolean),
    schedule: schedulePayload.some((d) => d.items?.length) ? schedulePayload : undefined,
    languages: form.languages?.length ? form.languages : undefined,
  };
}

async function fetchGeneratedCoverUrl(payload: Record<string, unknown>): Promise<string> {
  const res = await fetch('/api/retreats/generate-cover-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; publicUrl?: string };
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        'La petición es demasiado grande (413). Acorta la descripción o el programa, o evita pegar textos con imágenes incrustadas; luego vuelve a generar o guardar.',
      );
    }
    throw new Error(data.error || `Error al generar la imagen (${res.status})`);
  }
  if (!data.publicUrl) throw new Error('No se obtuvo URL de la imagen generada.');
  return data.publicUrl;
}

interface Props {
  retreat: any;
  categories: Option[];
  destinations: Option[];
  /** Si se pasa, usa este endpoint en lugar de /api/retreats/[id] (ej. admin) */
  apiPath?: string;
  /** Ocultar acciones de cancelar/eliminar (ej. en admin) */
  hideActions?: boolean;
  /** Vista de administrador (cambia mensajes de ayuda) */
  isAdmin?: boolean;
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';
const textareaCls = `${inputCls} resize-y min-h-[5rem]`;

type ImgRow = { url: string; is_cover: boolean; sort_order?: number };

function sortRetreatImages(rows: ImgRow[] | undefined) {
  return [...(rows || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

type LocalImage = { file?: File; url: string; preview: string; is_cover: boolean };

export function EditarEventoForm({ retreat, categories, destinations, apiPath, hideActions, isAdmin }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acting, setActing] = useState(false);

  const [images, setImages] = useState<LocalImage[]>(() => {
    const sorted = sortRetreatImages(retreat.retreat_images as ImgRow[] | undefined);
    return sorted.map((img) => ({
      url: img.url,
      preview: img.url,
      is_cover: Boolean(img.is_cover),
    }));
  });

  useEffect(() => {
    const sorted = sortRetreatImages(retreat.retreat_images as ImgRow[] | undefined);
    setImages(
      sorted.map((img) => ({
        url: img.url,
        preview: img.url,
        is_cover: Boolean(img.is_cover),
      })),
    );
  }, [retreat.id, retreat.updated_at]);

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
    description_es: ensureHtmlForEditor(retreat.description_es || ''),
    description_en: ensureHtmlForEditor(retreat.description_en || ''),
    start_date: retreat.start_date || '',
    end_date: retreat.end_date || '',
    total_price: retreat.total_price?.toString() || '',
    max_attendees: retreat.max_attendees?.toString() || '',
    min_attendees: (retreat.min_attendees ?? 1).toString(),
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

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newOnes = Array.from(files).slice(0, 8 - images.length).map((file) => ({
      file,
      url: '',
      preview: URL.createObjectURL(file),
      is_cover: images.length === 0,
    }));
    setImages((prev) => [...prev, ...newOnes]);
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

  async function buildImagesPayload(): Promise<{ url: string; is_cover: boolean }[]> {
    if (images.length === 0) {
      const publicUrl = await fetchGeneratedCoverUrl(
        buildCoverImagePayloadFromEdit(form, retreat.schedule, categories, destinations),
      );
      const one: LocalImage = { url: publicUrl, preview: publicUrl, is_cover: true };
      setImages([one]);
      return [{ url: publicUrl, is_cover: true }];
    }

    const uploaded: { url: string; is_cover: boolean }[] = [];
    const updatedLocal: LocalImage[] = [];

    for (const img of images) {
      if (img.url) {
        uploaded.push({ url: img.url, is_cover: img.is_cover });
        updatedLocal.push(img);
        continue;
      }
      if (!img.file) continue;

      const publicUrl = await uploadRetreatImageViaApi(img.file);
      uploaded.push({ url: publicUrl, is_cover: img.is_cover });
      updatedLocal.push({ ...img, url: publicUrl, preview: publicUrl, file: undefined });
    }

    if (images.length > 0 && uploaded.length !== images.length) {
      throw new Error('No se pudieron subir todas las imágenes.');
    }

    setImages(updatedLocal);
    return uploaded;
  }

  async function handleGenerateCoverAi() {
    if (!form.title_es.trim() || !form.summary_es.trim() || !form.description_es.trim()) {
      setError('Completa título, resumen y descripción para generar la portada con IA.');
      return;
    }
    if (images.length >= 8) return;
    setError('');
    setGeneratingCover(true);
    try {
      const publicUrl = await fetchGeneratedCoverUrl(
        buildCoverImagePayloadFromEdit(form, retreat.schedule, categories, destinations),
      );
      setImages((prev) => {
        const demoted = prev.map((img) => ({ ...img, is_cover: false }));
        return [{ url: publicUrl, preview: publicUrl, is_cover: true }, ...demoted];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar la imagen.');
    } finally {
      setGeneratingCover(false);
    }
  }

  async function handleSave(publish: boolean = false) {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const maxN = parseInt(String(form.max_attendees), 10);
      let minN = form.min_attendees === '' ? 1 : parseInt(String(form.min_attendees), 10);
      if (Number.isNaN(minN) || minN < 1) minN = 1;
      if (Number.isNaN(maxN) || maxN < 1) {
        setError('Indica un número válido de plazas máximas.');
        setSaving(false);
        return;
      }
      if (minN > maxN) {
        setError('El mínimo de plazas no puede ser mayor que el máximo.');
        setSaving(false);
        return;
      }

      setUploading(true);
      const imagePayload = await buildImagesPayload();
      setUploading(false);

      const res = await fetch(apiPath || `/api/retreats/${retreat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description_es: shrinkHeavyHtmlForRetreatPayload(form.description_es),
          description_en: shrinkHeavyHtmlForRetreatPayload(form.description_en),
          min_attendees: minN,
          max_attendees: maxN,
          includes_es: form.includes_es.filter(Boolean),
          destination_id: form.destination_id || null,
          status: publish ? 'published' : undefined,
          images: imagePayload,
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
        const imgCount = imagePayload.length;
        setSuccess(imgCount > 0
          ? `Cambios guardados (${imgCount} imagen${imgCount === 1 ? '' : 'es'}).`
          : 'Cambios guardados.');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setSaving(false);
      setUploading(false);
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
        <TinyRetreatDescriptionEditor
          id={`retreat-desc-${retreat.id}-es`}
          value={form.description_es}
          onChange={(html) => set('description_es', html)}
        />
        {!isAdmin && (
          <p className="text-xs text-[#a09383] mt-1.5 leading-relaxed">
            <strong className="text-red-700">⚠️ Reglas importantes:</strong> NO incluyas <strong>teléfonos, emails, WhatsApp ni redes sociales personales</strong> para que los usuarios te contacten directamente. 
            Tampoco incluyas <strong>precios diferentes</strong> al que anuncias en la ficha ni <strong>enlaces a sistemas de reserva externos</strong>. 
            El canal de contacto y reserva es <strong>siempre a través de Retiru</strong>. 
            Contenido que incumpla estas reglas será rechazado automáticamente.
          </p>
        )}
        
        {form.description_es.trim() && (
          <details className="mt-4 border border-sand-200 rounded-xl overflow-hidden">
            <summary className="px-4 py-2.5 bg-sand-50 font-medium text-sm text-foreground cursor-pointer hover:bg-sand-100 transition-colors">
              👁️ Vista previa (como se verá en la ficha pública)
            </summary>
            <div className="p-5 bg-white">
              <RetreatDescriptionBody content={form.description_es} />
            </div>
          </details>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Portada y galería del retiro</label>
        <p className="text-xs text-[#a09383] mb-3">
          <strong className="text-foreground">Portada</strong>: la etiqueta «PORTADA» marca la foto principal (listados y cabecera de la ficha). <strong className="text-foreground">Galería</strong>: el resto de fotos (hasta 8 en total) se muestran en la ficha pública bajo «Galería del retiro». Puedes generar la portada con IA o subir JPG, PNG o WebP. Si no queda ninguna imagen, al guardar se creará una portada con IA.
        </p>
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {images.map((img, i) => (
              <div key={`${img.preview}-${i}`} className="relative group rounded-xl overflow-hidden border-2 border-sand-200 aspect-[4/3]">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-sand-300 rounded-xl p-6 flex flex-col items-center gap-2 text-[#a09383] hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
            >
              <Upload size={22} />
              <span className="text-sm font-medium">Añadir imágenes</span>
              <span className="text-xs">{images.length}/8</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateCoverAi}
              disabled={
                generatingCover ||
                !form.title_es.trim() ||
                !form.summary_es.trim() ||
                !form.description_es.trim()
              }
              className="flex-1 border-2 border-dashed border-terracotta-200 bg-terracotta-50/40 rounded-xl p-6 flex flex-col items-center gap-2 text-terracotta-800 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles size={22} className="text-terracotta-600" />
              <span className="text-sm font-medium">
                {generatingCover ? 'Generando…' : 'Generar portada con IA'}
              </span>
              <span className="text-xs text-center text-[#7a6b5d]">GPT Image 1.5 · foto editorial</span>
            </button>
          </div>
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

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">PVP por persona (€) *</label>
        <input type="number" min="50" value={form.total_price} onChange={(e) => set('total_price', e.target.value)} className={`${inputCls} max-w-xs`} />
        <p className="text-xs text-[#7a6b5d] mt-1.5 leading-relaxed max-w-2xl">
          <strong className="text-foreground">PVP</strong> = lo que paga el público por plaza en Retiru (sin cargos extra en checkout).
          Tú percibes <strong className="text-foreground">solo el 80&nbsp;%</strong> (0,8 de cada euro); el <strong className="text-foreground">20&nbsp;%</strong> (0,2 de cada euro) es comisión Retiru. Ver desglose debajo.
        </p>
      </div>
      <div className="mt-3">
        <OrganizerPriceBreakdown priceInput={form.total_price} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Plazas máximas *</label>
          <input type="number" min="1" value={form.max_attendees} onChange={(e) => set('max_attendees', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Mínimo para mantener el retiro</label>
          <input type="number" min="1" value={form.min_attendees} onChange={(e) => set('min_attendees', e.target.value)} className={inputCls} />
          <p className="text-xs text-[#a09383] mt-1.5 leading-relaxed">
            Con este número de inscritos confirmados das el retiro por viable. Por debajo puedes cancelar o aplazar según comuniques.
          </p>
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
          disabled={saving || acting || uploading}
          className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Subiendo imágenes…' : 'Guardar cambios'}
        </button>
        {(retreat.status === 'draft' || retreat.status === 'rejected') && (
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || acting || uploading}
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
