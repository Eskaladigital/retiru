import type { IOptions } from 'sanitize-html';
import sanitizeHtml from 'sanitize-html';

/** Mismo subconjunto que el markdown público + blockquote / tachado (editores ricos). */
export const RICH_BODY_SANITIZE_OPTIONS: IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 's', 'del'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
};

export function sanitizeRichBodyHtml(raw: string): string {
  return sanitizeHtml(raw ?? '', RICH_BODY_SANITIZE_OPTIONS);
}

/** HTML guardado (TinyMCE, TipTap, etc.) frente a markdown o texto plano legacy. */
export function contentLooksLikeHtml(text: string): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  if (t.startsWith('<')) return true;
  if (/<\/(p|h[1-6]|ul|ol|li|blockquote|div)>/i.test(t)) return true;
  if (/<(p|h[1-6]|ul|ol|li|div|blockquote)[\s>/]/i.test(t)) return true;
  return false;
}

export const BLOG_PROSE_TAILWIND =
  '[&_h2]:font-serif [&_h2]:text-2xl sm:[&_h2]:text-[1.65rem] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-2 [&_h2]:leading-snug ' +
  '[&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:leading-snug ' +
  '[&_h4]:font-serif [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 ' +
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_ul]:my-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 ' +
  '[&_ol]:my-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 ' +
  '[&_li]:pl-1 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-sand-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7a6b5d] ' +
  '[&_a]:text-terracotta-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-terracotta-700';
