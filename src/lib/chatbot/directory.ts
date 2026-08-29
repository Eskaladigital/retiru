import type { SupabaseClient } from '@supabase/supabase-js'
import { CENTER_TYPE_URL_ES, getCenterTypeLabel } from '@/lib/utils'
import { SITE_URL, type ChatLocale } from './config'

/** Sitios como Tío Viajero (Casi Cinco): lista cerrada + lo que hay en el directorio. */
const STATIC_PLACES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', 'bilbao', 'granada', 'alicante', 'murcia',
  'cadiz', 'cordoba', 'toledo', 'segovia', 'girona', 'tarragona', 'lleida', 'castellon', 'huelva',
  'jaen', 'almeria', 'albacete', 'cuenca', 'guadalajara', 'avila', 'salamanca', 'zamora', 'leon',
  'palencia', 'burgos', 'soria', 'valladolid', 'ourense', 'lugo', 'pontevedra', 'asturias', 'oviedo',
  'gijon', 'cantabria', 'santander', 'navarra', 'pamplona', 'zaragoza', 'huesca', 'teruel', 'badajoz',
  'caceres', 'palma', 'mallorca', 'ibiza', 'tenerife', 'lanzarote', 'fuerteventura', 'cartagena',
  'lorca', 'elche', 'marbella', 'jerez', 'vitoria', 'logrono', 'portugal', 'lisboa', 'marruecos',
  'bullas', 'mazarron', 'canarias',
]

const NEIGHBORHOODS = [
  'salamanca', 'retiro', 'chamberi', 'malasana', 'chueca', 'lavapies', 'arguelles', 'moncloa',
  'tetuan', 'chamartin', 'hortaleza', 'vallecas', 'carabanchel', 'usera', 'barajas', 'huertas',
  'malasaña', 'gracia', 'eixample', 'gotico', 'born', 'ruzafa', 'benimaclet', 'albaicin', 'triana',
]

export type UserCoords = { lat: number; lng: number }

type CenterHit = {
  name: string
  slug: string
  city: string | null
  province: string | null
  region: string | null
  address: string | null
  search_terms: string | null
  type: string
  avg_rating: number | null
  review_count: number | null
  latitude?: number | null
  longitude?: number | null
}

let gazetteerCache: { at: number; names: string[] } | null = null
const GAZETTEER_TTL_MS = 10 * 60 * 1000

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function sanitizeIlike(s: string): string {
  return s.replace(/[%_,]/g, ' ').trim()
}

const PLACE_BLOCKLIST = new Set([
  'centro', 'norte', 'sur', 'este', 'oeste', 'bajo', 'local', 'planta', 'oficina', 'spain', 'espana',
  'calle', 'avenida', 'plaza', 'urbanizacion', 'polígono', 'poligono', 'santo', 'santa', 'san',
])

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  return d[m][n]
}

type QualityFloor = { minRating: number; minReviews: number; label: string }

/** Cubos del mapa Retiru (DIRECTORIO-MAPA.md). */
function detectQualityOnce(q: string): QualityFloor | null {
  const n = normalize(q)
  if (/\bdiamante|diamond\b/.test(n)) return { minRating: 4.8, minReviews: 300, label: 'diamante' }
  if (/\bplatino|platinum\b/.test(n)) return { minRating: 4.5, minReviews: 150, label: 'platino' }
  if (/\boro\b|\bgold\b/.test(n)) return { minRating: 4.3, minReviews: 60, label: 'oro' }
  if (/\bplata|silver\b/.test(n)) return { minRating: 4.0, minReviews: 25, label: 'plata' }
  if (/\bbronce|bronze\b/.test(n)) return { minRating: 3.7, minReviews: 10, label: 'bronce' }
  if (/\bmejor valorad|mejor nota|top rated|highest rated|mejor rating\b/.test(n)) {
    return { minRating: 4.5, minReviews: 150, label: 'platino' }
  }
  return null
}

function isBareCityTurn(q: string): boolean {
  const n = normalize(q).replace(/[¿?¡!.]/g, '').trim()
  if (!n || n.split(/\s+/).length > 4) return false
  if (/^(y |and |e |et )/.test(n)) return false
  if (/\b(cerca|yoga|medit|ayurveda|centro|retiro|clase|ducha|barat|diamante|platino|oro|plata|bronce)\b/.test(n)) {
    return false
  }
  return true
}

