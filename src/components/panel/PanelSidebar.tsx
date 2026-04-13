'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/es/panel', label: 'Dashboard', icon: '📊' },
  { href: '/es/panel/eventos', label: 'Mis retiros', icon: '📅' },
  { href: '/es/panel/asistentes', label: 'Asistentes', icon: '👥' },
  { href: '/es/panel/mensajes', label: 'Mensajes', icon: '💬' },
  { href: '/es/panel/resenas', label: 'Reseñas', icon: '⭐' },
  { href: '/es/panel/analiticas', label: 'Analíticas', icon: '📈' },
  { href: '/es/panel/verificacion', label: 'Verificación', icon: '✓' },
  { href: '/es/panel/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function PanelSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sand-200 bg-white lg:block">
      <div className="sticky top-[72px] py-6 px-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#a09383] px-3 mb-3">
          Panel organizador
        </p>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const isActive = pathname === n.href || (n.href !== '/es/panel' && pathname?.startsWith(n.href));
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
