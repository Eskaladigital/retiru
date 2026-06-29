'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MapPin, Globe, Phone, Star, Loader2, Search, Check, ExternalLink, Upload, Sparkles } from 'lucide-react';
import type { CenterType } from '@/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google: any; }
}

type PlaceData = {
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  website: string;
  phone: string;
  google_place_id: string;
  google_types: string;
  google_maps_url: string;
  google_status: string;
  avg_rating: number;
  review_count: number;
  price_level: string;
  type: CenterType;
};

type ImageUploadPayload = {
  filename: string;
  contentType: string;
  dataUrl: string;
};

const CENTER_TYPES: { value: CenterType; label: string }[] = [
  { value: 'yoga', label: 'Yoga' },
  { value: 'meditation', label: 'Meditación' },
  { value: 'ayurveda', label: 'Ayurveda' },
];

function extractAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
  return components.find(c => c.types.includes(type))?.long_name || '';
}

function guessType(types: string[]): CenterType {
  const t = types.join(' ').toLowerCase();
  if (t.includes('ayurveda')) return 'ayurveda';
  if (t.includes('yoga')) return 'yoga';
  if (t.includes('pilates') || t.includes('gym') || t.includes('fitness')) return 'yoga';
  if (t.includes('spa') || t.includes('meditation') || t.includes('temple')) return 'meditation';
  return 'yoga';
}

function priceLevelLabel(level: number | undefined): string {
  if (level === undefined || level === null) return '—';
  return ['Gratis', '$', '$$', '$$$', '$$$$'][level] || '—';
}

const MAX_CENTER_IMAGE_BYTES = 4 * 1024 * 1024;
const CENTER_IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
const CENTER_IMAGE_ACCEPT_ATTR = CENTER_IMAGE_ACCEPT.join(',');