function detectTypeOnce(q: string): 'yoga' | 'meditation' | 'ayurveda' | null {
  const n = normalize(q)
  if (n.includes('ayurveda') && !n.includes('yoga') && !/medit/.test(n)) return 'ayurveda'
  if (/medit/.test(n) && !n.includes('yoga') && !n.includes('ayurveda')) return 'meditation'
  if (n.includes('yoga')) return 'yoga'
  if (n.includes('ayurveda')) return 'ayurveda'
  if (/medit/.test(n)) return 'meditation'
  const toks = n.split(/[^a-z0-9ñ]+/).filter((t) => t.length >= 3)
  for (const t of toks) {
    if (levenshtein(t, 'yoga') <= 1) return 'yoga'
    if (t.length >= 6 && levenshtein(t, 'ayurveda') <= 2) return 'ayurveda'
    if (t.length >= 5 && levenshtein(t, 'meditation') <= 2) return 'meditation'
  }
  return null
}

function queryTurns(q: string): string[] {
  return q
    .split(/\s+—\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function lastUserTurn(q: string): string {
  return queryTurns(q).at(-1) || q.trim()
}

/** Último turno del hilo que nombra un sitio; así «y cerca?» hereda Cartagena. */
function resolvePlaceFromTurns(
  query: string,
  gazetteer: string[],
  neighborhoodNames: string[]
): { places: string[]; neighborhoods: string[] } {
  const turns = queryTurns(query)
  for (let i = turns.length - 1; i >= 0; i--) {
    const places = matchGazetteer(turns[i], gazetteer)
    const neighborhoods = matchGazetteer(turns[i], neighborhoodNames)
    if (places.length || neighborhoods.length) return { places, neighborhoods }
  }
  return { places: [], neighborhoods: [] }
}

function wantsOtherType(q: string): boolean {
  const n = normalize(q)
  if (/\b(otro tipo|otra disciplina|otra cosa|otro estilo|other type|another type|something else)\b/.test(n)) {
    return true
  }
  if (!/\b(otra|otras|otro|other)\b/.test(n)) return false
  return n
    .split(/[^a-z0-9ñ]+/)
    .some((t) => levenshtein(t, 'clase') <= 1 || levenshtein(t, 'clases') <= 1)
}

function wantsCountOnly(q: string): boolean {
  const n = normalize(q)
  if (/\b(cuantos|cuantas|how many|number of)\b/.test(n)) return true
  return n
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length >= 5)
    .some(
      (t) =>
        t.startsWith('cuant') ||
        levenshtein(t, 'cuantos') <= 2 ||
        levenshtein(t, 'cuantas') <= 2
    )
}

function isValidGps(coords: UserCoords | null | undefined): coords is UserCoords {
  if (!coords) return false
  const { lat, lng } = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) return false
  return true
}

function hasProximityIntent(q: string): boolean {
  const n = normalize(q)
  return (
    /\b(cerca|aqui|por aqui|en mi zona|cerca de mi|alrededor|donde estoy|mi ubicacion|por la zona|en esta zona|en la zona)\b/.test(
      n
    ) || /\b(near me|nearby|around here|close by|where i am|my area)\b/.test(n)
  )
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function wantsDirectory(
  q: string,
  place: string | null,
  neighborhood: string | null,
  gpsNear: boolean
): boolean {
  const n = normalize(q)
  if (n.length < 6) return false
  if (/^(hola|hey|hi|hello|ok|vale|gracias|thanks)[\s!.?]*$/.test(n)) return false
  if (place || neighborhood || gpsNear) return true
  return /\b(centro|centros|estudio|ashram|retiro|retiros|clase|clases|taller|yoga|medit|ayurveda|center|retreat|class)\b/.test(
    n
  )
}

function tokens(q: string): string[] {
  return normalize(q)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length >= 4)
}

function matchGazetteer(query: string, names: string[]): string[] {
  const n = normalize(query)
  const found = new Set<string>()
  const sorted = [...names]
    .map(normalize)
    .filter((p) => p.length >= 4 && !PLACE_BLOCKLIST.has(p))
    .sort((a, b) => b.length - a.length)
  for (const p of sorted) {
    if (n.includes(p)) found.add(p)
  }
  const toks = tokens(query)
  for (const t of toks) {
    if (t.length < 6) continue
    for (const p of sorted) {
      if (found.has(p) || p.length < 6) continue
      const max = p.length >= 7 ? 2 : 1
      if (Math.abs(p.length - t.length) > max) continue
      if (levenshtein(t, p) <= max) found.add(p)
    }
  }
  return [...found]
}

