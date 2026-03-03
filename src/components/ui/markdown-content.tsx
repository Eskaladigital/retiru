'use client';

// ============================================================================
// RETIRU · Renderiza markdown básico (**, ###) con formato digno
// ============================================================================

import sanitizeHtml from 'sanitize-html';

function markdownToHtml(text: string): string {
  if (!text?.trim()) return '';
  // 1. Negrita **texto**
  let html = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 2. Encabezados ### Título (al inicio de línea)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  // 3. Párrafos: doble salto de línea
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      const t = block.trim();
      if (!t) return '';
      if (t.startsWith('<h3>')) return t;
      return `<p>${t.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('');
  return html;
}

const ALLOWED = {
  allowedTags: ['p', 'br', 'strong', 'h3'],
  allowedAttributes: {},
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