function parseActivities(text: string): string[] {
  return text
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function readImageFile(file: File): Promise<ImageUploadPayload> {
  if (!(CENTER_IMAGE_ACCEPT as readonly string[]).includes(file.type)) {
    return Promise.reject(new Error('Formato no válido. Usa JPG, PNG o WebP.'));
  }
  if (file.size > MAX_CENTER_IMAGE_BYTES) {
    return Promise.reject(new Error('La imagen supera 4 MB. Reduce el tamaño o elige otra foto.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('No se pudo preparar la imagen.'));
        return;
      }
      resolve({
        filename: file.name,
        contentType: file.type,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });
}

export type AddCenterFromMapsVariant = 'admin' | 'user';

export function AddCenterFromMapsModal({
  open,
  onClose,
  onCreated,
  variant = 'admin',
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  variant?: AddCenterFromMapsVariant;
}) {
  const [step, setStep] = useState<'search' | 'preview'>('search');
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [imageMode, setImageMode] = useState<'manual' | 'ai' | null>(null);
  const [descriptionEs, setDescriptionEs] = useState('');
  const [activitiesText, setActivitiesText] = useState('');
  const [coverUpload, setCoverUpload] = useState<ImageUploadPayload | null>(null);
  const [galleryUpload, setGalleryUpload] = useState<ImageUploadPayload | null>(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const attrRef = useRef<HTMLDivElement>(null);

  const isUser = variant === 'user';

  useEffect(() => {
    if (!open) return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, [open]);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'es' },
      types: ['establishment'],
      fields: [
        'name', 'formatted_address', 'formatted_phone_number', 'website',
        'geometry', 'rating', 'user_ratings_total', 'place_id', 'types',
        'url', 'address_components', 'business_status', 'price_level',
      ],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const p = autocompleteRef.current!.getPlace();
      if (!p.place_id) return;

      const components = p.address_components || [];
      const city =
        extractAddressComponent(components, 'locality') ||
        extractAddressComponent(components, 'administrative_area_level_4') ||
        extractAddressComponent(components, 'administrative_area_level_3') ||
        '';
      const province =
        extractAddressComponent(components, 'administrative_area_level_2') ||
        extractAddressComponent(components, 'administrative_area_level_1') ||
        '';
      const country = extractAddressComponent(components, 'country') || 'España';

      setPlace({
        name: p.name || '',
        address: p.formatted_address || '',
        city,
        province,
        postal_code: extractAddressComponent(components, 'postal_code'),
        country,
        latitude: p.geometry?.location?.lat() || 0,
        longitude: p.geometry?.location?.lng() || 0,
        website: p.website || '',
        phone: p.formatted_phone_number || '',
        google_place_id: p.place_id || '',
        google_types: (p.types || []).join(', '),
        google_maps_url: p.url || '',
        google_status: p.business_status || '',
        avg_rating: p.rating || 0,
        review_count: p.user_ratings_total || 0,
        price_level: priceLevelLabel(p.price_level),
        type: guessType(p.types || []),
      });
      setStep('preview');
    });
  }, []);

  useEffect(() => {
    if (scriptLoaded && open && step === 'search') {
      const t = setTimeout(initAutocomplete, 100);
      return () => clearTimeout(t);
    }
  }, [scriptLoaded, open, step, initAutocomplete]);

  useEffect(() => {
    if (!open) {
      setStep('search');
      setPlace(null);
      setError('');
      setSaving(false);
      setGeneratingImage(false);
      setImageMode(null);
      setDescriptionEs('');
      setActivitiesText('');
      setCoverUpload(null);
      setGalleryUpload(null);
      setGeneratedCoverUrl('');
      autocompleteRef.current = null;
    }
  }, [open]);

  const activities = parseActivities(activitiesText);
  const hasRequiredProfileContent = descriptionEs.trim().length >= 80 && activities.length > 0;
  const hasRequiredImage = Boolean(
    (imageMode === 'manual' && coverUpload) ||
    (imageMode === 'ai' && generatedCoverUrl),
  );

  async function handleImageFile(file: File | undefined, target: 'cover' | 'gallery') {
    if (!file) return;
    setError('');
    try {
      const payload = await readImageFile(file);
      if (target === 'cover') {
        setCoverUpload(payload);
      } else {
        setGalleryUpload(payload);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo preparar la imagen.');
    }
  }

  async function handleGenerateCoverAi() {
    if (!place) return;
    if (!hasRequiredProfileContent) {
      setError('Añade una descripción de al menos 80 caracteres y una actividad o servicio para generar una imagen con IA.');
      return;
    }
    setError('');
    setGeneratingImage(true);
    try {
      const typeLabel = CENTER_TYPES.find((t) => t.value === place.type)?.label;
      const res = await fetch('/api/centers/generate-cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: place.name,
          description_es: descriptionEs,
          type: place.type,
          type_label: typeLabel,
          city: place.city || undefined,
          province: place.province || undefined,
          address: place.address || undefined,
          country: place.country || undefined,
          services_es: activities,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; publicUrl?: string };
      if (!res.ok) throw new Error(data.error || `Error al generar la imagen (${res.status})`);
      if (!data.publicUrl) throw new Error('No se obtuvo URL de la imagen generada.');
      setGeneratedCoverUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar la imagen con IA.');
    } finally {
      setGeneratingImage(false);
    }
  }

  const handleSave = async () => {
    if (!place) return;
    if (!hasRequiredProfileContent) {
      setError('Antes de enviar el centro, añade una descripción de al menos 80 caracteres y una actividad o servicio.');
      return;
    }
    if (!hasRequiredImage) {
      setError('Antes de enviar el centro, sube una portada desde tu dispositivo o genera una imagen con IA.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = isUser ? '/api/centers/propose' : '/api/admin/centers';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...place,
          description_es: descriptionEs.trim(),
          services_es: activities,
          cover_url: generatedCoverUrl || undefined,
          cover_upload: coverUpload || undefined,
          images_uploads: galleryUpload ? [galleryUpload] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (isUser ? 'No se pudo enviar la propuesta' : 'Error al crear el centro'));
        setSaving(false);
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'search'
              ? (isUser ? 'Buscar tu centro en Google Maps' : 'Buscar centro en Google Maps')
              : (isUser ? 'Confirmar propuesta' : 'Confirmar nuevo centro')}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === 'search' && (
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Busca un centro, estudio, spa..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500"
                autoFocus
              />
            </div>
            {!scriptLoaded && (
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando Google Maps...
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400">
              {isUser
                ? 'Selecciona el establecimiento correcto. Un administrador validará la propuesta antes de publicarla.'
                : 'Escribe el nombre del centro y selecciona de la lista de sugerencias.'}
            </p>
            <div ref={attrRef}></div>
          </div>
        )}

        {step === 'preview' && place && (
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xl font-bold text-gray-900">{place.name}</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {place.address}
              </p>
            </div>

            {place.avg_rating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-gray-900">{place.avg_rating}</span>
                <span className="text-sm text-gray-400">({place.review_count} reseñas)</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Ciudad</p>
                <p className="font-medium text-gray-900">{place.city || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Provincia</p>
                <p className="font-medium text-gray-900">{place.province || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">CP</p>
                <p className="font-medium text-gray-900">{place.postal_code || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Nivel de precio</p>
                <p className="font-medium text-gray-900">{place.price_level}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {place.website && (
                <a href={place.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-terracotta-600 transition">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{place.website}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300" />
                </a>
              )}
              {place.phone && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {place.phone}
                </p>
              )}
              {place.google_maps_url && (
                <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-terracotta-600 transition">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-gray-300" />
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tipo de centro</label>
              <select
                value={place.type}
                onChange={e => setPlace({ ...place, type: e.target.value as CenterType })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500"
              >
                {CENTER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 rounded-2xl border border-terracotta-100 bg-terracotta-50/40 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Contenido y fotos obligatorias del perfil</p>
                <p className="mt-1 text-xs text-[#7a6b5d]">
                  El perfil no puede enviarse sin descripción, actividades e imagen. Así la ficha sale completa y atractiva.
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Descripción del centro *</label>
                <textarea
                  rows={3}
                  value={descriptionEs}
                  onChange={(e) => setDescriptionEs(e.target.value)}
                  placeholder="Ej: estudio de yoga con clases de hatha, meditación y talleres en un espacio luminoso..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500"
                />
                <p className="mt-1 text-[11px] text-[#a09383]">Mínimo 80 caracteres. También se usa como guía para la imagen IA.</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Actividades o servicios que ofrecéis *</label>
                <textarea
                  rows={2}
                  value={activitiesText}
                  onChange={(e) => setActivitiesText(e.target.value)}
                  placeholder="Yoga Hatha, meditación, ayurveda, talleres, masajes..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500"
                />
                <p className="mt-1 text-[11px] text-[#a09383]">Separa cada actividad con comas o saltos de línea.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImageMode('manual')}
                  className={`rounded-xl border px-3 py-3 text-left transition ${imageMode === 'manual' ? 'border-terracotta-500 bg-white shadow-sm' : 'border-gray-200 bg-white/70 hover:border-terracotta-200'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Upload className="h-4 w-4 text-terracotta-600" />
                    Subir desde mi dispositivo
                  </span>
                  <span className="mt-1 block text-xs text-[#7a6b5d]">Portada obligatoria y una foto adicional opcional.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('ai')}
                  className={`rounded-xl border px-3 py-3 text-left transition ${imageMode === 'ai' ? 'border-terracotta-500 bg-white shadow-sm' : 'border-gray-200 bg-white/70 hover:border-terracotta-200'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Sparkles className="h-4 w-4 text-terracotta-600" />
                    Generar imagen con IA
                  </span>
                  <span className="mt-1 block text-xs text-[#7a6b5d]">Creamos una portada editorial a partir del centro.</span>
                </button>
              </div>

              {imageMode === 'manual' && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-600 mb-1.5">Foto de portada *</span>
                    <input
                      type="file"
                      accept={CENTER_IMAGE_ACCEPT_ATTR}
                      onChange={(e) => handleImageFile(e.target.files?.[0], 'cover')}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-terracotta-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-terracotta-800 hover:file:bg-terracotta-200"
                    />
                  </label>
                  {coverUpload && (
                    <img src={coverUpload.dataUrl} alt="Vista previa de portada" className="h-32 w-full rounded-xl object-cover" />
                  )}
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-600 mb-1.5">Otra foto del centro (opcional)</span>
                    <input
                      type="file"
                      accept={CENTER_IMAGE_ACCEPT_ATTR}
                      onChange={(e) => handleImageFile(e.target.files?.[0], 'gallery')}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#7a6b5d] hover:file:bg-sand-200"
                    />
                  </label>
                  {galleryUpload && (
                    <img src={galleryUpload.dataUrl} alt="Vista previa de foto adicional" className="h-24 w-full rounded-xl object-cover" />
                  )}
                </div>
              )}

              {imageMode === 'ai' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGenerateCoverAi}
                    disabled={generatingImage || !hasRequiredProfileContent}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta-600 px-4 py-3 text-sm font-semibold text-white hover:bg-terracotta-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generatingImage ? 'Generando imagen...' : 'Generar portada con IA'}
                  </button>
                  {generatedCoverUrl && (
                    <img src={generatedCoverUrl} alt="Portada generada con IA" className="h-32 w-full rounded-xl object-cover" />
                  )}
                </div>
              )}
            </div>

            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">Datos de Google</summary>
              <div className="mt-2 space-y-1 bg-gray-50 rounded-lg p-3">
                <p><span className="font-medium">Place ID:</span> {place.google_place_id}</p>
                <p><span className="font-medium">Tipos:</span> {place.google_types}</p>
                <p><span className="font-medium">Estado:</span> {place.google_status}</p>
                <p><span className="font-medium">Lat/Lng:</span> {place.latitude}, {place.longitude}</p>
              </div>
            </details>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep('search'); setPlace(null); setError(''); autocompleteRef.current = null; }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Buscar otro
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasRequiredImage || !hasRequiredProfileContent}
                className="flex-1 py-2.5 bg-terracotta-600 text-white rounded-xl text-sm font-semibold hover:bg-terracotta-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving
                  ? (isUser ? 'Enviando...' : 'Guardando...')
                  : (isUser ? 'Enviar propuesta' : 'Añadir centro')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
