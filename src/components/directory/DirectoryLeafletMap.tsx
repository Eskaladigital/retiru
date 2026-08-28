'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { getCenterTypeColor, getCenterTypeIcon } from '@/lib/utils';

export type DirectoryCenter = {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  cover_url: string | null;
  images?: string[] | null;
  latitude: number | null;
  longitude: number | null;
  avg_rating: number | null;
  review_count: number | null;
  description_es?: string | null;
  description_en?: string | null;
  services_es?: string[] | null;
  services_en?: string[] | null;
};

type ClusterGroup = {
  key: string;
  lat: number;
  lng: number;
  count: number;
  center?: DirectoryCenter;
};

function groupCenters(centers: DirectoryCenter[], zoom: number): ClusterGroup[] {
  const map = new Map<string, DirectoryCenter[]>();
  for (const c of centers) {
    if (c.latitude == null || c.longitude == null) continue;
    let key: string;
    if (zoom < 7) key = `p:${c.province || c.country || 'x'}`;
    else if (zoom < 10) key = `c:${c.city || ''}|${c.province || ''}`;
    else key = `id:${c.id}`;
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  const groups: ClusterGroup[] = [];
  for (const [key, list] of map) {
    const lat = list.reduce((s, c) => s + Number(c.latitude), 0) / list.length;
    const lng = list.reduce((s, c) => s + Number(c.longitude), 0) / list.length;
    groups.push({
      key,
      lat,
      lng,
      count: list.length,
      center: list.length === 1 ? list[0] : undefined,
    });
  }
  return groups;
}

function pinHtml(type: string | null, selected: boolean) {
  const color = getCenterTypeColor(type);
  const icon = getCenterTypeIcon(type);
  return `<span class="dir-pin${selected ? ' is-on' : ''}" style="--c:${color}"><span class="dir-pin-icon">${icon}</span></span>`;
}

function clusterHtml(count: number) {
  const size = count > 80 ? 48 : count > 30 ? 42 : 36;
  return `<span class="dir-cluster" style="--s:${size}px">${count}</span>`;
}

/** Vista inicial y «Restablecer zoom»: península + Baleares, sin Canarias. */
const SPAIN_CENTER: [number, number] = [40.4, -3.7];
const SPAIN_ZOOM = 6;

function applySpainView(map: import('leaflet').Map, animate: boolean) {
  if (animate) map.flyTo(SPAIN_CENTER, SPAIN_ZOOM, { duration: 0.6 });
  else map.setView(SPAIN_CENTER, SPAIN_ZOOM);
}

interface DirectoryLeafletMapProps {
  centers: DirectoryCenter[];
  selectedId: string | null;
  onSelect: (center: DirectoryCenter) => void;
  fitToken: string;
  userGeo: { lat: number; lng: number } | null;
  resetToken: number;
  resetToFilter: boolean;
  locateLabel: string;
}

export default function DirectoryLeafletMap({
  centers,
  selectedId,
  onSelect,
  fitToken,
  userGeo,
  resetToken,
  resetToFilter,
  locateLabel,
}: DirectoryLeafletMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onSelect);
  const centersRef = useRef(centers);
  const selectedRef = useRef(selectedId);
  const userMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelect;
  centersRef.current = centers;
  selectedRef.current = selectedId;

  const paint = () => {
    const map = mapRef.current;
    const L = LRef.current;
    const layer = layerRef.current;
    if (!map || !L || !layer) return;
    layer.clearLayers();
    const groups = groupCenters(centersRef.current, map.getZoom());
    for (const g of groups) {
      const isPin = g.count === 1 && g.center;
      const html = isPin
        ? pinHtml(g.center!.type, selectedRef.current === g.center!.id)
        : clusterHtml(g.count);
      const size = isPin ? (selectedRef.current === g.center!.id ? 34 : 26) : g.count > 80 ? 48 : g.count > 30 ? 42 : 36;
      const icon = L.divIcon({
        className: 'dir-marker',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([g.lat, g.lng], { icon, zIndexOffset: isPin && selectedRef.current === g.center?.id ? 800 : 0 });
      marker.on('click', () => {
        if (g.center) {
          onSelectRef.current(g.center);
          return;
        }
        const members = centersRef.current.filter((c) => {
          if (c.latitude == null || c.longitude == null) return false;
          const z = map.getZoom();
          if (z < 7) return (c.province || c.country || 'x') === g.key.slice(2);
          return `${c.city || ''}|${c.province || ''}` === g.key.slice(2);
        });
        const pts = members
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);
        if (pts.length === 0) return;
        map.fitBounds(L.latLngBounds(pts).pad(0.18), { maxZoom: 12, animate: true });
      });
      marker.addTo(layer);
    }
  };

  useEffect(() => {
    if (!wrapRef.current) return;
    let cancelled = false;
    let map: import('leaflet').Map | null = null;

    const init = async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !wrapRef.current) return;
      LRef.current = L;
      map = L.map(wrapRef.current, {
        zoomControl: false,
        attributionControl: true,
      });
      applySpainView(map, false);
      L.control.zoom({ position: 'topright' }).addTo(map);
      const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
      const tiles = maptilerKey
        ? L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}&language=es`, {
            attribution: '&copy; MapTiler &copy; OSM',
            maxZoom: 19,
          })
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
          });
      tiles.addTo(map);
      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      map.on('zoomend moveend', paint);
      paint();
      setMapReady(true);
      requestAnimationFrame(() => {
        map?.invalidateSize();
        if (map) applySpainView(map, false);
      });
    };

    init();
    return () => {
      cancelled = true;
      setMapReady(false);
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    paint();
  }, [centers, selectedId]);

  useEffect(() => {
    if (!fitToken) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const pts = centers
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo(pts[0], 13, { duration: 0.6 });
      return;
    }
    map.fitBounds(L.latLngBounds(pts).pad(0.12), { maxZoom: 11, animate: true });
  }, [fitToken, centers]);

  useEffect(() => {
    if (!resetToken) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (resetToFilter) {
      const pts = centers
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);
      if (pts.length === 1) {
        map.flyTo(pts[0], 13, { duration: 0.6 });
        return;
      }
      if (pts.length > 1) {
        map.fitBounds(L.latLngBounds(pts).pad(0.12), { maxZoom: 11, animate: true });
        return;
      }
    }
    applySpainView(map, true);
  }, [resetToken, resetToFilter, centers]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (!userGeo) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const icon = L.divIcon({
      className: 'dir-marker',
      html: '<span class="dir-user"><span class="dir-user-ring"></span><span class="dir-user-dot"></span></span>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userGeo.lat, userGeo.lng], { icon, zIndexOffset: 1200 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userGeo.lat, userGeo.lng]);
    }
    map.flyTo([userGeo.lat, userGeo.lng], Math.max(map.getZoom(), 12), { duration: 0.7 });
  }, [userGeo, mapReady]);

  useEffect(() => {
    if (!selectedId) return;
    const c = centers.find((x) => x.id === selectedId);
    if (!c || c.latitude == null || c.longitude == null) return;
    mapRef.current?.flyTo([Number(c.latitude), Number(c.longitude)], Math.max(mapRef.current.getZoom(), 13), {
      duration: 0.45,
    });
  }, [selectedId, centers]);

  return (
    <div className="absolute inset-0">
      <div ref={wrapRef} className="h-full w-full" />
      <style>{`
        .dir-marker { background: none !important; border: none !important; }
        .dir-pin {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: var(--c);
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(45, 35, 25, 0.35);
        }
        .dir-pin-icon {
          font-size: 13px;
          line-height: 1;
          pointer-events: none;
        }
        .dir-pin.is-on {
          width: 34px;
          height: 34px;
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(200, 90, 48, 0.35), 0 2px 8px rgba(45, 35, 25, 0.4);
        }
        .dir-pin.is-on .dir-pin-icon { font-size: 17px; }
        .dir-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--s);
          height: var(--s);
          border-radius: 999px;
          background: #c85a30;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(200, 90, 48, 0.35);
        }
        .dir-user { position: relative; display: block; width: 36px; height: 36px; }
        .dir-user-ring {
          position: absolute; inset: 0; border-radius: 999px;
          background: rgba(200, 90, 48, 0.25); border: 2px solid rgba(200, 90, 48, 0.45);
          animation: dirUserPulse 2s ease-out infinite;
        }
        .dir-user-dot {
          position: absolute; top: 50%; left: 50%; width: 14px; height: 14px;
          transform: translate(-50%, -50%); background: #c85a30;
          border: 3px solid #fff; border-radius: 999px;
          box-shadow: 0 0 0 4px rgba(200, 90, 48, 0.3);
        }
        @keyframes dirUserPulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-control-attribution { font-size: 10px; }
        .leaflet-control-zoom { margin: 12px 12px 0 0 !important; }
        @media (min-width: 768px) {
          .leaflet-control-zoom { margin: 16px 16px 0 0 !important; }
        }
      `}</style>
      <span className="sr-only">{locateLabel}</span>
    </div>
  );
}
