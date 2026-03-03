'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MapPin, Globe, Phone, Star, Loader2, Search, Check, ExternalLink } from 'lucide-react';
import type { CenterType } from '@/types';

declare global {
  interface Window {
    google: typeof google;
  }
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

const CENTER_TYPES: { value: CenterType; label: string }[] = [
  { value: 'yoga', label: 'Yoga' },
  { value: 'meditation', label: 'Meditación' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'spa', label: 'Spa' },
  { value: 'yoga_meditation', label: 'Yoga + Meditación' },
  { value: 'wellness_spa', label: 'Wellness + Spa' },
  { value: 'multidisciplinary', label: 'Multidisciplinar' },
];

function extractAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
  return components.find(c => c.types.includes(type))?.long_name || '';
}

function guessType(types: string[]): CenterType {
  const t = types.join(' ').toLowerCase();
  if (t.includes('spa')) return 'spa';
  if (t.includes('yoga')) return 'yoga';
  if (t.includes('gym') || t.includes('fitness')) return 'wellness';
  return 'multidisciplinary';
}

function priceLevelLabel(level: number | undefined): string {
  if (level === undefined || level === null) return '—';
  return ['Gratis', '$', '$$', '$$$', '$$$$'][level] || '—';
}

export function AddCenterModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<'search' | 'preview'>('search');
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const attrRef = useRef<HTMLDivElement>(null);

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
      autocompleteRef.current = null;
    }
  }, [open]);

  const handleSave = async () => {
    if (!place) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear el centro');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'search' ? 'Buscar centro en Google Maps' : 'Confirmar nuevo centro'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search step */}
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
              Escribe el nombre del centro y selecciona de la lista de sugerencias.
            </p>
            <div ref={attrRef}></div>
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && place && (
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <p className="text-xl font-bold text-gray-900">{place.name}</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {place.address}
              </p>
            </div>

            {/* Rating */}
            {place.avg_rating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-gray-900">{place.avg_rating}</span>
                <span className="text-sm text-gray-400">({place.review_count} reseñas)</span>
              </div>
            )}

            {/* Details grid */}
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

            {/* Contact */}
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

            {/* Type selector */}
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

            {/* Google metadata */}
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">Datos de Google</summary>
              <div className="mt-2 space-y-1 bg-gray-50 rounded-lg p-3">
                <p><span className="font-medium">Place ID:</span> {place.google_place_id}</p>
                <p><span className="font-medium">Tipos:</span> {place.google_types}</p>
                <p><span className="font-medium">Estado:</span> {place.google_status}</p>
                <p><span className="font-medium">Lat/Lng:</span> {place.latitude}, {place.longitude}</p>
              </div>
            </details>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep('search'); setPlace(null); setError(''); autocompleteRef.current = null; }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Buscar otro
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-terracotta-600 text-white rounded-xl text-sm font-semibold hover:bg-terracotta-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Añadir centro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
