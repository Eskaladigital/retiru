import { BLOG_PROSE_TAILWIND, sanitizeRichBodyHtml } from '@/lib/sanitize-rich-html';

export function SanitizedRichHtml({ html, className = '' }: { html: string; className?: string }) {
  const clean = sanitizeRichBodyHtml(html);
  if (!clean) return null;
  return (
    <div
      className={`markdown-content text-[15px] text-[#7a6b5d] leading-[1.85] ${BLOG_PROSE_TAILWIND} ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
