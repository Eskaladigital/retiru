import type { SupabaseClient } from '@supabase/supabase-js'
import { CENTER_TYPE_URL_ES, getCenterTypeLabel } from '@/lib/utils'
import { SITE_URL, type ChatLocale } from './config'

const STOP = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'con', 'por', 'para',
  'que', 'como', 'hay', 'tiene', 'quiero', 'busco', 'buscar', 'donde', 'dónde', 'cerca',
  'retiro', 'retiros', 'centro', 'centros', 'clase', 'clases', 'evento', 'eventos',
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'to', 'near',
  'retreat', 'retreats', 'center', 'centers', 'class', 'classes', 'event', 'events',
  'yoga', 'meditacion', 'meditación', 'meditation', 'ayurveda',
])

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

function tokens(q: string): string[] {
  return normalize(q)
    .split(/[^a-z0-9ñ]+/)
    .map(sanitizeIlike)
    .filter((t) => t.length >= 4 && !STOP.has(t))
    .slice(0, 4)
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
  const keys = tokens(query)
  const pattern = keys[0] ? `%${keys[0]}%` : type ? '%' : null

  let centersQuery = sb
    .from('centers')
    .select('name, slug, city, province, type, avg_rating')
    .eq('status', 'active')
    .limit(6)

  if (type) centersQuery = centersQuery.eq('type', type)
  if (pattern) {
    centersQuery = centersQuery.or(
      `name.ilike.${pattern},city.ilike.${pattern},province.ilike.${pattern},search_terms.ilike.${pattern}`
    )
  }

  let retreatsQuery = sb
    .from('retreats')
    .select('title_es, title_en, slug, start_date, end_date, total_price, currency, address, duration_days, duration_hours')
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(6)

  if (pattern) {
    retreatsQuery = retreatsQuery.or(
      `title_es.ilike.${pattern},title_en.ilike.${pattern},address.ilike.${pattern},summary_es.ilike.${pattern},summary_en.ilike.${pattern}`
    )
  }

  const [{ data: centers }, { data: retreats }] = await Promise.all([centersQuery, retreatsQuery])

  if (centers?.length) {
    lines.push(locale === 'en' ? 'MATCHING CENTERS (do not invent others):' : 'CENTROS QUE COINCIDEN (no inventes otros):')
    for (const c of centers) {
      const typeLabel = getCenterTypeLabel(c.type, locale)
      const where = [c.city, c.province].filter(Boolean).join(', ')
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
  } else if (type || pattern) {
    lines.push(
      locale === 'en'
        ? 'No matching center in this search. Point to the directory hubs; do not invent a studio.'
        : 'Ningún centro coincide con esta búsqueda. Deriva a los hubs del directorio; no inventes un estudio.'
    )
  }

  if (retreats?.length) {
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
      ? 'Never invent a center, retreat, price or URL that is not in this block. Never leak emails or phones of centers.'
      : 'No inventes un centro, retiro, precio o URL que no esté en este bloque. No des emails ni teléfonos de centros.'
  )

  return lines.join('\n')
}
