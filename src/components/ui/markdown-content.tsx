'use client';

// ============================================================================
// RETIRU · Renderiza markdown en HTML para artículos de blog
// Soporta: **, *, #, ##, ###, ####, listas (- • *), listas numeradas, enlaces
// inferBlogStructure: convierte texto plano tipo CSV (--- + títulos) en ##/###
// ============================================================================

import sanitizeHtml from 'sanitize-html';

const PARA_START_FALSE = [
  'en este ',
  'en la ',
  'en las ',
  'el objetivo',
  'aunque puede',
  'aunque ',
  'si te interesa',
  'para que ',
  'para qué ',
  'cuando se ',
  'cuándo ',
  'después de',
  'también ',
  'además ',
  'esto no ',
  'no es ',
  'no todo ',
  'hay ',
  'un buen ',
  'una buena ',
  'es importante',
  'conviene ',
  'puedes ',
  'puede ',
  'muchas personas',
  'algunas ',
  'otras ',
  'si buscas',
  'si dudas',
  'si estás',
  'in this ',
  'this article',
  'although ',
  'when you ',
  'when it ',
  'if you ',
  'if you’re',
  "if you're",
  'there are ',
  'there is ',
  'many people',
  'you can ',
  'you may ',
  'it’s important',
  "it's important",
  'the goal ',
  'the aim ',
];

/** Títulos de sección en texto plano (p. ej. CSV) → ## para el parser */
function isLikelyPlainHeading(t: string): boolean {
  const len = t.length;
  if (len < 8 || len > 140) return false;
  if (/^[-*•]\s/.test(t) || /^\d+[.)]\s/.test(t)) return false;
  if (t.startsWith('#')) return false;
  if (t.includes('. ') && len > 55) return false;

  const lower = t.toLowerCase();
  if (PARA_START_FALSE.some((p) => lower.startsWith(p))) return false;

  if (t.includes('¿') && t.includes('?')) return true;
  if (t.endsWith('?') && len <= 140) return true;
  if (t.includes('. ') && len > 45) return false;
  return true;
}

function hasNextSubstantialLine(lines: string[], idx: number): boolean {
  let j = idx + 1;
  while (j < lines.length && !lines[j].trim()) j++;
  if (j >= lines.length) return false;
  const n = lines[j].trim();
  return n.startsWith('- ') || n.startsWith('•') || /^\d+[.)]\s/.test(n) || n.length >= 36;
}

/**
 * Convierte cuerpos importados como texto plano (secciones --- y títulos sueltos)
 * en markdown con ## / ###.
 */
export function plainBlogBodyToMarkdown(text: string): string {
  if (!text?.trim()) return '';
  const segments = text.split(/\r?\n---\s*\r?\n/);
  const outSegs: string[] = [];

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    const lines = seg.split('\n');
    const out: string[] = [];
    let firstNonEmptyInSeg = true;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const t = raw.trim();

      if (!t) {
        out.push('');
        continue;
      }

      if (/^#{1,6}\s\S/.test(t)) {
        out.push(t);
        firstNonEmptyInSeg = false;
        continue;
      }

      const prevEmpty = i === 0 || !lines[i - 1].trim();

      if (firstNonEmptyInSeg) {
        firstNonEmptyInSeg = false;
        if (si > 0 && prevEmpty && isLikelyPlainHeading(t) && hasNextSubstantialLine(lines, i)) {
          out.push(`## ${t}`);
        } else {
          out.push(raw);
        }
        continue;
      }

      if (prevEmpty && isLikelyPlainHeading(t) && hasNextSubstantialLine(lines, i)) {
        out.push(`## ${t}`);
      } else {
        out.push(raw);
      }
    }

    outSegs.push(out.join('\n'));
  }

  return outSegs.join('\n\n');
}

