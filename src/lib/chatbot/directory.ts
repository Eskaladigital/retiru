import type { SupabaseClient } from '@supabase/supabase-js'
import { CENTER_TYPE_URL_ES, getCenterTypeLabel, getSearchTokens, matchesAllTokens } from '@/lib/utils'
import { SITE_URL, type ChatLocale } from './config'

const QUERY_STOP = [
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'con', 'por', 'para',
  'que', 'como', 'hay', 'tiene', 'quiero', 'busco', 'buscar', 'donde', 'cerca',
  'retiro', 'retiros', 'centro', 'centros', 'estudio', 'ashram', 'clase', 'clases', 'taller',
  'evento', 'eventos', 'directorio', 'funciona', 'funcionan',
  'dime', 'di', 'necesito', 'recomienda', 'recomendad', 'recomendame',
  'buen', 'bueno', 'buena', 'buenos', 'buenas', 'mejor', 'mejores',
  'algun', 'alguno', 'alguna', 'algunos', 'algunas',
  'ciudad', 'pueblo', 'zona', 'sitio', 'lugar',
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'to', 'near',
  'retreat', 'retreats', 'center', 'centers', 'class', 'classes', 'event', 'events',
  'looking', 'want', 'need', 'good', 'best', 'city', 'town', 'area', 'place', 'tell',
  'yoga', 'meditacion', 'meditation', 'ayurveda',
]

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function sanitizeIlike(s: string): string {
  return s.replace(/[%_,]/g, ' ').trim()
}

function detectType(q: string): 'yoga' | 'meditation' | 'ayurveda' | null {
  const n = normalize(q)
  if (/\bayurveda\b/.test(n)) return 'ayurveda'
  if (/\bmedit/.test(n)) return 'meditation'
  if (/\byoga\b/.test(n)) return 'yoga'
  return null
}

function wantsDirectory(q: string): boolean {
  const n = normalize(q)
  if (n.length < 8) return false
  if (/^(hola|hey|hi|hello|ok|vale|gracias|thanks)[\s!.?]*$/.test(n)) return false
  return (
    /\b(centro|centros|estudio|ashram|retiro|retiros|clase|clases|taller|yoga|medit|ayurveda|valencia|madrid|barcelona|malaga|sevilla|alicante|murcia|granada|mallorca|ibiza|canarias|portugal|marruecos|center|retreat|class)\b/.test(
      n
    ) || n.split(/\s+/).length >= 3
  )
}

function queryTokens(q: string): string[] {
  return getSearchTokens(q, QUERY_STOP)
    .map(sanitizeIlike)
    .filter((t) => t.length >= 3)
    .slice(0, 6)
}

function ilikeOr(fields: string[], needle: string): string {
  const p = `%${needle}%`
  return fields.map((f) => `${f}.ilike.${p}`).join(',')
}

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
}

function localityFromAddress(address: string | null): string | null {
  if (!address) return null
  const postal = address.match(/\d{5}\s+([^,]+)\s*,\s*(?:Spain|España)/i)
  if (postal?.[1]) return postal[1].trim()
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const withoutCountry = parts.filter((p) => !/^(spain|españa)$/i.test(p))
  return withoutCountry.at(-1) || null
}

function cityLooksParsedFromGoogle(city: string | null): boolean {
  if (!city) return true
  const t = city.trim()
  return /^\d+$/.test(t) || t.length < 3 || /entresuelo|bajo\b|planta|local\b|piso/i.test(t)
}

function displayWhere(c: CenterHit): string {
  const city = c.city?.trim() || ''
  if (!cityLooksParsedFromGoogle(city)) {
    return [city, c.province].filter(Boolean).join(', ')
  }
  const fromAddr = localityFromAddress(c.address)
  return [fromAddr, c.province].filter(Boolean).join(', ')
}

