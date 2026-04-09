import type { IOptions } from 'sanitize-html';
import sanitizeHtml from 'sanitize-html';

/** Subconjunto seguro alineado con TinyMCE/TipTap en retiros y blog (sin scripts ni estilos inline). */
export const RICH_BODY_SANITIZE_OPTIONS: IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    's',
    'del',
    'img',
    'figure',
    'figcaption',
    'code',
    'pre',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
    code: ['class'],
    pre: ['class'],
  },
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
};

export function sanitizeRichBodyHtml(raw: string): string {
  return sanitizeHtml(raw ?? '', RICH_BODY_SANITIZE_OPTIONS);
}

/** HTML guardado (TinyMCE, TipTap, etc.) frente a markdown o texto plano legacy. */
export function contentLooksLikeHtml(text: string): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  // Evitar falsos positivos tipo "<3"; exigir apertura de etiqueta razonable
  if (/^<[a-zA-Z!?\/]/.test(t)) return true;
  if (/<\/(p|h[1-6]|ul|ol|li|blockquote|div|img|figure|figcaption|pre|code|a)>/i.test(t)) return true;
  if (/<(p|h[1-6]|ul|ol|li|div|blockquote|img|figure|figcaption|pre|code|a|hr)(\s[^>]*)?>/i.test(t)) return true;
  return false;
}

export const BLOG_PROSE_TAILWIND =
  '[&_h1]:font-serif [&_h1]:text-[clamp(1.5rem,3vw,2rem)] [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:leading-snug ' +
  '[&_h2]:font-serif [&_h2]:text-2xl sm:[&_h2]:text-[1.65rem] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-2 [&_h2]:leading-snug ' +
  '[&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:leading-snug ' +
  '[&_h4]:font-serif [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2 ' +
  '[&_h5]:font-semibold [&_h5]:text-base [&_h5]:text-foreground [&_h5]:mt-5 [&_h5]:mb-2 ' +
  '[&_h6]:font-semibold [&_h6]:text-sm [&_h6]:text-foreground [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:mt-4 [&_h6]:mb-2 ' +
  '[&_p]:mb-4 [&_p:last-child]:mb-0 ' +
  '[&_ul]:my-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 ' +
  '[&_ol]:my-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 ' +
  '[&_li]:pl-1 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-sand-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7a6b5d] ' +
  '[&_figure]:my-6 [&_figure]:mx-0 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-[#a09383] ' +
  '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 ' +
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-sand-100 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-foreground ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm ' +
  '[&_p_code]:rounded [&_p_code]:bg-sand-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:text-[0.9em] ' +
  '[&_li_code]:rounded [&_li_code]:bg-sand-100 [&_li_code]:px-1 [&_li_code]:text-[0.9em] ' +
  '[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-sand-200 ' +
  '[&_a]:text-terracotta-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-terracotta-700';
