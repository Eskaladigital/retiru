import React from 'react';

import { MarkdownContent } from '@/components/ui/markdown-content';
import { SanitizedRichHtml } from '@/components/ui/sanitized-rich-html';
import { contentLooksLikeHtml } from '@/lib/sanitize-rich-html';

/** Ficha pública: HTML (TinyMCE) o markdown/texto legacy. */
export function RetreatDescriptionBody({ content, className = '' }: { content: string; className?: string }) {
  const c = content ?? '';
  if (!c.trim()) return null;
  if (contentLooksLikeHtml(c)) {
    return <SanitizedRichHtml html={c} className={className} />;
  }
  return <MarkdownContent content={c} inferBlogStructure className={className} />;
}

/** Misma lógica que la descripción de retiro: útil para artículos de blog (HTML + legacy markdown). */
export const RichContentBody = RetreatDescriptionBody;

const URL_SPLIT = /(https?:\/\/[^\s<)]+)/g;
const URL_TEST = /^https?:\/\//;

/** Convierte URLs sueltas en enlaces clicables dentro de texto plano (JSX). */
export function LinkifyText({ children }: { children: string }) {
  if (!children) return null;
  const parts = children.split(URL_SPLIT);
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((part, i) =>
        URL_TEST.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta-600 underline underline-offset-2 hover:text-terracotta-700"
          >
            {part.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
