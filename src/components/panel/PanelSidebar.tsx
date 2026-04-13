'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { organizerLocaleFromPathname, organizerPanelPrefix } from '@/lib/locale-path';

const NAV_COPY: Record<Locale, { hrefSuffix: string; label: string; icon: string }[]> = {
  es: [
    { hrefSuffix: '', label: 'Dashboard', icon: '📊' },
    { hrefSuffix: '/eventos', label: 'Mis retiros', icon: '📅' },
    { hrefSuffix: '/asistentes', label: 'Asistentes', icon: '👥' },
    { hrefSuffix: '/mensajes', label: 'Mensajes', icon: '💬' },
    { hrefSuffix: '/resenas', label: 'Reseñas', icon: '⭐' },
    { hrefSuffix: '/analiticas', label: 'Analíticas', icon: '📈' },
    { hrefSuffix: '/verificacion', label: 'Verificación', icon: '✓' },
    { hrefSuffix: '/configuracion', label: 'Configuración', icon: '⚙️' },
  ],
  en: [
    { hrefSuffix: '', label: 'Dashboard', icon: '📊' },
    { hrefSuffix: '/eventos', label: 'My retreats', icon: '📅' },
    { hrefSuffix: '/asistentes', label: 'Attendees', icon: '👥' },
    { hrefSuffix: '/mensajes', label: 'Messages', icon: '💬' },
    { hrefSuffix: '/resenas', label: 'Reviews', icon: '⭐' },
    { hrefSuffix: '/analiticas', label: 'Analytics', icon: '📈' },
    { hrefSuffix: '/verificacion', label: 'Verification', icon: '✓' },
    { hrefSuffix: '/configuracion', label: 'Settings', icon: '⚙️' },
  ],
};

const SIDEBAR_TITLE: Record<Locale, string> = {
  es: 'Panel organizador',
  en: 'Organizer panel',
};

export default function PanelSidebar() {
  const pathname = usePathname();
  const locale = organizerLocaleFromPathname(pathname);
  const panel = organizerPanelPrefix(locale);
  const nav = NAV_COPY[locale].map((n) => ({
    href: `${panel}${n.hrefSuffix}`,
    label: n.label,
    icon: n.icon,
  }));
  const dashboardHref = panel;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sand-200 bg-white lg:block">
      <div className="sticky top-[72px] py-6 px-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#a09383] px-3 mb-3">
          {SIDEBAR_TITLE[locale]}
        </p>
        <nav className="space-y-0.5">
          {nav.map((n) => {
            const isActive = pathname === n.href || (n.href !== dashboardHref && pathname?.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sand-200 text-foreground'
                    : 'text-[#7a6b5d] hover:bg-sand-100 hover:text-foreground'
                }`}
              >
                <span className="text-base">{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
