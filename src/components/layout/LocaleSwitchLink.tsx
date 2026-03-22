'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getAlternateLocalePath, isBlogArticlePath } from '@/lib/locale-path';

type Props = {
  locale: Locale;
  className?: string;
  children?: ReactNode;
  onNavigate?: () => void;
};

/**
 * Enlace al equivalente de la página actual en el otro idioma (no solo la home).
 * Posts del blog resuelven slug ES/EN vía API.
 */
export default function LocaleSwitchLink({ locale, className, children, onNavigate }: Props) {
  const hookPath = usePathname() || '';
  const altLocale: Locale = locale === 'es' ? 'en' : 'es';

  const pathname = useMemo(() => {
    if (/^\/(es|en)(\/|$)/.test(hookPath)) return hookPath;
    if (typeof window !== 'undefined' && /^\/(es|en)(\/|$)/.test(window.location.pathname)) {
      return window.location.pathname;
    }
    return hookPath;
  }, [hookPath]);

  const [blogPair, setBlogPair] = useState<{ es: string; en: string } | null>(null);

  useEffect(() => {
    if (!pathname || !isBlogArticlePath(pathname)) {
      setBlogPair(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/blog/alternate-path?path=${encodeURIComponent(pathname)}`)
      .then((r) => r.json())
      .then((j: { es: string | null; en: string | null }) => {
        if (cancelled || !j?.es || !j?.en) return;
        setBlogPair({ es: j.es, en: j.en });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const href = useMemo(() => {
    if (!pathname || !/^\/(es|en)(\/|$)/.test(pathname)) {
      return `/${altLocale}`;
    }
    // Solo usar pareja blog cuando la URL actual es un post; si no, blogPair obsoleto rompería el href.
    if (isBlogArticlePath(pathname) && blogPair) {
      return locale === 'es' ? blogPair.en : blogPair.es;
    }
    return getAlternateLocalePath(pathname, altLocale);
  }, [pathname, locale, altLocale, blogPair]);

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        onNavigate?.();
      }}
    >
      {children ?? (altLocale === 'en' ? 'English' : 'Español')}
    </a>
  );
}
