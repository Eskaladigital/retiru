// ============================================================================
// RETIRU · Administrator panel layout — /administrator
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';

const NAV = [
  { href: '/administrator', label: 'Dashboard', icon: '📊' },
  { href: '/administrator/organizadores', label: 'Organizadores', icon: '👥' },
  { href: '/administrator/eventos', label: 'Retiros', icon: '📅' },
  { href: '/administrator/centros', label: 'Centros', icon: '🏢' },
  { href: '/administrator/tienda', label: 'Tienda', icon: '🛒' },
  { href: '/administrator/reembolsos', label: 'Reembolsos', icon: '💳' },
  { href: '/administrator/reporting', label: 'Reporting', icon: '📈' },
];

export const metadata: Metadata = {
  title: 'Panel de administración | Retiru',
  description: 'Panel de administración de Retiru',
  robots: { index: false, follow: false },
};

export default function AdministratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background antialiased">
        <Header locale="es" />
        <div className="flex min-h-[calc(100vh-72px)]">
          <aside className="hidden w-56 shrink-0 border-r border-sand-200 bg-white lg:block">
            <div className="sticky top-[72px] py-6 px-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-500 px-3 mb-3">Admin</p>
              <nav className="space-y-0.5">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#7a6b5d] hover:bg-sand-100 hover:text-foreground transition-colors">
                    <span className="text-base">{n.icon}</span> {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          <main className="flex-1 bg-cream-100 p-6 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