function locationScore(c: CenterHit, tokens: string[], cityIntent: boolean): number {
  const city = normalize(c.city || '')
  const province = normalize(c.province || '')
  const region = normalize(c.region || '')
  const address = normalize(c.address || '')
  let score = Number(c.avg_rating || 0) * 10 + Math.min(Number(c.review_count || 0), 200) / 20
  for (const tok of tokens) {
    if (city.includes(tok) && !cityLooksParsedFromGoogle(c.city)) score += 80
    if (address.includes(tok)) score += cityIntent ? 70 : 40
    if (province.includes(tok) || region.includes(tok)) score += cityIntent ? 15 : 35
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

export async function buildDirectoryBlock(
  sb: SupabaseClient,
  query: string,
  locale: ChatLocale
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
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
      `Directory hubs: ${SITE_URL}/en/centers/yoga · ${SITE_URL}/en/centers/meditation · ${SITE_URL}/en/centers/ayurveda`
    )
    lines.push(`Search: ${SITE_URL}/en/search · Events: ${SITE_URL}/en/retreats-retiru · Blog: ${SITE_URL}/en/blog`)
  } else {
    lines.push(
      `CATÁLOGO VIVO: ${centersN ?? 0} centros activos; ${retreatsN ?? 0} eventos publicados desde hoy.`
    )
    lines.push(
      `Hubs del directorio: ${SITE_URL}/es/centros/yoga · ${SITE_URL}/es/centros/meditacion · ${SITE_URL}/es/centros/ayurveda`
    )
    lines.push(`Buscar: ${SITE_URL}/es/buscar · Eventos: ${SITE_URL}/es/retiros-retiru · Blog: ${SITE_URL}/es/blog`)
  }

  if (!wantsDirectory(query)) {
    return lines.join('\n')
  }

  const type = detectType(query)
  const keys = queryTokens(query)
  const cityIntent = /\b(ciudad|city)\b/.test(normalize(query))
  const wantsEvents = /\b(retiro|retiros|clase|clases|evento|eventos|reserv|retreat|class|book)\b/.test(
    normalize(query)
  )
  const needle = keys[0] ? sanitizeIlike(keys[0]) : null
  const searched = Boolean(type || needle)

  const CENTER_FIELDS = ['name', 'city', 'province', 'region', 'address', 'search_terms']

  let centersQuery = sb
    .from('centers')
    .select('name, slug, city, province, region, address, search_terms, type, avg_rating, review_count')
    .eq('status', 'active')
    .limit(40)

  if (type) centersQuery = centersQuery.eq('type', type)
  if (needle) centersQuery = centersQuery.or(ilikeOr(CENTER_FIELDS, needle))

  let retreatsQuery = sb
    .from('retreats')
    .select('title_es, title_en, slug, start_date, end_date, total_price, currency, address, duration_days, duration_hours, summary_es, summary_en')
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(24)

  if (needle) {
    retreatsQuery = retreatsQuery.or(
      ilikeOr(['title_es', 'title_en', 'address', 'summary_es', 'summary_en'], needle)
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

  const centers = ((centerRows || []) as CenterHit[])
    .filter((c) =>
      keys.length === 0
        ? false
        : matchesAllTokens(keys, [c.name, c.city, c.province, c.region, c.address, c.search_terms])
    )
    .sort((a, b) => locationScore(b, keys, cityIntent) - locationScore(a, keys, cityIntent))
    .slice(0, 6)

  const retreats = (retreatRows || [])
    .filter((r) =>
      keys.length === 0
        ? wantsEvents
        : matchesAllTokens(keys, [r.title_es, r.title_en, r.address, r.summary_es, r.summary_en])
    )
    .slice(0, 6)

  if (centers.length) {
    lines.push(locale === 'en' ? 'MATCHING CENTERS (do not invent others):' : 'CENTROS QUE COINCIDEN (no inventes otros):')
    for (const c of centers) {
      const typeLabel = getCenterTypeLabel(c.type, locale)
      const where = displayWhere(c)
      const rating = c.avg_rating ? ` · ${Number(c.avg_rating).toFixed(1)}★` : ''
      lines.push(
        `- ${c.name} (${typeLabel}${where ? ` · ${where}` : ''}${rating}) ${centerUrl(locale, c.slug)}`
      )
    }
    if (type) {
      lines.push(
        locale === 'en'
          ? `More of this type: ${typeLanding(locale, type)}`
          : `Más de este tipo: ${typeLanding(locale, type)}`
      )
    }
  } else if (searched && keys.length > 0) {
    lines.push(
      locale === 'en'
        ? 'No matching center in this search. Point to the directory hubs; do not invent a studio.'
        : 'Ningún centro coincide con esta búsqueda. Deriva a los hubs del directorio; no inventes un estudio.'
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
      lines.push(`- ${title} (${dates}${dur}${price}) ${retreatUrl(locale, r.slug)}`)
    }
  }

  lines.push(
    locale === 'en'
      ? 'Never invent a center, retreat, price or URL that is not in this block. Never leak emails or phones of centers. If MATCHING CENTERS lists studios, cite at least one with its link — do not say none were found.'
      : 'No inventes un centro, retiro, precio o URL que no esté en este bloque. No des emails ni teléfonos de centros. Si CENTROS QUE COINCIDEN lista fichas, cita al menos una con enlace; no digas que no hay ninguno.'
  )

  return lines.join('\n')
}
