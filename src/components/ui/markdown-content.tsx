'use client';

// ============================================================================
// RETIRU · Renderiza markdown en HTML para artículos de blog
// Soporta: **, *, ###, ####, listas (- • *), listas numeradas, enlaces
// ============================================================================

import sanitizeHtml from 'sanitize-html';

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

    if (trimmed.startsWith('### ')) {
      result.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
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
      !lines[i].trim().startsWith('###') &&
      !lines[i].trim().startsWith('####') &&
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
  allowedTags: ['p', 'br', 'strong', 'em', 'h3', 'h4', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
};

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const html = sanitizeHtml(markdownToHtml(content), ALLOWED);
  return (
    <div
      className={`markdown-content text-[15px] text-[#7a6b5d] leading-[1.8] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
