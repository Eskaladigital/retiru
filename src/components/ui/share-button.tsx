'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, Facebook, Twitter, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  locale: 'es' | 'en';
  className?: string;
}

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export default function ShareButton({ url, title, locale, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = locale === 'es'
    ? {
        share: 'Compartir',
        whatsapp: 'Compartir en WhatsApp',
        facebook: 'Compartir en Facebook',
        twitter: 'Compartir en X',
        copy: 'Copiar enlace',
        copied: 'Enlace copiado',
      }
    : {
        share: 'Share',
        whatsapp: 'Share on WhatsApp',
        facebook: 'Share on Facebook',
        twitter: 'Share on X',
        copy: 'Copy link',
        copied: 'Link copied',
      };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Silenciar; el usuario ya tiene los enlaces de redes
    }
  };

  const handleShareClick = async () => {
    // En móvil, intentar usar Web Share API nativo si está disponible
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Si el usuario cancela o no se puede usar, mostrar nuestro popover
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleShareClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className ?? 'btn-ghost text-sm'}
        title={t.share}
      >
        <Share2 size={16} /> {t.share}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-30 mt-2 w-60 rounded-xl border border-sand-200 bg-white p-2 shadow-elevated"
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-sand-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon size={16} />
            </span>
            {t.whatsapp}
          </a>

          <a
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-sand-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white">
              <Facebook size={16} className="fill-current" />
            </span>
            {t.facebook}
          </a>

          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-sand-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Twitter size={16} className="fill-current" />
            </span>
            {t.twitter}
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-sand-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-100 text-foreground">
              {copied ? <Check size={16} className="text-sage-600" /> : <LinkIcon size={16} />}
            </span>
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
    </div>
  );
}