function cityLooksParsedFromGoogle(city: string | null): boolean {
  if (!city) return true
  const t = city.trim()
  return /^\d+$/.test(t) || t.length < 3 || /entresuelo|bajo\b|planta|local\b|piso|^s\/n$/i.test(t)
}

function localityFromAddress(address: string | null): string | null {
  if (!address) return null
  const postal = address.match(/\d{5}\s+([^,]+)\s*,\s*(?:Spain|España)/i)
  if (postal?.[1]) return postal[1].trim()
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const withoutCountry = parts.filter((p) => !/^(spain|españa)$/i.test(p))
  return withoutCountry.at(-1) || null
}

function displayWhere(c: CenterHit): string {
  const city = c.city?.trim() || ''
  if (!cityLooksParsedFromGoogle(city)) {
    return [city, c.province].filter(Boolean).join(', ')
  }
  const fromAddr = localityFromAddress(c.address)
  return [fromAddr, c.province].filter(Boolean).join(', ')
}

function haystack(c: CenterHit): string {
  return normalize([c.name, c.city, c.province, c.region, c.address, c.search_terms].filter(Boolean).join(' '))
}

function locationScore(
  c: CenterHit,
  place: string | null,
  neighborhood: string | null,
  cityIntent: boolean
): number {
  const h = haystack(c)
  const city = normalize(c.city || '')
  const province = normalize(c.province || '')
  const address = normalize(c.address || '')
  let score = Number(c.avg_rating || 0) * 10 + Math.min(Number(c.review_count || 0), 400) / 20
  if (neighborhood && address.includes(neighborhood)) score += 120
  if (neighborhood && city.includes(neighborhood) && !cityLooksParsedFromGoogle(c.city)) score += 80
  if (place) {
    if (city.includes(place) && !cityLooksParsedFromGoogle(c.city)) score += cityIntent ? 90 : 50
    if (address.includes(place)) score += cityIntent ? 70 : 40
    if (province.includes(place) || normalize(c.region || '').includes(place)) score += cityIntent ? 15 : 35
    if (!h.includes(place)) score -= 80
  }
  return score
}

function centerUrl(locale: ChatLocale, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/en/center/${slug}` : `${SITE_URL}/es/centro/${slug}`
}

function retreatUrl(locale: ChatLocale, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/en/retreat/${slug}` : `${SITE_URL}/es/retiro/${slug}`
}

function typeLanding(locale: ChatLocale, type: string): string {
  if (locale === 'en') return `${SITE_URL}/en/centers/${type}`
  return `${SITE_URL}/es/centros/${CENTER_TYPE_URL_ES[type] || type}`
}

function formatCenterCard(c: CenterHit, locale: ChatLocale, km?: number): string {
  const typeLabel = getCenterTypeLabel(c.type, locale)
  const where = displayWhere(c)
  const reviews = c.review_count ? ` (${c.review_count})` : ''
  const rating = c.avg_rating ? `⭐ ${Number(c.avg_rating).toFixed(1)}${reviews}` : ''
  const dist =
    km != null
      ? locale === 'en'
        ? `${km.toFixed(1).replace('.', ',')} km`
        : `${km.toFixed(1).replace('.', ',')} km`
      : ''
  const pin = [dist, where].filter(Boolean).join(' · ')
  return [`**${c.name}**`, pin ? `📍 ${pin}` : '', typeLabel, rating, `🔗 ${centerUrl(locale, c.slug)}`]
    .filter(Boolean)
    .join('\n')
}

async function loadGazetteer(sb: SupabaseClient): Promise<string[]> {
  const now = Date.now()
  if (gazetteerCache && now - gazetteerCache.at < GAZETTEER_TTL_MS) return gazetteerCache.names
  const names = new Set(STATIC_PLACES.map(normalize))
  const { data } = await sb
    .from('centers')
    .select('city, province, region')
    .eq('status', 'active')
    .limit(2000)
  for (const row of data || []) {
    for (const raw of [row.province, row.region, row.city]) {
      const n = normalize(String(raw || ''))
      if (n.length < 4 || PLACE_BLOCKLIST.has(n) || cityLooksParsedFromGoogle(String(raw || ''))) continue
      if (/region de |comunidad |castilla/.test(n) && n.split(' ').length > 3) {
        for (const part of n.split(/[^a-z0-9ñ]+/).filter((p) => p.length >= 5)) names.add(part)
      }
      names.add(n)
    }
  }
  const list = [...names]
  gazetteerCache = { at: now, names: list }
  return list
}

