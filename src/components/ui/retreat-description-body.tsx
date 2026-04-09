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
