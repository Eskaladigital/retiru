'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  center: any;
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-sand-300 text-[15px] outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 transition-all';
const textareaCls = `${inputCls} resize-none`;
const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

const CENTER_TYPES: { value: string; label: string }[] = [
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'meditation', label: 'Meditación' },
  { value: 'ayurveda', label: 'Ayurveda' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'spa', label: 'Spa' },
  { value: 'yoga_meditation', label: 'Yoga y Meditación' },
  { value: 'wellness_spa', label: 'Wellness y Spa' },
  { value: 'multidisciplinary', label: 'Multidisciplinar' },
];

export function EditarCentroForm({ center }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: center.name || '',
    description_es: center.description_es || '',
    description_en: center.description_en || '',
    type: center.type || 'multidisciplinary',
    cover_url: center.cover_url || '',
    logo_url: center.logo_url || '',
    website: center.website || '',
    email: center.email || '',
    phone: center.phone || '',
    instagram: center.instagram || '',
    address: center.address || '',
    city: center.city || '',
    province: center.province || '',
    postal_code: center.postal_code || '',
    services_es: (center.services_es?.length ? center.services_es : ['']) as string[],
    schedule_summary_es: center.schedule_summary_es || '',
    price_range_es: center.price_range_es || '',
    google_place_id: center.google_place_id || '',
    google_types: center.google_types || '',
    google_maps_url: center.google_maps_url || '',
    google_status: center.google_status || '',
    region: center.region || '',
    country: center.country || '',
    web_valid_ia: center.web_valid_ia || '',
    quality_ia: center.quality_ia || '',
    search_terms: center.search_terms || '',
    price_level: center.price_level || '',
  });

  const [images, setImages] = useState<string[]>(
    Array.isArray(center.images) && center.images.length > 0 ? center.images : [''],
  );

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addService() {
    setForm((f) => ({ ...f, services_es: [...f.services_es, ''] }));
  }
  function updateService(i: number, val: string) {
    setForm((f) => {
      const arr = [...f.services_es];
      arr[i] = val;
      return { ...f, services_es: arr };
    });
  }
  function removeService(i: number) {
    setForm((f) => ({ ...f, services_es: f.services_es.filter((_, idx) => idx !== i) }));
  }

  function addImage() { setImages((imgs) => [...imgs, '']); }
  function updateImage(i: number, val: string) {
    setImages((imgs) => { const arr = [...imgs]; arr[i] = val; return arr; });
  }
  function removeImage(i: number) {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, any> = {
        ...form,
        services_es: form.services_es.filter(Boolean),
        images: images.filter(Boolean),
        google_place_id: form.google_place_id || null,
        google_types: form.google_types || null,
        google_maps_url: form.google_maps_url || null,
        google_status: form.google_status || null,
        region: form.region || null,
        country: form.country || null,
        web_valid_ia: form.web_valid_ia || null,
        quality_ia: form.quality_ia || null,
        search_terms: form.search_terms || null,
        price_level: form.price_level || null,
      };

      if (!payload.cover_url) delete payload.cover_url;
      if (!payload.logo_url) delete payload.logo_url;

      const res = await fetch(`/api/centers/${center.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }

      setSuccess('Cambios guardados correctamente.');
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>}

      {/* Información básica */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Información básica</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre del centro *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo de centro</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
              {CENTER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Descripción (ES) *</label>
            <textarea rows={6} value={form.description_es} onChange={(e) => set('description_es', e.target.value)} className={textareaCls} placeholder="Describe tu centro, servicios, filosofía..." />
            <p className="text-xs text-[#a09383] mt-1">{form.description_es.length} caracteres</p>
          </div>
          <div>
            <label className={labelCls}>Descripción (EN)</label>
            <textarea rows={4} value={form.description_en} onChange={(e) => set('description_en', e.target.value)} className={textareaCls} placeholder="English description (optional)" />
          </div>
        </div>
      </section>

      {/* Imágenes */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Imágenes</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Imagen de portada (URL)</label>
            <input type="url" value={form.cover_url} onChange={(e) => set('cover_url', e.target.value)} className={inputCls} placeholder="https://..." />
            {form.cover_url && (
              <div className="mt-2 w-full h-40 rounded-xl overflow-hidden bg-sand-100">
                <img src={form.cover_url} alt="Portada" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Galería de imágenes (URLs)</label>
            <div className="space-y-2">
              {images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={img} onChange={(e) => updateImage(i, e.target.value)} placeholder="https://..." className={inputCls} />
                  {images.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 transition-colors self-center">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addImage} className="mt-2 text-sm font-medium text-terracotta-600 hover:underline">+ Añadir imagen</button>
          </div>
          <div>
            <label className={labelCls}>Logo (URL)</label>
            <input type="url" value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} className={inputCls} placeholder="https://..." />
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Contacto</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Web</label>
              <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={inputCls} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Instagram</label>
              <input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} className={inputCls} placeholder="@tucuenta" />
            </div>
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Ubicación</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Dirección *</label>
            <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Ciudad *</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Provincia *</label>
              <input type="text" value={form.province} onChange={(e) => set('province', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Código postal</label>
              <input type="text" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Servicios y horarios</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Servicios</label>
            <div className="space-y-2">
              {form.services_es.map((svc, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={svc} onChange={(e) => updateService(i, e.target.value)} placeholder="Ej: Yoga Hatha, Pilates, Masajes..." className={inputCls} />
                  {form.services_es.length > 1 && (
                    <button type="button" onClick={() => removeService(i)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-sand-300 text-[#a09383] hover:bg-red-50 hover:text-red-500 transition-colors self-center">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addService} className="mt-2 text-sm font-medium text-terracotta-600 hover:underline">+ Añadir servicio</button>
          </div>
          <div>
            <label className={labelCls}>Horario</label>
            <textarea rows={3} value={form.schedule_summary_es} onChange={(e) => set('schedule_summary_es', e.target.value)} className={textareaCls} placeholder="Ej: Lunes a viernes 9:00 - 21:00, sábados 10:00 - 14:00" />
          </div>
          <div>
            <label className={labelCls}>Rango de precios</label>
            <input type="text" value={form.price_range_es} onChange={(e) => set('price_range_es', e.target.value)} className={inputCls} placeholder="Ej: Desde 10€/clase, bonos desde 60€/mes" />
          </div>
        </div>
      </section>

      {/* Datos del directorio / Google */}
      <section>
        <h2 className="font-serif text-xl mb-4 pb-2 border-b border-sand-200">Datos del directorio</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Place ID (Google)</label>
            <input type="text" value={form.google_place_id} onChange={(e) => set('google_place_id', e.target.value)} className={inputCls} placeholder="ChIJ..." />
          </div>
          <div>
            <label className={labelCls}>URL Google Maps</label>
            <input type="url" value={form.google_maps_url} onChange={(e) => set('google_maps_url', e.target.value)} className={inputCls} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>Tipos Google</label>
            <input type="text" value={form.google_types} onChange={(e) => set('google_types', e.target.value)} className={inputCls} placeholder="establishment, health, point_of_interest" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Región</label>
              <input type="text" value={form.region} onChange={(e) => set('region', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>País</label>
              <input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Términos de búsqueda</label>
            <input type="text" value={form.search_terms} onChange={(e) => set('search_terms', e.target.value)} className={inputCls} placeholder="ayurveda · españa" />
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="flex gap-3 pt-6 border-t border-sand-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-terracotta-600 text-white font-semibold px-8 py-3 rounded-xl text-sm hover:bg-terracotta-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <a
          href={`/es/centro/${center.slug}`}
          target="_blank"
          rel="noopener"
          className="bg-white border border-sand-300 text-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-sand-50 transition-colors"
        >
          Ver ficha pública
        </a>
      </div>
    </div>
  );
}