function ilikeOr(fields: string[], needle: string): string {
  const p = `%${sanitizeIlike(needle)}%`
  return fields.map((f) => `${f}.ilike.${p}`).join(',')
}

export async function buildDirectoryBlock(
  sb: SupabaseClient,
  query: string,
  locale: ChatLocale,
  userCoords?: UserCoords | null
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const gazetteer = await loadGazetteer(sb)
  const last = lastUserTurn(query)
  const neighborhoodNames = NEIGHBORHOODS.map(normalize)
  const { places, neighborhoods } = resolvePlaceFromTurns(query, gazetteer, neighborhoodNames)
  const typeFromLast = detectTypeOnce(last)
  const typeFromThread = detectTypeOnce(query)
  const qualityFromLast = detectQualityOnce(last)
  const qualityFromThread = detectQualityOnce(query)
  const bareCity = isBareCityTurn(last)
  const type = bareCity
    ? typeFromLast
    : wantsOtherType(last)
      ? typeFromLast
      : typeFromLast || typeFromThread
  const quality = bareCity ? qualityFromLast : qualityFromLast || qualityFromThread
  let place = places[0] || null
  let neighborhood = neighborhoods[0] || null
  const hasMadrid = places.includes('madrid')
  const hasSalamanca = places.includes('salamanca') || neighborhoods.includes('salamanca')
  const barrioCue = /\bbarrio\b/.test(normalize(query))

  if (hasMadrid && hasSalamanca) {
    place = 'madrid'
    neighborhood = 'salamanca'
  } else if (neighborhood && hasMadrid) {
    place = 'madrid'
  } else if (barrioCue && neighborhood && !place) {
    place = null
  }

  const cityIntent = /\b(ciudad|city)\b/.test(normalize(query)) && !barrioCue
  const wantsEvents = /\b(retiro|retiros|clase|clases|evento|eventos|reserv|retreat|class|book)\b/.test(
    normalize(query)
  )
  const proximity = hasProximityIntent(query)
  const gpsOk = isValidGps(userCoords)
  // Molde casi cinco: si nombra ciudad, el GPS no manda.
  const gps = gpsOk && !place && !neighborhood ? userCoords : null
  const radiusKm = proximity ? 25 : 50

  const [{ count: centersN }, { count: retreatsN }] = await Promise.all([
    sb.from('centers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    sb
      .from('retreats')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('start_date', today),
  ])

  const lines: string[] = []
  if (locale === 'en') {
    lines.push(
      `CATALOG SNAPSHOT: ${centersN ?? 0} active centers; ${retreatsN ?? 0} published events from today.`
    )
    lines.push(
      `CENTER COUNT: if they ask how many centers, use ONLY ${centersN ?? 0}. Ignore any other figure from the thread or RAG.`
    )
    lines.push(
      `Directory hubs: ${SITE_URL}/en/centers/yoga · ${SITE_URL}/en/centers/meditation · ${SITE_URL}/en/centers/ayurveda`
    )
    lines.push(`Search: ${SITE_URL}/en/search · Events: ${SITE_URL}/en/retreats-retiru · Blog: ${SITE_URL}/en/blog`)
  } else {
    lines.push(
      `CATÁLOGO VIVO: ${centersN ?? 0} centros activos; ${retreatsN ?? 0} eventos publicados desde hoy.`
    )
    lines.push(
      `NÚMERO DE CENTROS: si preguntan cuántos hay, usa SOLO ${centersN ?? 0}. Ignora cualquier otra cifra del hilo o del RAG.`
    )
    lines.push(
      `Hubs del directorio: ${SITE_URL}/es/centros/yoga · ${SITE_URL}/es/centros/meditacion · ${SITE_URL}/es/centros/ayurveda`
    )
    lines.push(`Buscar: ${SITE_URL}/es/buscar · Eventos: ${SITE_URL}/es/retiros-retiru · Blog: ${SITE_URL}/es/blog`)
  }

  if (gpsOk) {
    lines.push(
      locale === 'en'
        ? `VISITOR GPS (optional): ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}. Use ONLY for "near me" / "here", or if they did not name another city. If they name a city, IGNORE GPS.`
        : `GPS DEL VISITANTE (opcional): ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}. Úsalo SOLO si dice «cerca de mí» / «aquí», o si no nombra otra ciudad. Si nombra una ciudad, IGNORA el GPS.`
    )
  }

  const filtroBits = [
    type ? (locale === 'en' ? `type=${type}` : `disciplina=${type}`) : '',
    quality ? (locale === 'en' ? `quality=${quality.label}` : `calidad=${quality.label}`) : '',
    place || neighborhood ? (locale === 'en' ? `place=${neighborhood || place}` : `sitio=${neighborhood || place}`) : '',
    gps ? 'GPS' : '',
  ].filter(Boolean)
  if (filtroBits.length) {
    lines.push(
      locale === 'en'
        ? `ACTIVE FILTERS THIS TURN (keep on follow-up unless they name a city alone): ${filtroBits.join(' · ')}`
        : `FILTROS DE ESTE TURNO (consérvalos en el follow-up salvo ciudad sola): ${filtroBits.join(' · ')}`
    )
  }

  if (proximity && !place && !neighborhood && !gpsOk) {
    lines.push(
      locale === 'en'
        ? 'Visitor asked for nearby places but did not share GPS. Ask for a city. Do not invent a location.'
        : 'El visitante pide «cerca» y no ha compartido GPS. Pregunta la ciudad. No inventes una ubicación.'
    )
  }

  if (
    wantsCountOnly(last) ||
    !wantsDirectory(query, place, neighborhood, Boolean(gps) && (proximity || Boolean(type)))
  ) {
    return lines.join('\n')
  }

  const needle = neighborhood || place
  const CENTER_FIELDS = ['name', 'city', 'province', 'region', 'address', 'search_terms']

  let centersQuery = sb
    .from('centers')
    .select(
      'name, slug, city, province, region, address, search_terms, type, avg_rating, review_count, latitude, longitude'
    )
    .eq('status', 'active')
    .limit(80)

  if (type) centersQuery = centersQuery.eq('type', type)
  if (quality) {
    centersQuery = centersQuery
      .gte('avg_rating', quality.minRating)
      .gte('review_count', quality.minReviews)
  }
  if (needle) {
    centersQuery = centersQuery.or(ilikeOr(CENTER_FIELDS, needle))
  } else if (gps) {
    const dLat = radiusKm / 111
    const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((gps.lat * Math.PI) / 180)))
    centersQuery = centersQuery
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', gps.lat - dLat)
      .lte('latitude', gps.lat + dLat)
      .gte('longitude', gps.lng - dLng)
      .lte('longitude', gps.lng + dLng)
      .limit(120)
  }

  let retreatsQuery = sb
    .from('retreats')
    .select(
      'title_es, title_en, slug, start_date, end_date, total_price, currency, address, duration_days, duration_hours, summary_es, summary_en'
    )
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(24)

  if (place) {
    retreatsQuery = retreatsQuery.or(
      ilikeOr(['title_es', 'title_en', 'address', 'summary_es', 'summary_en'], place)
    )
  } else if (wantsEvents) {
    retreatsQuery = retreatsQuery.limit(6)
  } else {
    retreatsQuery = retreatsQuery.limit(0)
  }

  const [{ data: centerRows, error: centersErr }, { data: retreatRows }] = await Promise.all([
    centersQuery,
    retreatsQuery,
  ])

  if (centersErr) {
    lines.push(
      locale === 'en'
        ? 'Live directory search failed; do not claim that no centers exist. Point to the hubs.'
        : 'La búsqueda viva del directorio falló; no digas que no hay centros. Deriva a los hubs.'
    )
    return lines.join('\n')
  }

  const withKm = ((centerRows || []) as CenterHit[]).map((c) => {
    const lat = Number(c.latitude)
    const lng = Number(c.longitude)
    const km =
      gps && Number.isFinite(lat) && Number.isFinite(lng)
        ? haversineKm(gps.lat, gps.lng, lat, lng)
        : undefined
    return { c, km }
  })

  const centers = withKm
    .filter(({ c, km }) => {
      if (quality) {
        const rating = Number(c.avg_rating || 0)
        const reviews = Number(c.review_count || 0)
        if (rating < quality.minRating || reviews < quality.minReviews) return false
      }
      if (gps) return km != null && km <= radiusKm
      const h = haystack(c)
      if (neighborhood && !h.includes(neighborhood)) return false
      if (place && neighborhood && place !== neighborhood) {
        return h.includes(place) && h.includes(neighborhood)
      }
      if (place) return h.includes(place)
      return false
    })
    .sort((a, b) => {
      if (gps && a.km != null && b.km != null) return a.km - b.km
      return (
        locationScore(b.c, place, neighborhood, cityIntent) -
        locationScore(a.c, place, neighborhood, cityIntent)
      )
    })
    .slice(0, 6)

  const retreats = (retreatRows || [])
    .filter((r) => {
      if (!place) return wantsEvents
      const h = normalize([r.title_es, r.title_en, r.address, r.summary_es, r.summary_en].filter(Boolean).join(' '))
      return h.includes(place)
    })
    .slice(0, 6)

  if (centers.length) {
    lines.push(
      locale === 'en'
        ? 'MATCHING CENTER CARDS (paste as listings; do not invent others). REQUIRED: cite at least one with its 🔗. While this list exists you MUST NOT say none were found:'
        : 'FICHAS DE CENTROS QUE COINCIDEN (pégalas tal cual; no inventes otras). OBLIGATORIO: cita al menos una con su 🔗. Mientras exista este listado está prohibido decir que no hay ninguno:'
    )
    for (const { c, km } of centers) {
      lines.push(formatCenterCard(c, locale, km))
      lines.push('')
    }
    if (type) {
      lines.push(
        locale === 'en'
          ? `More of this type: ${typeLanding(locale, type)}`
          : `Más de este tipo: ${typeLanding(locale, type)}`
      )
    }
  } else if (needle || gps || quality) {
    const qualityHint = quality
      ? locale === 'en'
        ? ` No ${quality.label}-tier listing matched.`
        : ` Ninguno llega al cubo ${quality.label}.`
      : ''
    lines.push(
      locale === 'en'
        ? gps
          ? `No matching center near the visitor GPS.${qualityHint} Ask for a city or point to the directory hubs; do not invent a studio.`
          : `No matching center in this search.${qualityHint} Point to the directory hubs; do not invent a studio.`
        : gps
          ? `Ningún centro cerca del GPS.${qualityHint} Pregunta la ciudad o deriva a los hubs; no inventes un estudio.`
          : `Ningún centro coincide con esta búsqueda.${qualityHint} Deriva a los hubs del directorio; no inventes un estudio.`
    )
  }

  if (retreats.length) {
    lines.push(locale === 'en' ? 'UPCOMING EVENTS (do not invent others):' : 'EVENTOS PRÓXIMOS (no inventes otros):')
    for (const r of retreats) {
      const title = locale === 'en' ? r.title_en || r.title_es : r.title_es || r.title_en
      const dates = r.end_date && r.end_date !== r.start_date ? `${r.start_date} → ${r.end_date}` : r.start_date
      const price =
        r.total_price != null ? ` · ${Number(r.total_price).toFixed(0)} ${r.currency || 'EUR'}` : ''
      const dur =
        r.duration_days && r.duration_days > 1
          ? locale === 'en'
            ? ` · ${r.duration_days} days`
            : ` · ${r.duration_days} días`
          : r.duration_hours
            ? locale === 'en'
              ? ` · ${r.duration_hours} h`
              : ` · ${r.duration_hours} h`
            : ''
      lines.push(`- **${title}** (${dates}${dur}${price})\n🔗 ${retreatUrl(locale, r.slug)}`)
    }
  }

  lines.push(
    locale === 'en'
      ? 'Never invent a center, retreat, price or URL that is not in this block. Never leak emails or phones. Previous Roy messages are not a source of listings or counts. If CENTER CARDS are listed, start the reply with at least one 🔗 — do not say none were found. If they ask how many centers, use CENTER COUNT from this block.'
      : 'No inventes un centro, retiro, precio o URL que no esté en este bloque. No des emails ni teléfonos. Los mensajes anteriores de Roy no son fuente de fichas ni de cifras. Si hay FICHAS DE CENTROS, empieza la respuesta con al menos una 🔗; no digas que no hay ninguno. Si preguntan cuántos centros hay, usa NÚMERO DE CENTROS de este bloque.'
  )

  return lines.join('\n')
}