function inlineFormat(line: string): string {
  let out = line;
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

function isUnorderedItem(line: string) {
  return /^[\s]*[-•*]\s+/.test(line) && !/^\*\*/.test(line.trim());
}

function isOrderedItem(line: string) {
  return /^[\s]*\d+[.)]\s+/.test(line);
}

function stripBullet(line: string) {
  return line.replace(/^[\s]*[-•*]\s+/, '');
}

function stripNumber(line: string) {
  return line.replace(/^[\s]*\d+[.)]\s+/, '');
}

function peekNextNonEmpty(lines: string[], from: number): string {
  for (let j = from; j < lines.length; j++) {
    if (lines[j].trim()) return lines[j].trim();
  }
  return '';
}

function collectListItems(
  lines: string[],
  startIdx: number,
  matcher: (l: string) => boolean,
  stripper: (l: string) => string,
): { items: string[]; endIdx: number } {
  const items: string[] = [];
  let i = startIdx;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (matcher(trimmed)) {
      items.push(`<li>${inlineFormat(stripper(lines[i]))}</li>`);
      i++;
    } else if (!trimmed && peekNextNonEmpty(lines, i + 1) && matcher(peekNextNonEmpty(lines, i + 1))) {
      i++;
    } else {
      break;
    }
  }
  return { items, endIdx: i };
}

function markdownToHtml(text: string): string {
  if (!text?.trim()) return '';

  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      result.push(`<h4>${inlineFormat(trimmed.slice(5))}</h4>`);
      i++;
      continue;
    }

    if (trimmed.startsWith('### ') && !trimmed.startsWith('####')) {
      result.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
      i++;
      continue;
    }

    if (trimmed.startsWith('## ') && !trimmed.startsWith('###')) {
      result.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`);
      i++;
      continue;
    }

    if (trimmed.startsWith('# ') && !trimmed.startsWith('##')) {
      result.push(`<h2>${inlineFormat(trimmed.slice(2))}</h2>`);
      i++;
      continue;
    }

    if (isUnorderedItem(trimmed)) {
      const { items, endIdx } = collectListItems(lines, i, isUnorderedItem, stripBullet);
      result.push(`<ul>${items.join('')}</ul>`);
      i = endIdx;
      continue;
    }

    if (isOrderedItem(trimmed)) {
      const { items, endIdx } = collectListItems(lines, i, isOrderedItem, stripNumber);
      result.push(`<ol>${items.join('')}</ol>`);
      i = endIdx;
      continue;
    }

    const paraLines: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('####') &&
      !lines[i].trim().startsWith('###') &&
      !lines[i].trim().match(/^##\s/) &&
      !lines[i].trim().match(/^#\s/) &&
      !isUnorderedItem(lines[i].trim()) &&
      !isOrderedItem(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    result.push(`<p>${inlineFormat(paraLines.join(' '))}</p>`);
  }

  return result.join('');
}

const ALLOWED = {
  allowedTags: ['p', 'br', 'strong', 'em', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
};

const BLOG_PROSE =
  '[&_h2]:font-serif [&_h2]:text-2xl sm:[&_h2]:text-[1.65rem] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-2 [&_h2]:leading-snug ' +
  '[&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:leading-snug ' +
  '[&_h4]:font-serif [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 ' +
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_ul]:my-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 ' +
  '[&_ol]:my-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 ' +
  '[&_li]:pl-1 [&_a]:text-terracotta-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-terracotta-700';

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Interpreta texto plano de artículos (CSV) como secciones con títulos */
  inferBlogStructure?: boolean;
}

export function MarkdownContent({
  content,
  className = '',
  inferBlogStructure = false,
}: MarkdownContentProps) {
  const md = inferBlogStructure ? plainBlogBodyToMarkdown(content) : content;
  const html = sanitizeHtml(markdownToHtml(md), ALLOWED);
  return (
    <div
      className={`markdown-content text-[15px] text-[#7a6b5d] leading-[1.85] ${inferBlogStructure ? BLOG_PROSE : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
