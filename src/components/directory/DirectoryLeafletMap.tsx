'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import Supercluster from 'supercluster';
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

type PointProps = { centerId: string };

function isClusterProps(
  props: Supercluster.ClusterProperties | PointProps,
): props is Supercluster.ClusterProperties {
  return 'cluster' in props && Boolean(props.cluster);
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

function hasFinePointer() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pinTooltipHtml(center: DirectoryCenter) {
  const rating = Number(center.avg_rating);
  const reviews = Number(center.review_count);
  const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null;
  const reviewsLabel = Number.isFinite(reviews) && reviews > 0 ? Math.round(reviews).toLocaleString('es-ES') : null;
  const ratingHtml = ratingLabel
    ? `<span class="dir-tip-rating"><span class="dir-tip-star">★</span>${ratingLabel}${
        reviewsLabel ? `<span class="dir-tip-reviews">(${reviewsLabel})</span>` : ''
      }</span>`
    : '';
  return `<div class="dir-tip"><span class="dir-tip-name">${escapeHtml(center.name)}</span>${ratingHtml}</div>`;
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
  const selectedRef = useRef(selectedId);
  const byIdRef = useRef<Map<string, DirectoryCenter>>(new Map());
  const clusterIndexRef = useRef<Supercluster<PointProps> | null>(null);
  const userMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelect;
  selectedRef.current = selectedId;

  const rebuildIndex = (list: DirectoryCenter[]) => {
    const index = new Supercluster<PointProps>({
      radius: 60,
      maxZoom: 12,
      minPoints: 3,
    });
    const byId = new Map<string, DirectoryCenter>();
    const features: Supercluster.PointFeature<PointProps>[] = [];
    for (const c of list) {
      if (c.latitude == null || c.longitude == null) continue;
      byId.set(c.id, c);
      features.push({
        type: 'Feature',
        properties: { centerId: c.id },
        geometry: { type: 'Point', coordinates: [Number(c.longitude), Number(c.latitude)] },
      });
    }
    index.load(features);
    clusterIndexRef.current = index;
    byIdRef.current = byId;
  };

  const paint = () => {
    const map = mapRef.current;
    const L = LRef.current;
    const layer = layerRef.current;
    const index = clusterIndexRef.current;
    if (!map || !L || !layer || !index) return;
    layer.clearLayers();
    const bounds = map.getBounds();
    const pad = 0.04;
    const bbox: [number, number, number, number] = [
      bounds.getWest() - pad,
      bounds.getSouth() - pad,
      bounds.getEast() + pad,
      bounds.getNorth() + pad,
    ];
    const zoom = Math.max(0, Math.floor(map.getZoom()));
    const clusters = index.getClusters(bbox, zoom);
    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      if (isClusterProps(props)) {
        const count = props.point_count;
        const size = count > 80 ? 48 : count > 30 ? 42 : 36;
        const icon = L.divIcon({
          className: 'dir-marker',
          html: clusterHtml(count),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([lat, lng], { icon });
        const clusterId = props.cluster_id;
        marker.on('click', () => {
          let target = 16;
          try {
            target = Math.min(index.getClusterExpansionZoom(clusterId), 16);
          } catch {
            target = Math.min(map.getZoom() + 2, 16);
          }
          map.flyTo([lat, lng], target, { duration: 0.5 });
        });
        marker.addTo(layer);
        continue;
      }
      const center = byIdRef.current.get(props.centerId);
      if (!center) continue;
      const selected = selectedRef.current === center.id;
      const size = selected ? 34 : 26;
      const icon = L.divIcon({
        className: 'dir-marker',
        html: pinHtml(center.type, selected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([lat, lng], { icon, zIndexOffset: selected ? 800 : 0 });
      if (hasFinePointer()) {
        marker.bindTooltip(pinTooltipHtml(center), {
          direction: 'top',
          offset: [0, -14],
          opacity: 1,
          className: 'dir-tip-leaflet',
        });
      }
      marker.on('click', () => onSelectRef.current(center));
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
      rebuildIndex(centers);
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
    rebuildIndex(centers);
    paint();
  }, [centers]);

  useEffect(() => {
    paint();
  }, [selectedId]);

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

  const hasCenteredOnUserRef = useRef(false);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (!userGeo) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      hasCenteredOnUserRef.current = false;
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
    if (!hasCenteredOnUserRef.current) {
      hasCenteredOnUserRef.current = true;
      map.flyTo([userGeo.lat, userGeo.lng], Math.max(map.getZoom(), 12), { duration: 0.7 });
    }
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
        .dir-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.3;
          color: #2d2319;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(45, 35, 25, 0.18);
          white-space: nowrap;
          max-width: 340px;
          pointer-events: none;
        }
        .dir-tip-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dir-tip-rating {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 700;
          color: #853a26;
        }
        .dir-tip-star { color: #f59e0b; font-size: 12px; line-height: 1; }
        .dir-tip-reviews { font-weight: 600; color: #7a6b5d; }
        .leaflet-tooltip.dir-tip-leaflet {
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-tooltip.dir-tip-leaflet::before { display: none; }
      `}</style>
      <span className="sr-only">{locateLabel}</span>
    </div>
  );
}
