// Geocodificación server-side (Google Geocoding API).
// Se usa para dar coordenadas aproximadas a centros sin sede física fija
// (service_area): el pin cae en el centroide de la ciudad, no en un portal.

type LatLng = { lat: number; lng: number };

/**
 * Devuelve el centroide aproximado de una ciudad/municipio.
 * No lanza: si falla (sin clave, sin red, sin resultado) devuelve null y el
 * centro se guarda sin coordenadas (no aparecerá en el mapa, sí en el listado).
 */
export async function geocodeCity(
  city: string,
  province?: string | null,
  country: string = 'España',
): Promise<LatLng | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !city) return null;
  const address = [city, province, country].filter(Boolean).join(', ');
  try {
    const url =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(address)}&region=es&language=es&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
    };
    const loc = data.results?.[0]?.geometry?.location;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {
    /* red/TLS: se guarda sin coordenadas */
  }
  return null;
}
