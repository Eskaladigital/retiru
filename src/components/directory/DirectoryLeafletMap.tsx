'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
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

interface DirectoryLeafletMapProps {
  centers: DirectoryCenter[];
  selectedId: string | null;
  onSelect: (center: DirectoryCenter) => void;
  fitToken: string;
  locateToken: number;
  locateLabel: string;
}

export default function DirectoryLeafletMap({
  centers,
  selectedId,
  onSelect,
  fitToken,
  locateToken,
  locateLabel,
}: DirectoryLeafletMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onSelect);
  const centersRef = useRef(centers);
  const selectedRef = useRef(selectedId);
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
      }).setView([40.2, -3.7], 6);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
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
      requestAnimationFrame(() => {
        map?.invalidateSize();
        const pts = centersRef.current
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);
        if (pts.length > 1) {
          map?.fitBounds(L.latLngBounds(pts).pad(0.12), { maxZoom: 11, animate: false });
        }
      });
    };

    init();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    paint();
  }, [centers, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const pts = centers
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]);
    if (pts.length === 0) {
      map.setView([40.2, -3.7], 6);
      return;
    }
    if (pts.length === 1) {
      map.flyTo(pts[0], 13, { duration: 0.6 });
      return;
    }
    map.fitBounds(L.latLngBounds(pts).pad(0.12), { maxZoom: 11, animate: true });
  }, [fitToken]);

  useEffect(() => {
    if (!locateToken) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 0.7 });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [locateToken]);

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
        .leaflet-control-attribution { font-size: 10px; }
        .leaflet-control-zoom { margin-bottom: 72px !important; }
        @media (min-width: 768px) {
          .leaflet-control-zoom { margin-bottom: 16px !important; }
        }
      `}</style>
      <span className="sr-only">{locateLabel}</span>
    </div>
  );
}
