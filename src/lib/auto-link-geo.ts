// src/lib/auto-link-geo.ts
// Inserta enlaces automáticos a páginas geográficas de Retiru (hubs provinciales
// /{locale}/provincias/[slug]) dentro del HTML del cuerpo de artículos de blog.
//
// Se aplica SERVER-SIDE, sobre HTML ya sanitizado, tokenizando por etiquetas
// para no tocar texto dentro de <a>, encabezados, <code>, <pre>, etc.
// Solo enlaza la PRIMERA ocurrencia de cada entrada (evita saturación) y
// respeta un máximo global (opts.max).
//
// La función es intencionalmente conservadora: si el HTML es inusual, devuelve
// el input sin tocar.

export interface GeoAutoLinkEntry {
  /** Texto visible a buscar, ej. "Madrid" */
  name: string;
  /** URL destino, ej. "/es/provincias/madrid" */
  href: string;
}

const BLOCKED_CONTEXT_TAGS = new Set([
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'script', 'style', 'title',
]);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track']);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlAttr(str: string): string {
  return str.replace(/"/g, '&quot;');
}

export function autoLinkGeoHtml(
  html: string,
  entries: GeoAutoLinkEntry[],
  opts: { max?: number } = {},
): string {
  if (!html || !entries.length) return html;
  const { max = entries.length } = opts;

  const pending = entries
    .slice()
    // prioridad a nombres más largos para evitar solapamientos (p. ej. "Las Palmas" antes que "Palmas")
    .sort((a, b) => b.name.length - a.name.length)
    .slice(0, Math.max(0, max))
    .map((e) => ({ ...e, used: false }));

  const tokens = html.split(/(<[^>]+>)/);
  const tagStack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (tok.startsWith('<')) {
      const isClose = /^<\s*\//.test(tok);
      const m = /^<\s*\/?\s*([a-zA-Z0-9]+)/.exec(tok);
      if (m) {
        const tag = m[1].toLowerCase();
        if (isClose) {
          const idx = tagStack.lastIndexOf(tag);
          if (idx >= 0) tagStack.splice(idx, 1);
        } else if (!VOID_TAGS.has(tag) && !tok.endsWith('/>')) {
          tagStack.push(tag);
        }
      }
      continue;
    }

    if (tagStack.some((t) => BLOCKED_CONTEXT_TAGS.has(t))) continue;

    let text = tokens[i];
    for (const entry of pending) {
      if (entry.used) continue;
      const re = new RegExp(
        `(^|[^\\p{L}\\p{N}])(${escapeRegex(entry.name)})(?=$|[^\\p{L}\\p{N}])`,
        'iu',
      );
      const mx = re.exec(text);
      if (!mx) continue;
      const start = mx.index + mx[1].length;
      const end = start + mx[2].length;
      const before = text.slice(0, start);
      const match = text.slice(start, end);
      const after = text.slice(end);
      // No añadimos class: el estilo se aplica vía BLOG_PROSE_TAILWIND ([&_a]:...)
      // y sanitize-html eliminaría `class` en <a> de todas formas.
      const anchor = `<a href="${escapeHtmlAttr(entry.href)}">${match}</a>`;
      text = before + anchor + after;
      entry.used = true;
    }
    tokens[i] = text;
  }

  return tokens.join('');
}
