// Layout panel organizador
import Link from 'next/link';
import Header from '@/components/layout/Header';

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

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header locale="es" />
      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="hidden w-60 shrink-0 border-r border-sand-200 bg-white lg:block">
          <div className="sticky top-[72px] py-6 px-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#a09383] px-3 mb-3">Panel organizador</p>
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
    </>
  );
}
