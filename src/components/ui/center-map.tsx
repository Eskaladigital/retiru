'use client';

// ============================================================================
// RETIRU · Mapa OpenStreetMap (Leaflet) — gratis, sin API key
// ============================================================================

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

interface CenterMapProps {
  latitude: number | null;
  longitude: number | null;
  name: string;
  address?: string | null;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038]; // Madrid

export function CenterMap({ latitude, longitude, name, address, className = '' }: CenterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lat = latitude ?? DEFAULT_CENTER[0];
    const lon = longitude ?? DEFAULT_CENTER[1];
    const hasCoords = latitude != null && longitude != null;

    let map: import('leaflet').Map | null = null;

    const init = async () => {
      try {
        const L = (await import('leaflet')).default;

        map = L.map(containerRef.current!).setView([lat, lon], hasCoords ? 16 : 6);

        // OpenStreetMap tiles — gratis, sin API key
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        if (hasCoords) {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: '<span style="background:#c85a30;width:12px;height:12px;border-radius:50%;display:block;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"/>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          L.marker([lat, lon], { icon }).addTo(map).bindPopup(`<strong>${name}</strong>${address ? `<br/><small>${address}</small>` : ''}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar el mapa');
      }
    };

    init();
    return () => {
      map?.remove();
    };
  }, [latitude, longitude, name, address]);

  if (error) {
    return (
      <div className={`rounded-2xl border border-sand-200 bg-sand-50 flex items-center justify-center text-sm text-[#7a6b5d] ${className}`} style={{ minHeight: 192 }}>
        No se pudo cargar el mapa
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden border border-sand-200 ${className}`}
      style={{ minHeight: 192 }}
    />
  );
}
