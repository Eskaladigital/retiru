'use client';

// ============================================================================
// RETIRU · Admin panel shell — sidebar colapsable, sin Header público
// ============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const NAV = [
  { href: '/administrator', label: 'Dashboard', icon: '📊' },
  { href: '/administrator/usuarios', label: 'Usuarios', icon: '👤' },
  { href: '/administrator/organizadores', label: 'Organizadores', icon: '👥' },
  { href: '/administrator/retiros', label: 'Retiros', icon: '📅' },
  { href: '/administrator/centros', label: 'Centros', icon: '🏢' },
  { href: '/administrator/claims', label: 'Claims', icon: '🔑' },
  { href: '/administrator/mensajes', label: 'Mensajes', icon: '💬' },
  { href: '/administrator/blog', label: 'Blog', icon: '✏️' },
  { href: '/administrator/tienda', label: 'Tienda', icon: '🛒' },
  { href: '/administrator/reembolsos', label: 'Reembolsos', icon: '💳' },
  { href: '/administrator/reporting', label: 'Reporting', icon: '📈' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/administrator' ? pathname === '/administrator' : pathname?.startsWith(href);

  const NavContent = () => (
    <nav className="space-y-0.5">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive(n.href) ? 'bg-terracotta-50 text-terracotta-700' : 'text-[#7a6b5d] hover:bg-sand-100 hover:text-foreground'
          }`}
        >
          <span className="text-base">{n.icon}</span> {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Barra móvil con botón menú */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-sand-200 flex items-center justify-between px-4">
        <Link href="/administrator" className="font-serif text-xl text-terracotta-700">retiru</Link>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — desktop: fijo | móvil: drawer colapsable */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-sand-200 bg-white transform transition-transform duration-200 ease-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 flex-1 flex flex-col pt-6 lg:pt-6 pb-4 px-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-500 px-3 mb-3">Admin</p>
          <NavContent />
          <div className="mt-auto pt-4 border-t border-sand-200">
            <a
              href="/es"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#7a6b5d] hover:bg-sand-100 hover:text-foreground transition-colors"
            >
              <span className="text-base">🌐</span> Ver web
              <svg className="w-3.5 h-3.5 ml-auto opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
